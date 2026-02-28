/**
 * Phase 2: Check Audit batch status
 *
 * Usage:
 *   npm run ct:audit:batch:phase2:status
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BATCH_DIR = path.join(process.cwd(), 'data', 'translations', 'ct-audit-batch');

async function main() {
  const latestPath = path.join(BATCH_DIR, 'phase2_latest.json');
  if (!fs.existsSync(latestPath)) {
    console.error('❌ No Phase 2 batch found. Run ct:audit:batch:phase2:submit first.');
    process.exit(1);
  }

  const { phase2_batch_id } = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
  const batch = await anthropic.messages.batches.retrieve(phase2_batch_id);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CT Audit Batch Phase 2 — Status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Batch ID:    ${batch.id}`);
  console.log(`  Status:      ${batch.processing_status}`);
  console.log(`  Created:     ${batch.created_at}`);
  if (batch.ended_at) console.log(`  Ended:       ${batch.ended_at}`);
  const c = batch.request_counts;
  console.log(`\n  Succeeded: ${c.succeeded} | Errored: ${c.errored} | Processing: ${c.processing}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (batch.processing_status === 'ended') {
    console.log('\n  ✅ Complete! Run: npm run ct:audit:batch:phase2:download');
  }
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
