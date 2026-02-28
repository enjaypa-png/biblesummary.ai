/**
 * CT Audit & Fix — Two-Agent System with Automatic Retry
 *
 * For each verse:
 *   1. Rewrite Agent: KJV → modern English (10th grade, preserve meaning)
 *   2. Audit Agent: Evaluate semantic equivalence → PASS or FAIL + reason
 *   3. If FAIL: Send reason to Rewrite Agent, retry (max 3 attempts)
 *   4. If PASS: Store in Supabase
 *   5. If FAIL after 3 attempts: Log to manual review file, do not store
 *
 * Usage:
 *   npm run ct:audit:fix                              # All books with CT
 *   npm run ct:audit:fix -- --book ruth               # One book
 *   npm run ct:audit:fix -- --book genesis --chapter 1 # One chapter
 *   npm run ct:audit:fix -- --limit 50                # Max 50 verses (testing)
 *   npm run ct:audit:fix -- --dry-run                 # No DB writes
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase env vars');
  process.exit(1);
}
if (!anthropicApiKey) {
  console.error('❌ Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const anthropic = new Anthropic({ apiKey: anthropicApiKey });

const MODEL = 'claude-opus-4-6';
const MAX_TOKENS = 512;
const TEMPERATURE = 0.2;
const MAX_REWRITE_ATTEMPTS = 3;
const MANUAL_REVIEW_PATH = path.join(process.cwd(), 'data', 'translations', 'ct-audit-manual-review.jsonl');

// ─── Prompts ─────────────────────────────────────────────────────────────────

const REWRITE_SYSTEM = `You are the Rewrite Agent. Rewrite the KJV verse into clear modern English at a 10th-grade reading level. Preserve exact meaning.

Rules:
- When clarity and precision conflict, choose precision.
- Never add interpretation, psychological language, or romantic implication.
- Never soften intensity or insert modern explanatory categories.
- Output ONLY the rewritten verse. No commentary.`;

const AUDIT_SYSTEM = `You are the Audit Agent. Evaluate strict semantic equivalence between the KJV verse and the modernized verse.

You must NOT rewrite. Only evaluate.

Output EXACTLY one of:
PASS
or
FAIL
Reason: (one sentence max)

Fail if the modernized verse: adds meaning, removes meaning, alters tone, changes emotional intensity, or introduces implication not present in the KJV.`;

function buildRewriteUserPrompt(kjv: string, feedback?: string): string {
  if (feedback) {
    return `KJV: ${kjv}\n\nPrevious attempt was rejected. Correction: ${feedback}\n\nRewritten verse only:`;
  }
  return `KJV: ${kjv}\n\nRewritten verse only:`;
}

function buildAuditUserPrompt(kjv: string, modernized: string): string {
  return `KJV: ${kjv}\n\nModernized: ${modernized}\n\nPASS or FAIL?`;
}

// ─── Parse Audit Response ────────────────────────────────────────────────────

function parseAuditResponse(raw: string): { pass: boolean; reason?: string } {
  const text = raw.trim().toUpperCase();
  if (text.startsWith('PASS')) {
    return { pass: true };
  }
  if (text.startsWith('FAIL')) {
    const reasonMatch = raw.match(/Reason:\s*(.+?)(?:\n|$)/i);
    return { pass: false, reason: reasonMatch?.[1]?.trim() ?? 'No reason given' };
  }
  // Fallback: treat as FAIL if unclear
  return { pass: false, reason: raw.slice(0, 100) };
}

// ─── API Calls ───────────────────────────────────────────────────────────────

async function callRewrite(kjv: string, feedback?: string): Promise<string> {
  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: REWRITE_SYSTEM,
    messages: [{ role: 'user', content: buildRewriteUserPrompt(kjv, feedback) }]
  });
  const block = resp.content.find((c) => c.type === 'text');
  if (!block || block.type !== 'text') throw new Error('No text in rewrite response');
  return block.text.trim();
}

async function callAudit(kjv: string, modernized: string): Promise<{ pass: boolean; reason?: string }> {
  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0,
    system: AUDIT_SYSTEM,
    messages: [{ role: 'user', content: buildAuditUserPrompt(kjv, modernized) }]
  });
  const block = resp.content.find((c) => c.type === 'text');
  if (!block || block.type !== 'text') throw new Error('No text in audit response');
  return parseAuditResponse(block.text);
}

// ─── CLI Args ───────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let books: string[] = [];
  let chapters: number[] | null = null;
  let dryRun = false;
  let limit: number | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--book' && args[i + 1]) {
      books.push(args[i + 1].trim());
      i++;
    } else if (args[i] === '--books' && args[i + 1]) {
      books.push(...args[i + 1].split(',').map((b) => b.trim()));
      i++;
    } else if (args[i] === '--chapter' && args[i + 1]) {
      chapters = [parseInt(args[i + 1], 10)];
      i++;
    } else if (args[i] === '--chapters' && args[i + 1]) {
      const val = args[i + 1];
      if (val.includes('-')) {
        const [start, end] = val.split('-').map(Number);
        chapters = [];
        for (let c = start; c <= end; c++) chapters.push(c);
      } else {
        chapters = [parseInt(val, 10)];
      }
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    }
  }
  return { books, chapters, dryRun, limit };
}

// ─── Update Supabase / Log Manual Review ─────────────────────────────────────

async function updateVerse(bookId: number, chapter: number, verse: number, text: string): Promise<boolean> {
  const { error } = await supabase
    .from('verses')
    .upsert(
      { book_id: bookId, chapter, verse, text, translation: 'ct' },
      { onConflict: 'book_id,chapter,verse,translation' }
    );
  return !error;
}

function appendManualReview(entry: {
  ref: string;
  kjv: string;
  attempts: number;
  fail_reasons: string[];
  last_attempt?: string;
}): void {
  const dir = path.dirname(MANUAL_REVIEW_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(MANUAL_REVIEW_PATH, JSON.stringify(entry) + '\n', 'utf-8');
}

// ─── Main Loop ───────────────────────────────────────────────────────────────

async function main() {
  const { books: bookFilter, chapters: chapterFilter, dryRun, limit } = parseArgs();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CT Audit & Fix (Two-Agent + Retry)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Model: ${MODEL}`);
  if (bookFilter.length) console.log(`  Books: ${bookFilter.join(', ')}`);
  if (chapterFilter) console.log(`  Chapters: ${chapterFilter?.join(', ')}`);
  if (limit) console.log(`  Limit: ${limit} verses`);
  if (dryRun) console.log('  🏜️  DRY RUN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let query = supabase.from('books').select('id, slug, name, total_chapters').order('order_index');
  if (bookFilter.length) query = query.in('slug', bookFilter);

  const { data: books, error } = await query;
  if (error || !books?.length) {
    console.error('❌ No books found.');
    process.exit(1);
  }

  let stored = 0;
  let manualReview = 0;
  let apiErrors = 0;
  let versesProcessed = 0;

  for (const book of books) {
    const chaptersToProcess = chapterFilter
      ? chapterFilter.filter((c) => c >= 1 && c <= book.total_chapters)
      : Array.from({ length: book.total_chapters }, (_, i) => i + 1);

    for (const chapter of chaptersToProcess) {
      if (limit !== null && versesProcessed >= limit) break;

      const { data: kjvRows } = await supabase
        .from('verses')
        .select('verse, text')
        .eq('book_id', book.id)
        .eq('chapter', chapter)
        .eq('translation', 'kjv')
        .order('verse');

      const { data: ctRows } = await supabase
        .from('verses')
        .select('verse, text')
        .eq('book_id', book.id)
        .eq('chapter', chapter)
        .eq('translation', 'ct')
        .order('verse');

      if (!kjvRows?.length || !ctRows?.length) continue;

      for (const kv of kjvRows) {
        if (limit !== null && versesProcessed >= limit) break;

        const kjv = kv.text;
        const ref = `${book.name} ${chapter}:${kv.verse}`;

        try {
          let modernized = '';
          const failReasons: string[] = [];

          for (let attempt = 1; attempt <= MAX_REWRITE_ATTEMPTS; attempt++) {
            const feedback = attempt > 1 ? failReasons[failReasons.length - 1] : undefined;
            modernized = await callRewrite(kjv, feedback);

            const audit = await callAudit(kjv, modernized);

            if (audit.pass) {
              if (!dryRun) {
                const ok = await updateVerse(book.id, chapter, kv.verse, modernized);
                if (ok) stored++;
              } else {
                stored++;
              }
              if (attempt > 1) {
                console.log(`   ✅ ${ref} (passed on attempt ${attempt})`);
              }
              break;
            }

            failReasons.push(audit.reason ?? 'Unknown');

            if (attempt === MAX_REWRITE_ATTEMPTS) {
              appendManualReview({
                ref,
                kjv,
                attempts: MAX_REWRITE_ATTEMPTS,
                fail_reasons: failReasons,
                last_attempt: modernized
              });
              manualReview++;
              console.log(`   ⚠️  ${ref} NEEDS_MANUAL_REVIEW (${failReasons[failReasons.length - 1]})`);
            }
          }

          versesProcessed++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`   ❌ ${ref}: ${msg}`);
          apiErrors++;
        }
      }
    }
    if (limit !== null && versesProcessed >= limit) break;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Done. Stored: ${stored} | Manual review: ${manualReview} | API errors: ${apiErrors}`);
  if (manualReview > 0) {
    console.log(`  Manual review log: ${MANUAL_REVIEW_PATH}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
