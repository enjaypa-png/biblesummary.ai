/**
 * Verify CT Audit Batch results - ensure API returned all results (no billing cutoff, etc.)
 *
 * Usage:
 *   npm run ct:audit:batch:verify                    # Latest batch
 *   npm run ct:audit:batch:verify -- --id msgbatch_xxx
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BATCH_DIR = path.join(process.cwd(), 'data', 'translations', 'ct-audit-batch');

async function main() {
  const args = process.argv.slice(2);
  let batchId: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id' && args[i + 1]) {
      batchId = args[i + 1];
      i++;
    }
  }

  if (!batchId) {
    const latestPath = path.join(BATCH_DIR, 'latest.json');
    if (!fs.existsSync(latestPath)) {
      console.error('❌ No audit batch found. Run ct:audit:batch:submit first.');
      process.exit(1);
    }
    batchId = JSON.parse(fs.readFileSync(latestPath, 'utf-8')).batch_id;
  } else {
    const batchPath = path.join(BATCH_DIR, `batch_${batchId}.json`);
    if (!fs.existsSync(batchPath)) {
      console.error('❌ No batch info file found.');
      process.exit(1);
    }
  }

  const batch = await anthropic.messages.batches.retrieve(batchId!);

  if (batch.processing_status !== 'ended') {
    console.error(`❌ Batch status: ${batch.processing_status}. Cannot verify until ended.`);
    process.exit(1);
  }

  const expected = batch.request_counts.succeeded + batch.request_counts.errored;
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CT Audit Batch Verify');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Batch ID:  ${batchId}`);
  console.log(`  Expected:  ${expected} results (${batch.request_counts.succeeded} succeeded, ${batch.request_counts.errored} errored)`);
  console.log('  Streaming results...\n');

  let received = 0;
  let succeeded = 0;
  let errored = 0;
  const resultsStream = await anthropic.messages.batches.results(batchId!);

  for await (const result of resultsStream) {
    received++;
    if (result.result.type === 'succeeded') succeeded++;
    else errored++;
  }

  const match = received === expected;
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Received:  ${received} (${succeeded} succeeded, ${errored} errored)`);
  console.log(`  Expected:  ${expected}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (match) {
    console.log('  ✅ VERIFIED: API returned all results. No billing/stream cutoff detected.\n');
  } else {
    console.log('  ❌ MISMATCH: Received != expected. Possible billing or stream cutoff.\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
