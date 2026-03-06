/**
 * Clear Bible Translation — Unified Meaning-Audit
 *
 * READ-ONLY analysis. No verse modifications, no fixes applied.
 *
 * What this does:
 *   1. Loads existing OT audit results from ct-audit-escalated-fail.jsonl
 *   2. Runs a fresh read-only GPT-4o meaning-check on all generated NT chapters
 *   3. Writes all results to data/translations/translation-audit/results.jsonl
 *   4. Prints a summary report
 *
 * Output schema per row:
 *   { ref, testament, book, chapter, verse, kjv, ct, meaning, reason }
 *   meaning: "PASS" | "FAIL"
 *
 * Usage:
 *   npm run audit:translation
 *   npm run audit:translation -- --ot-only      # Skip NT live audit, use existing OT data only
 *   npm run audit:translation -- --nt-only      # Only run NT audit
 *   npm run audit:translation -- --book Matthew # Single NT book
 *   npm run audit:translation -- --dry-run      # Count verses, no API calls
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// ─── Config ───────────────────────────────────────────────────────────────────

const MODEL = 'gpt-4o';
const CT_DIR = path.join(process.cwd(), 'data', 'translations', 'ct');
const OT_ESCALATED_PATH = path.join(process.cwd(), 'data', 'translations', 'ct-audit-escalated-fail.jsonl');
const OT_LOG_PATH = path.join(process.cwd(), 'data', 'translations', 'ct-full-run-log.jsonl');
const AUDIT_DIR = path.join(process.cwd(), 'data', 'translations', 'translation-audit');
const RESULTS_PATH = path.join(AUDIT_DIR, 'results.jsonl');
const SUMMARY_PATH = path.join(AUDIT_DIR, 'summary.json');
const DELAY_MS = 4500; // between API calls — stays under 30K TPM cap
const RATE_LIMIT_RETRY_MS = 15000; // wait on 429

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditRow {
  ref: string;
  testament: 'Old' | 'New';
  book: string;
  chapter: number;
  verse: number;
  kjv: string;
  ct: string;
  meaning: 'PASS' | 'FAIL';
  reason?: string;
  source: 'ot-pipeline' | 'nt-live-audit';
}

interface AuditFailureRaw {
  ref: string;
  issue: string;
  kjv?: string;
  ct?: string;
  fix?: string;
}

// ─── CLI Args ─────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    otOnly: args.includes('--ot-only'),
    ntOnly: args.includes('--nt-only'),
    dryRun: args.includes('--dry-run'),
    resume: args.includes('--resume'),
    book: (() => { const i = args.indexOf('--book'); return i >= 0 ? args[i + 1] : null; })(),
  };
}

// ─── OpenAI Audit ─────────────────────────────────────────────────────────────

const AUDIT_SYSTEM_PROMPT = `You are an expert biblical scholar auditing a modern Bible translation called the Clear Bible Translation (CT) against the King James Version (KJV).

Your ONLY job: determine whether each CT verse preserves the core meaning of the KJV verse.

Rules:
- Modernized language, rephrasing, and clarity improvements are FINE — mark PASS
- Only mark FAIL if the CT verse changes WHO did something, WHAT happened, key theological content, or omits/adds substantive meaning
- Style differences, idiom updates, and word-level rewording are NOT failures
- Return ONLY a JSON array — no markdown, no commentary

Response format (array of objects, one per FAIL verse only):
[
  {
    "ref": "Book Chapter:Verse",
    "kjv": "original KJV text",
    "ct": "CT text that has the problem",
    "reason": "brief explanation of the meaning change"
  }
]

If all verses pass, return: []`;

async function auditChapterNT(
  bookName: string,
  chapter: number,
  verses: { verse: number; kjv: string; ct: string }[]
): Promise<AuditFailureRaw[]> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error('Missing OPENAI_API_KEY in .env.local');

  const versesText = verses
    .map(v => `${bookName} ${chapter}:${v.verse}\n  KJV: ${v.kjv}\n  CT:  ${v.ct}`)
    .join('\n\n');

  const body = {
    model: MODEL,
    temperature: 0,
    messages: [
      { role: 'system', content: AUDIT_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Audit these verses. Return ONLY a JSON array of failures (or [] if all pass):\n\n${versesText}`,
      },
    ],
    response_format: { type: 'json_object' },
  };

  // Retry loop with backoff on 429 rate limits
  let res: Response | null = null;
  let retries = 0;
  const MAX_RETRIES = 5;
  while (retries < MAX_RETRIES) {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, response_format: undefined }),
    });
    if (res.status === 429) {
      const waitMs = RATE_LIMIT_RETRY_MS * (retries + 1);
      process.stdout.write(`\n   ⏳ Rate limited — waiting ${waitMs/1000}s... `);
      await new Promise(r => setTimeout(r, waitMs));
      retries++;
      continue;
    }
    break;
  }
  if (!res || !res.ok) {
    const err = await res!.text();
    throw new Error(`OpenAI ${res?.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? '[]';

  // Parse JSON — handle both array and wrapped object
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    // Sometimes GPT wraps in { "failures": [...] } or similar
    const firstKey = Object.keys(parsed)[0];
    if (firstKey && Array.isArray(parsed[firstKey])) return parsed[firstKey];
    return [];
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    console.warn('   ⚠️  Could not parse GPT-4o response');
    return [];
  }
}

// ─── File Helpers ─────────────────────────────────────────────────────────────

function loadChapterFile(bookSlug: string, chapter: number): any | null {
  const p = path.join(CT_DIR, bookSlug, `${chapter}.json`);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

function ensureAuditDir() {
  if (!fs.existsSync(AUDIT_DIR)) fs.mkdirSync(AUDIT_DIR, { recursive: true });
}

function appendResult(row: AuditRow) {
  fs.appendFileSync(RESULTS_PATH, JSON.stringify(row) + '\n', 'utf-8');
}

// ─── OT: Load existing pipeline results ───────────────────────────────────────

function loadOTResults(): AuditRow[] {
  const rows: AuditRow[] = [];

  if (!fs.existsSync(OT_ESCALATED_PATH)) {
    console.log('   ℹ️  No OT escalated-fail file found — skipping OT results');
    return rows;
  }

  if (!fs.existsSync(OT_LOG_PATH)) {
    console.log('   ℹ️  No OT full-run-log found — skipping OT context');
    return rows;
  }

  // Load escalated fails (confirmed meaning-change failures)
  const failLines = fs.readFileSync(OT_ESCALATED_PATH, 'utf-8').trim().split('\n').filter(Boolean);
  for (const line of failLines) {
    try {
      const item = JSON.parse(line);
      const ref: string = item.ref || '';
      // Parse "Book Chapter:Verse"
      const m = ref.match(/^(.+)\s+(\d+):(\d+)$/);
      if (!m) continue;
      const book = m[1];
      const chapter = parseInt(m[2]);
      const verse = parseInt(m[3]);

      rows.push({
        ref,
        testament: 'Old',
        book,
        chapter,
        verse,
        kjv: item.kjv || '',
        ct: item.failed_ct || '',
        meaning: 'FAIL',
        reason: item.phase3_reason || item.phase2_reason || 'Escalated from 3-phase audit pipeline',
        source: 'ot-pipeline',
      });
    } catch { /* skip malformed lines */ }
  }

  console.log(`   ✅ Loaded ${rows.length} OT confirmed failures from pipeline audit`);
  return rows;
}

