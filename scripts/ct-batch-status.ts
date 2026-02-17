/**
 * Check status of CT Batch Job
 *
 * Usage:
 *   npm run ct:batch:status                         # Check latest batch
 *   npm run ct:batch:status -- --id msgbatch_xxx     # Check specific batch
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BATCH_DIR = path.join(process.cwd(), 'data', 'translations', 'ct-batch');

async function main() {
  // Get batch ID from args or latest file
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
      console.error('❌ No batch found. Run ct:batch:submit first.');
      process.exit(1);
    }
    const latest = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
    batchId = latest.batch_id;
  }

  console.log(`\n   Checking batch: ${batchId}\n`);

  const batch = await anthropic.messages.batches.retrieve(batchId!);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CT Batch Status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Batch ID:    ${batch.id}`);
  console.log(`  Status:      ${batch.processing_status}`);
  console.log(`  Created:     ${batch.created_at}`);

  if (batch.ended_at) {
    console.log(`  Ended:       ${batch.ended_at}`);
  }
  if (batch.expires_at) {
    console.log(`  Expires:     ${batch.expires_at}`);
  }

  const counts = batch.request_counts;
  console.log(`\n  Results:`);
  console.log(`    Succeeded: ${counts.succeeded}`);
  console.log(`    Errored:   ${counts.errored}`);
  console.log(`    Canceled:  ${counts.canceled}`);
  console.log(`    Expired:   ${counts.expired}`);
  console.log(`    Processing: ${counts.processing}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (batch.processing_status === 'ended') {
    console.log('\n  ✅ Batch complete! Run: npm run ct:batch:download');
  } else {
    console.log('\n  ⏳ Still processing. Check again in a few minutes.');
  }
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
