/**
 * Full Old Testament Run — Sequential book-level execution
 *
 * For each book (Genesis → Malachi):
 *   Phase 1 rewrite → Phase 2 audit → Phase 3 auto-correction → Apply
 *
 * Logs per-book summary to ct-full-run-log.jsonl.
 * Pauses if escalations > 5% of verses in a book.
 *
 * Usage:
 *   npm run ct:audit:full:run
 *   npm run ct:audit:full:run -- --estimate  # Cost estimate only, do not run
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const BATCH_DIR = path.join(process.cwd(), 'data', 'translations', 'ct-audit-batch');
const LOG_PATH = path.join(process.cwd(), 'data', 'translations', 'ct-full-run-log.jsonl');
const POLL_INTERVAL_MS = 30000;
const MAX_POLLS = 60;

function run(cmd: string): string {
  return execSync(cmd, { cwd: process.cwd(), encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
}

async function pollUntilEnded(phase: 'phase1' | 'phase2'): Promise<void> {
  for (let i = 0; i < MAX_POLLS; i++) {
    const out = run(`npm run ct:audit:batch:${phase === 'phase1' ? 'status' : 'phase2:status'} 2>&1`);
    if (out.includes('Status:') && /Status:\s*ended/.test(out)) return;
    if (i < MAX_POLLS - 1) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }
  throw new Error(`${phase} batch did not complete in time`);
}

async function runBook(bookName: string): Promise<{ totalVerses: number; phase2Pass: number; phase3Corrected: number; escalations: number; errors: number } | null> {
  run(`npm run ct:audit:batch:submit -- --book ${JSON.stringify(bookName)} 2>&1`);
  await pollUntilEnded('phase1');
  run(`npm run ct:audit:batch:download 2>&1`);
  run(`npm run ct:audit:batch:phase2:submit 2>&1`);
  await pollUntilEnded('phase2');
  const out = run(`npm run ct:audit:batch:phase2:download -- --json-summary 2>&1`);
  const m = out.match(/CT_FULL_RUN_JSON:(.+)/);
  if (!m) return null;
  return JSON.parse(m[1].trim());
}

function appendLog(entry: object): void {
  const dir = path.dirname(LOG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n', 'utf-8');
}

async function main() {
  const estimateOnly = process.argv.includes('--estimate');
  const args = process.argv.slice(2);
  let fromBook: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--from-book' && args[i + 1]) {
      fromBook = args[i + 1];
      i++;
    }
  }

  const { data: books } = await supabase
    .from('books')
    .select('id, name, slug, total_chapters')
    .eq('testament', 'Old')
    .order('order_index');

  if (!books?.length) {
    console.error('❌ No Old Testament books found.');
    process.exit(1);
  }

  let filteredBooks = books;
  if (fromBook) {
    const startIndex = books.findIndex((b) => (b.name as string) === fromBook);
    if (startIndex === -1) {
      console.error(`❌ from-book "${fromBook}" not found in Old Testament books.`);
      process.exit(1);
    }
    filteredBooks = books.slice(startIndex);
  }

  let totalChapters = 0;
  let totalVerses = 0;
  for (const b of filteredBooks) {
    totalChapters += (b.total_chapters as number) || 0;
    const { count } = await supabase
      .from('verses')
      .select('*', { count: 'exact', head: true })
      .eq('book_id', b.id)
      .eq('translation', 'kjv');
    totalVerses += count ?? 0;
  }

  const phase1Est = (totalChapters * 2500 * 37.5) / 1_000_000;
  const phase2Est = (totalChapters * 2000 * 37.5) / 1_000_000;
  const phase3Est = (totalVerses * 0.05 * 2 * 500 * 15) / 1_000_000;
  const costLow = (phase1Est + phase2Est) * 0.5 + phase3Est * 0.5;
  const costHigh = (phase1Est + phase2Est) * 1.5 + phase3Est * 1.5;

  console.log('Old Testament Full Run — Cost Estimate');
  console.log(`  Books: ${filteredBooks.length} | Chapters: ~${totalChapters} | Verses: ~${totalVerses}`);
  console.log(`  Estimated API cost: $${costLow.toFixed(0)}–$${costHigh.toFixed(0)}`);

  if (estimateOnly) {
    console.log('\n  Run without --estimate to start this OT segment.');
    return;
  }

  if (fromBook) {
    console.log(`\n  Resuming from book: ${fromBook} (remaining: ${filteredBooks.length} books)\n`);
  } else {
    console.log('\n  Starting full Old Testament run...\n');
  }

  const agg = { totalVerses: 0, phase2Pass: 0, phase3Corrected: 0, escalations: 0, errors: 0, booksDone: 0 };

  for (const book of filteredBooks) {
    const name = book.name as string;
    try {
      const s = await runBook(name);
      if (!s) {
        console.log(`  ${name}: (no summary)`);
        continue;
      }
      agg.totalVerses += s.totalVerses;
      agg.phase2Pass += s.phase2Pass;
      agg.phase3Corrected += s.phase3Corrected;
      agg.escalations += s.escalations;
      agg.errors += s.errors;
      agg.booksDone++;

      const pct = s.totalVerses > 0 ? (100 * s.escalations) / s.totalVerses : 0;
      appendLog({
        book: name,
        totalVerses: s.totalVerses,
        phase2Pass: s.phase2Pass,
        phase3Corrected: s.phase3Corrected,
        escalations: s.escalations,
        errors: s.errors,
        escalationPct: Math.round(pct * 10) / 10
      });

      console.log(`  ${name}: ${s.totalVerses} v | P2:${s.phase2Pass} P3:${s.phase3Corrected} esc:${s.escalations} err:${s.errors}`);

      if (pct > 5) {
        console.error(`\n  ⛔ PAUSE: ${name} escalations (${pct.toFixed(1)}%) > 5%. Review before continuing.`);
        process.exit(1);
      }
    } catch (err) {
      console.error(`  ${name}: FAILED —`, (err as Error).message);
      appendLog({
        book: name,
        error: (err as Error).message,
        totalVerses: 0,
        phase2Pass: 0,
        phase3Corrected: 0,
        escalations: 0,
        errors: 1
      });
      agg.errors++;
      throw err;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  OLD TESTAMENT COMPLETE');
  console.log(`  Books: ${agg.booksDone} | Verses: ${agg.totalVerses}`);
  console.log(`  Phase 2 PASS: ${agg.phase2Pass} | Phase 3 corrected: ${agg.phase3Corrected}`);
  console.log(`  Escalations: ${agg.escalations} | Errors: ${agg.errors}`);
  console.log(`  Log: ${LOG_PATH}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