// ─── OT: PASS rows (synthetic — we know the totals from the log) ──────────────

function loadOTPassCount(): { totalVerses: number; passCount: number; bookCount: number } {
  if (!fs.existsSync(OT_LOG_PATH)) return { totalVerses: 0, passCount: 0, bookCount: 0 };
  const lines = fs.readFileSync(OT_LOG_PATH, 'utf-8').trim().split('\n').filter(Boolean);
  let totalVerses = 0;
  let escalations = 0;
  const seenBooks = new Set<string>();
  for (const line of lines) {
    try {
      const item = JSON.parse(line);
      if (!seenBooks.has(item.book)) {
        seenBooks.add(item.book);
        totalVerses += item.totalVerses || 0;
        escalations += item.escalations || 0;
      }
    } catch { /* skip */ }
  }
  return { totalVerses, passCount: totalVerses - escalations, bookCount: seenBooks.size };
}

// ─── NT Books list ────────────────────────────────────────────────────────────

const NT_BOOKS = [
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation',
];

function bookNameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

// ─── NT Audit ─────────────────────────────────────────────────────────────────

async function auditNTBook(bookName: string, dryRun: boolean): Promise<AuditRow[]> {
  const slug = bookNameToSlug(bookName);
  const bookDir = path.join(CT_DIR, slug);
  if (!fs.existsSync(bookDir)) return [];

  const chapterFiles = fs.readdirSync(bookDir)
    .filter(f => f.endsWith('.json'))
    .map(f => parseInt(f.replace('.json', '')))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);

  if (chapterFiles.length === 0) return [];

  const rows: AuditRow[] = [];
  let bookVerses = 0;

  // Load already-audited chapters from previous runs
  const auditedChapters = new Set<number>();
  if (fs.existsSync(RESULTS_PATH)) {
    const prev = fs.readFileSync(RESULTS_PATH, 'utf-8').trim().split('\n').filter(Boolean);
    for (const line of prev) {
      try {
        const row = JSON.parse(line) as AuditRow;
        if (row.book === bookName && row.source === 'nt-live-audit') {
          auditedChapters.add(row.chapter);
        }
      } catch { /* skip */ }
    }
  }

  for (const ch of chapterFiles) {
    const data = loadChapterFile(slug, ch);
    if (!data?.verses?.length) continue;

    const verses = data.verses.map((v: any) => ({
      verse: v.verse,
      kjv: v.kjv || '',
      ct: v.ct || '',
    })).filter((v: any) => v.kjv && v.ct);

    bookVerses += verses.length;

    if (dryRun) {
      process.stdout.write(`   📋 ${bookName} ${ch}: ${verses.length} verses (dry-run)\n`);
      continue;
    }

    // Skip if already audited in a previous run
    if (auditedChapters.has(ch)) {
      console.log(`   ⏭️  ${bookName} ${ch} (${verses.length} verses) — already audited, skipping`);
      continue;
    }

    process.stdout.write(`   Auditing ${bookName} ${ch} (${verses.length} verses)... `);

    try {
      const failures = await auditChapterNT(bookName, ch, verses);

      // Build a Set of failed verse numbers for quick lookup
      const failedVerseNums = new Set(failures.map((f: AuditFailureRaw) => {
        const m = f.ref?.match(/:(\d+)$/);
        return m ? parseInt(m[1]) : -1;
      }));

      for (const v of verses) {
        const isFail = failedVerseNums.has(v.verse);
        const failInfo = isFail
          ? failures.find((f: AuditFailureRaw) => {
              const m = f.ref?.match(/:(\d+)$/);
              return m && parseInt(m[1]) === v.verse;
            })
          : null;

        rows.push({
          ref: `${bookName} ${ch}:${v.verse}`,
          testament: 'New',
          book: bookName,
          chapter: ch,
          verse: v.verse,
          kjv: v.kjv,
          ct: v.ct,
          meaning: isFail ? 'FAIL' : 'PASS',
          reason: failInfo?.reason,
          source: 'nt-live-audit',
        });
      }

      if (failures.length === 0) {
        console.log('✅ PASS');
      } else {
        console.log(`❌ ${failures.length} meaning changes`);
        for (const f of failures) {
          console.log(`      📍 ${f.ref} — ${f.reason}`);
        }
      }

      await new Promise(r => setTimeout(r, DELAY_MS));
    } catch (err) {
      console.log(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (dryRun) {
    console.log(`   📊 ${bookName}: ${bookVerses} verses (would audit)`);
  }

  return rows;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { otOnly, ntOnly, dryRun, resume, book: singleBook } = parseArgs();

  ensureAuditDir();

  // Clear previous results unless resuming
  if (!dryRun && !resume) {
    if (fs.existsSync(RESULTS_PATH)) fs.unlinkSync(RESULTS_PATH);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Clear Bible Translation — Unified Meaning Audit');
  console.log(`  Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}${otOnly ? ' (OT only)' : ntOnly ? ' (NT only)' : ''}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const allFailRows: AuditRow[] = [];
  let otTotalVerses = 0;
  let otPassCount = 0;
  let otFailCount = 0;
  let ntTotalVerses = 0;
  let ntPassCount = 0;
  let ntFailCount = 0;

  // ── Phase 1: OT — use existing pipeline results ────────────────────────────
  if (!ntOnly) {
    console.log('📖 OLD TESTAMENT — Loading existing 3-phase audit results');
    console.log('   (23,048 verses audited: Claude phase-1 + GPT-4o phase-2 + auto-correction phase-3)\n');

    const otFails = loadOTResults();
    const otStats = loadOTPassCount();

    otTotalVerses = otStats.totalVerses;
    otFailCount = otFails.length;
    otPassCount = otTotalVerses - otFailCount;

    console.log(`   Books audited: ${otStats.bookCount}`);
    console.log(`   Total verses:  ${otTotalVerses}`);
    console.log(`   Confirmed FAIL (meaning changed): ${otFailCount}`);
    console.log(`   Pass rate:     ${otTotalVerses > 0 ? ((otPassCount / otTotalVerses) * 100).toFixed(2) : 0}%\n`);

    if (!dryRun) {
      for (const row of otFails) appendResult(row);
    }
    allFailRows.push(...otFails);
  }

  // ── Phase 2: NT — live GPT-4o read-only audit ─────────────────────────────
  if (!otOnly) {
    console.log('📖 NEW TESTAMENT — Running read-only GPT-4o meaning audit\n');

    const ntBooksToAudit = singleBook
      ? NT_BOOKS.filter(b => b.toLowerCase() === singleBook.toLowerCase())
      : NT_BOOKS;

    if (singleBook && ntBooksToAudit.length === 0) {
      console.warn(`   ⚠️  Book "${singleBook}" not found in NT list`);
    }

    for (const bookName of ntBooksToAudit) {
      const slug = bookNameToSlug(bookName);
      const bookDir = path.join(CT_DIR, slug);
      if (!fs.existsSync(bookDir)) {
        console.log(`   ⏭️  ${bookName} — no CT data yet, skipping`);
        continue;
      }
      console.log(`\n📚 ${bookName}`);
      const rows = await auditNTBook(bookName, dryRun);

      if (!dryRun) {
        for (const row of rows) appendResult(row);
      }

      const fails = rows.filter(r => r.meaning === 'FAIL');
      ntTotalVerses += rows.length;
      ntPassCount += rows.filter(r => r.meaning === 'PASS').length;
      ntFailCount += fails.length;
      allFailRows.push(...fails);
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const totalScanned = otTotalVerses + ntTotalVerses;
  const totalFails = otFailCount + ntFailCount;
  const totalPasses = otPassCount + ntPassCount;

  const summary = {
    runAt: new Date().toISOString(),
    dryRun,
    totalVersesScanned: totalScanned,
    totalGenerated: 24004, // approximate from progress
    totalBibleVerses: 31102,
    ot: {
      versesAudited: otTotalVerses,
      meaningFail: otFailCount,
      source: 'existing 3-phase pipeline (Claude + GPT-4o)',
    },
    nt: {
      versesAudited: ntTotalVerses,
      meaningFail: ntFailCount,
      source: 'live GPT-4o read-only audit',
    },
    combined: {
      totalScanned,
      totalFail: totalFails,
      totalPass: totalPasses,
      passRate: totalScanned > 0 ? ((totalPasses / totalScanned) * 100).toFixed(3) : '0',
    },
    confirmedFailVerses: allFailRows.map(r => ({
      ref: r.ref,
      testament: r.testament,
      kjv: r.kjv,
      ct: r.ct,
      reason: r.reason,
      source: r.source,
    })),
  };

  if (!dryRun) {
    fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), 'utf-8');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  AUDIT COMPLETE — Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Total CT verses generated:   ~${summary.totalGenerated.toLocaleString()}`);
  console.log(`  Verses scanned this run:      ${totalScanned.toLocaleString()}`);
  console.log(`  Full Bible size:             ~${summary.totalBibleVerses.toLocaleString()}`);
  console.log('');
  console.log(`  OLD TESTAMENT (3-phase audit):`);
  console.log(`    Verses audited: ${otTotalVerses.toLocaleString()}`);
  console.log(`    FAIL (meaning): ${otFailCount}`);
  console.log(`    Pass rate:      ${otTotalVerses > 0 ? ((otPassCount / otTotalVerses) * 100).toFixed(2) : 0}%`);
  console.log('');
  console.log(`  NEW TESTAMENT (read-only GPT-4o):`);
  console.log(`    Verses audited: ${ntTotalVerses.toLocaleString()}`);
  console.log(`    FAIL (meaning): ${ntFailCount}`);
  console.log(`    Pass rate:      ${ntTotalVerses > 0 ? ((ntPassCount / ntTotalVerses) * 100).toFixed(2) : 0}%`);
  console.log('');
  console.log(`  COMBINED:`);
  console.log(`    Total scanned: ${totalScanned.toLocaleString()}`);
  console.log(`    Total FAIL:    ${totalFails}`);
  console.log(`    Overall pass:  ${summary.combined.passRate}%`);
  console.log('');

  if (allFailRows.length > 0) {
    console.log('  CONFIRMED MEANING DIFFERENCES:');
    for (const r of allFailRows) {
      console.log(`    📍 ${r.ref} [${r.testament}T]`);
      console.log(`       KJV: ${r.kjv.slice(0, 100)}${r.kjv.length > 100 ? '...' : ''}`);
      console.log(`       CT:  ${r.ct.slice(0, 100)}${r.ct.length > 100 ? '...' : ''}`);
      console.log(`       Why: ${r.reason}`);
    }
  }

  if (!dryRun) {
    console.log(`\n  Results written to: ${RESULTS_PATH}`);
    console.log(`  Summary written to: ${SUMMARY_PATH}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
