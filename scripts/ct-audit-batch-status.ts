/**
 * Check status of CT Audit Batch
 *
 * Usage:
 *   npm run ct:audit:batch:status                    # Latest audit batch
 *   npm run ct:audit:batch:status -- --id msgbatch_xxx
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
  }

  const batch = await anthropic.messages.batches.retrieve(batchId!);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CT Audit Batch Status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Batch ID:    ${batch.id}`);
  console.log(`  Status:      ${batch.processing_status}`);
  console.log(`  Created:     ${batch.created_at}`);
  if (batch.ended_at) console.log(`  Ended:       ${batch.ended_at}`);
  const c = batch.request_counts;
  console.log(`\n  Succeeded: ${c.succeeded} | Errored: ${c.errored} | Processing: ${c.processing}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (batch.processing_status === 'ended') {
    console.log('\n  ✅ Complete! Run: npm run ct:audit:batch:download');
    console.log('  Then: npm run ct:audit:batch:phase2:submit (for two-agent verification)');
  }
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
