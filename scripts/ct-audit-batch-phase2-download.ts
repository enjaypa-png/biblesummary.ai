/**
 * Phase 2: Download Audit results and apply PASS verses to Supabase.
 * FAIL verses trigger Phase 3 auto-correction (real-time).
 * Phase 3 PASS → apply to DB. Phase 3 FAIL → escalate (ct-audit-escalated-fail.jsonl).
 *
 * Two-agent verification: nothing is written without audit PASS.
 *
 * Usage:
 *   npm run ct:audit:batch:phase2:download
 *   npm run ct:audit:batch:phase2:download -- --dry-run
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { runPhase3 } from './ct-audit-phase3';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BATCH_DIR = path.join(process.cwd(), 'data', 'translations', 'ct-audit-batch');
const ESCALATED_PATH = path.join(process.cwd(), 'data', 'translations', 'ct-audit-escalated-fail.jsonl');

interface AuditResult {
  verse: number;
  pass: boolean;
  reason?: string;
}

function parseAuditResponse(raw: string): AuditResult[] {
  let cleaned = raw.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) cleaned = jsonMatch[1].trim();
  const parsed = JSON.parse(cleaned) as AuditResult[];
  if (!Array.isArray(parsed)) throw new Error('Not a JSON array');
  return parsed;
}

function appendEscalated(entry: object): void {
  const dir = path.dirname(ESCALATED_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(ESCALATED_PATH, JSON.stringify(entry) + '\n', 'utf-8');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const jsonSummary = process.argv.includes('--json-summary');

  const phase2Path = path.join(BATCH_DIR, 'phase2_latest.json');
  if (!fs.existsSync(phase2Path)) {
    console.error('❌ No Phase 2 batch found. Run ct:audit:batch:phase2:submit first.');
    process.exit(1);
  }

  const phase2Info = JSON.parse(fs.readFileSync(phase2Path, 'utf-8'));
  const { phase1_batch_id, phase2_batch_id } = phase2Info;

  const phase1Path = path.join(BATCH_DIR, `phase1_results_${phase1_batch_id}.json`);
  if (!fs.existsSync(phase1Path)) {
    console.error(`❌ Phase 1 results not found: ${phase1Path}`);
    process.exit(1);
  }

  const phase1 = JSON.parse(fs.readFileSync(phase1Path, 'utf-8'));
  const phase1Results = phase1.results as Record<string, { book_id: string; book_name: string; chapter: number; verses: { verse: number; text: string }[] }>;

  const batch = await anthropic.messages.batches.retrieve(phase2_batch_id);
  if (batch.processing_status !== 'ended') {
    console.log(`\n  ⏳ Phase 2 batch still ${batch.processing_status}. Try again later.`);
    return;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CT Audit Batch Phase 2 — Download (Apply PASS only)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (dryRun) console.log('  🏜️  DRY RUN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let applied = 0;
  let phase3Applied = 0;
  let phase3Escalated = 0;
  let errors = 0;
  let totalVerses = 0;

  const resultsStream = await anthropic.messages.batches.results(phase2_batch_id);
  for await (const result of resultsStream) {
    const phase1Data = phase1Results[result.custom_id];
    if (!phase1Data) continue;

    const label = `${phase1Data.book_name} ${phase1Data.chapter}`;

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

    let auditResults: AuditResult[];
    try {
      auditResults = parseAuditResponse(textBlock.text);
    } catch {
      console.error(`   ❌ ${label}: JSON parse failed`);
      errors++;
      continue;
    }

    const ctByVerse = new Map(phase1Data.verses.map((v) => [v.verse, v.text]));
    totalVerses += phase1Data.verses.length;

    const { data: kjvRows } = await supabase
      .from('verses')
      .select('verse, text')
      .eq('book_id', phase1Data.book_id)
      .eq('chapter', phase1Data.chapter)
      .eq('translation', 'kjv')
      .order('verse');
    const kjvByVerse = new Map((kjvRows ?? []).map((r) => [r.verse, r.text]));

    let passCount = 0;
    let failCount = 0;

    for (const ar of auditResults) {
      const ctText = ctByVerse.get(ar.verse);
      if (!ctText) continue;

      if (ar.pass) {
        passCount++;
        if (!dryRun) {
          const { error } = await supabase
            .from('verses')
            .update({ text: ctText })
            .eq('book_id', phase1Data.book_id)
            .eq('chapter', phase1Data.chapter)
            .eq('verse', ar.verse)
            .eq('translation', 'ct');
          if (error) errors++;
          else applied++;
        }
      } else {
        failCount++;
        const kjv = kjvByVerse.get(ar.verse) ?? '[MISSING KJV]';
        const ref = `${phase1Data.book_name} ${phase1Data.chapter}:${ar.verse}`;

        try {
          const phase3 = await runPhase3(kjv, ctText, ar.reason ?? 'No reason');
          if (phase3.pass) {
            if (!dryRun) {
              const { error } = await supabase
                .from('verses')
                .update({ text: phase3.corrected })
                .eq('book_id', phase1Data.book_id)
                .eq('chapter', phase1Data.chapter)
                .eq('verse', ar.verse)
                .eq('translation', 'ct');
              if (error) errors++;
              else phase3Applied++;
            }
          } else {
            if (!dryRun) {
              appendEscalated({
                ref,
                kjv,
                failed_ct: ctText,
                phase3_corrected: phase3.corrected,
                phase2_reason: ar.reason ?? 'No reason',
                phase3_reason: phase3.reason ?? 'No reason'
              });
              phase3Escalated++;
            }
          }
        } catch (err) {
          console.error(`   ❌ Phase 3 ${ref}:`, (err as Error).message);
          if (!dryRun) {
            appendEscalated({
              ref,
              kjv,
              failed_ct: ctText,
              phase3_error: (err as Error).message,
              phase2_reason: ar.reason ?? 'No reason'
            });
            phase3Escalated++;
          }
        }
      }
    }

    if (passCount > 0) {
      console.log(`   ✅ ${label}: ${passCount} verses applied`);
    }
    if (failCount > 0) {
      console.log(`   ⚠️  ${label}: ${failCount} verses → Phase 3`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(
    `  Done. Applied: ${applied} | Phase 3 applied: ${phase3Applied} | Phase 3 escalated: ${phase3Escalated} | Errors: ${errors}`
  );
  if (phase3Escalated > 0) {
    console.log(`  Escalated log: ${ESCALATED_PATH}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (jsonSummary) {
    const summary = {
      totalVerses,
      phase2Pass: applied,
      phase3Corrected: phase3Applied,
      escalations: phase3Escalated,
      errors
    };
    console.log(`\nCT_FULL_RUN_JSON:${JSON.stringify(summary)}`);
  }
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
