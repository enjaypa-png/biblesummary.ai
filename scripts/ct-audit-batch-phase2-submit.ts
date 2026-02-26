/**
 * Phase 2: Submit Audit batch (Two-agent verification)
 *
 * Reads Phase 1 (Rewrite) results and submits audit requests.
 * For each chapter, the Audit Agent evaluates KJV vs new CT → PASS or FAIL per verse.
 * Phase 2 download will apply only PASS verses; FAIL goes to manual review.
 *
 * Usage:
 *   npm run ct:audit:batch:phase2:submit
 *   npm run ct:audit:batch:phase2:submit -- --phase1-id msgbatch_xxx
 *   npm run ct:audit:batch:phase2:submit -- --dry-run
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BATCH_DIR = path.join(process.cwd(), 'data', 'translations', 'ct-audit-batch');
const MODEL = 'claude-opus-4-6';
const MAX_TOKENS = 8192;
const MANUAL_REVIEW_PATH = path.join(process.cwd(), 'data', 'translations', 'ct-audit-manual-review.jsonl');

const AUDIT_SYSTEM = `You are the Audit Agent. Evaluate strict semantic equivalence between each KJV verse and its modernized CT.

For each verse, output PASS or FAIL.

Output EXACTLY a JSON array with one object per verse: [{"verse": N, "pass": true|false, "reason": "..."}]
- "pass": true if meaning is preserved; false if meaning added, removed, altered, or implication introduced.
- "reason": required only when pass is false (one sentence).

FAIL if the CT: adds meaning, removes meaning, alters tone, changes emotional intensity, or introduces implication not present in the KJV.

Rules:
- When clarity and precision conflict, precision wins.
- No interpretation, psychological language, or romantic implication.
- No softening or intensifying language.
Output ONLY the JSON array.`;

function buildAuditUserPrompt(
  bookName: string,
  chapter: number,
  verses: { verse: number; kjv: string; ct: string }[]
): string {
  const lines = [`Audit ${bookName} chapter ${chapter}.`, ''];
  for (const v of verses) {
    lines.push(`--- Verse ${v.verse} ---`);
    lines.push(`KJV: ${v.kjv}`);
    lines.push(`CT:  ${v.ct}`);
    lines.push('');
  }
  lines.push('Output JSON array: [{"verse": N, "pass": true|false, "reason": "..."}]');
  return lines.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  let phase1Id: string | null = null;
  let dryRun = false;
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--phase1-id' || args[i] === '--id') && args[i + 1]) {
      phase1Id = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  if (!phase1Id) {
    const latestPath = path.join(BATCH_DIR, 'latest.json');
    if (!fs.existsSync(latestPath)) {
      console.error('❌ No batch found. Run ct:audit:batch:submit and ct:audit:batch:download first.');
      process.exit(1);
    }
    phase1Id = JSON.parse(fs.readFileSync(latestPath, 'utf-8')).batch_id;
  }

  const phase1Path = path.join(BATCH_DIR, `phase1_results_${phase1Id}.json`);
  if (!fs.existsSync(phase1Path)) {
    console.error(`❌ Phase 1 results not found: ${phase1Path}`);
    console.error('   Run ct:audit:batch:download (without --skip-verify) first.');
    process.exit(1);
  }

  const phase1 = JSON.parse(fs.readFileSync(phase1Path, 'utf-8'));
  const { results } = phase1;

  // We need KJV text for each verse. Phase 1 has book_id, chapter, verses. We need to fetch KJV from Supabase.
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  const requests: { custom_id: string; params: { model: string; max_tokens: number; temperature: number; system: string; messages: { role: 'user'; content: string }[] } }[] = [];
  const chapterMap: { custom_id: string; book_id: string; book_name: string; chapter: number }[] = [];

  for (const [customId, data] of Object.entries(results as Record<string, { book_id: string; book_name: string; chapter: number; verses: { verse: number; text: string }[] }>)) {
    const { data: kjvRows } = await supabase
      .from('verses')
      .select('verse, text')
      .eq('book_id', data.book_id)
      .eq('chapter', data.chapter)
      .eq('translation', 'kjv')
      .order('verse');

    if (!kjvRows?.length) continue;

    const kjvByVerse = new Map(kjvRows.map((r) => [r.verse, r.text]));
    const verses = data.verses.map((v) => ({
      verse: v.verse,
      kjv: kjvByVerse.get(v.verse) ?? '[MISSING]',
      ct: v.text
    }));

    const userPrompt = buildAuditUserPrompt(data.book_name, data.chapter, verses);

    requests.push({
      custom_id: customId,
      params: {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: 0,
        system: AUDIT_SYSTEM,
        messages: [{ role: 'user', content: userPrompt }]
      }
    });
    chapterMap.push({
      custom_id: customId,
      book_id: data.book_id,
      book_name: data.book_name,
      chapter: data.chapter
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CT Audit Batch Phase 2 — Submit (Audit)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Phase 1 batch: ${phase1Id}`);
  console.log(`  Chapters: ${requests.length}`);
  if (dryRun) console.log('  🏜️  DRY RUN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (requests.length === 0) {
    console.log('   Nothing to submit.');
    return;
  }

  if (dryRun) {
    console.log('   🏜️  DRY RUN complete. Remove --dry-run to submit.');
    return;
  }

  const batch = await anthropic.messages.batches.create({ requests });

  const phase2Info = {
    phase1_batch_id: phase1Id,
    phase2_batch_id: batch.id,
    submitted_at: new Date().toISOString(),
    chapter_map: chapterMap
  };

  fs.writeFileSync(path.join(BATCH_DIR, `phase2_${batch.id}.json`), JSON.stringify(phase2Info, null, 2));
  fs.writeFileSync(path.join(BATCH_DIR, 'phase2_latest.json'), JSON.stringify(phase2Info, null, 2));

  console.log(`\n   ✅ Phase 2 batch submitted! ID: ${batch.id}`);
  console.log(`\n   Next: npm run ct:audit:batch:phase2:status`);
  console.log(`   Then: npm run ct:audit:batch:phase2:download`);
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
