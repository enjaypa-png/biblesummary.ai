/**
 * Download Phase 1 (Rewrite) results. Saves to file for Phase 2 Audit.
 * Two-agent flow: Phase 1 = Rewrite, Phase 2 = Audit (PASS only applied).
 *
 * Usage:
 *   npm run ct:audit:batch:download                  # Save phase 1 for verification
 *   npm run ct:audit:batch:download -- --id msgbatch_xxx
 *   npm run ct:audit:batch:download -- --skip-verify # Apply directly (no audit) - not recommended
 *   npm run ct:audit:batch:download -- --dry-run     # Preview
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BATCH_DIR = path.join(process.cwd(), 'data', 'translations', 'ct-audit-batch');

interface ChapterMap {
  custom_id: string;
  book_id: number;
  book_slug: string;
  book_name: string;
  chapter: number;
}

interface BatchInfo {
  batch_id: string;
  chapter_map: ChapterMap[];
}

function parseVerseResponse(raw: string): { verse: number; text: string }[] {
  let cleaned = raw.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) cleaned = jsonMatch[1].trim();
  const parsed = JSON.parse(cleaned) as { verse: number; text: string }[];
  if (!Array.isArray(parsed)) throw new Error('Not a JSON array');
  return parsed;
}

async function main() {
  const args = process.argv.slice(2);
  let batchId: string | null = null;
  let dryRun = false;
  let skipVerify = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id' && args[i + 1]) {
      batchId = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--skip-verify') {
      skipVerify = true;
    }
  }

  let batchInfo: BatchInfo;
  if (!batchId) {
    const latestPath = path.join(BATCH_DIR, 'latest.json');
    if (!fs.existsSync(latestPath)) {
      console.error('❌ No audit batch found. Run ct:audit:batch:submit first.');
      process.exit(1);
    }
    batchInfo = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
    batchId = batchInfo.batch_id;
  } else {
    const batchPath = path.join(BATCH_DIR, `batch_${batchId}.json`);
    if (!fs.existsSync(batchPath)) {
      console.error('❌ No batch info file found.');
      process.exit(1);
    }
    batchInfo = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
  }

  const batch = await anthropic.messages.batches.retrieve(batchId!);

  if (batch.processing_status !== 'ended') {
    console.log(`\n  ⏳ Batch still ${batch.processing_status}. Try again later.`);
    return;
  }

  const lookup = new Map<string, ChapterMap>();
  for (const e of batchInfo.chapter_map) lookup.set(e.custom_id, e);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CT Audit Batch Download (Phase 1)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (dryRun) console.log('  🏜️  DRY RUN');
  if (skipVerify) console.log('  ⚠️  SKIP VERIFY — applying without audit (not recommended)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const phase1Results: Record<string, { book_id: string; book_name: string; chapter: number; verses: { verse: number; text: string }[] }> = {};
  let applied = 0;
  let errors = 0;

  const resultsStream = await anthropic.messages.batches.results(batchId!);
  for await (const result of resultsStream) {
    const info = lookup.get(result.custom_id);
    if (!info) continue;

    const label = `${info.book_name} ${info.chapter}`;

    if (result.result.type !== 'succeeded') {
      console.error(`   ❌ ${label}: ${result.result.type}`);
      errors++;
      continue;
    }

    const textBlock = result.result.message.content.find((b: { type: string }) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      console.error(`   ❌ ${label}: No text`);
      errors++;
      continue;
    }

    let corrected: { verse: number; text: string }[];
    try {
      corrected = parseVerseResponse(textBlock.text);
    } catch {
      console.error(`   ❌ ${label}: JSON parse failed`);
      errors++;
      continue;
    }

    phase1Results[result.custom_id] = {
      book_id: String(info.book_id),
      book_name: info.book_name,
      chapter: info.chapter,
      verses: corrected
    };

    if (skipVerify && !dryRun) {
      for (const { verse, text } of corrected) {
        const { error } = await supabase
          .from('verses')
          .update({ text })
          .eq('book_id', info.book_id)
          .eq('chapter', info.chapter)
          .eq('verse', verse)
          .eq('translation', 'ct');
        if (error) errors++;
        else applied++;
      }
    }

    if (corrected.length > 0) {
      const action = dryRun ? 'would process' : skipVerify ? 'updated' : 'saved for Phase 2';
      console.log(`   ✅ ${label}: ${corrected.length} verses ${action}`);
    }
  }

  if (!skipVerify && !dryRun && Object.keys(phase1Results).length > 0) {
    const phase1Path = path.join(BATCH_DIR, `phase1_results_${batchId}.json`);
    fs.writeFileSync(phase1Path, JSON.stringify({ batch_id: batchId, results: phase1Results }, null, 2));
    console.log(`\n   📁 Phase 1 results saved to ${path.relative(process.cwd(), phase1Path)}`);
    console.log(`\n   Next: npm run ct:audit:batch:phase2:submit`);
    console.log(`   Then: npm run ct:audit:batch:phase2:status`);
    console.log(`   Finally: npm run ct:audit:batch:phase2:download`);
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  if (skipVerify) {
    console.log(`  Done. ${dryRun ? 'Would update' : 'Updated'}: ${applied} verses. Errors: ${errors}`);
  } else {
    console.log(`  Done. ${dryRun ? 'Would save' : 'Saved'} ${Object.keys(phase1Results).length} chapters for Phase 2 audit. Errors: ${errors}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
