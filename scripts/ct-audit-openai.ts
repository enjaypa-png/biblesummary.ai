/**
 * Clear Bible Translation (CT) — OpenAI Audit
 *
 * Uses GPT-4o to audit CT verses against KJV.
 * Cross-provider auditing: Claude generates, GPT-4o checks.
 * No model auditing its own work.
 *
 * Usage:
 *   npx tsx scripts/ct-audit-openai.ts --book genesis --chapter 1
 *   npx tsx scripts/ct-audit-openai.ts --book genesis          # All chapters
 *   npx tsx scripts/ct-audit-openai.ts --book genesis --apply  # Write fixes to JSON
 *
 * Output: Prints failures as a table. With --apply, patches the JSON files.
 *
 * Requirements:
 *   OPENAI_API_KEY in .env.local
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { CT_AUDIT_PROMPT_V2 } from './ct-translation/prompt-v2';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const openaiKey = process.env.OPENAI_API_KEY;
if (!openaiKey) { console.error('❌ Missing OPENAI_API_KEY'); process.exit(1); }

const MODEL = 'gpt-4o';
const CT_DIR = path.join(process.cwd(), 'data', 'translations', 'ct');

interface AuditFailure {
  ref: string;
  issue: string;
  kjv: string;
  ct: string;
  fix: string;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let book: string | null = null;
  let chapter: number | null = null;
  let apply = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--book' && args[i+1]) { book = args[++i]; }
    else if (args[i] === '--chapter' && args[i+1]) { chapter = parseInt(args[++i]); }
    else if (args[i] === '--apply') { apply = true; }
  }
  return { book, chapter, apply };
}

async function auditChapterWithGPT(
  bookName: string,
  chapter: number,
  verses: { verse: number; kjv: string; ct: string }[]
): Promise<AuditFailure[]> {
  const versesText = verses
    .map(v => `${bookName} ${chapter}:${v.verse}\n  KJV: ${v.kjv}\n  CT: ${v.ct}`)
    .join('\n\n');

  const body = {
    model: MODEL,
    temperature: 0,
    messages: [
      { role: 'system', content: CT_AUDIT_PROMPT_V2 },
      { role: 'user', content: `Audit these CT verses against KJV:\n\n${versesText}` }
    ]
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const text = data.choices[0]?.message?.content || '[]';

  let failures: AuditFailure[];
  try {
    failures = JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) failures = JSON.parse(match[0]);
    else { console.warn('   ⚠️  Could not parse GPT-4o response'); return []; }
  }

  return Array.isArray(failures) ? failures : [];
}

function loadChapterFile(bookSlug: string, chapter: number): any | null {
  const p = path.join(CT_DIR, bookSlug, `${chapter}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function applyFixes(bookSlug: string, chapter: number, failures: AuditFailure[]): void {
  const p = path.join(CT_DIR, bookSlug, `${chapter}.json`);
  const data = JSON.parse(fs.readFileSync(p, 'utf-8'));

  for (const f of failures) {
    const verseNum = parseInt(f.ref.split(':')[1]);
    const v = data.verses.find((v: any) => v.verse === verseNum);
    if (v && f.fix) {
      v.ct = f.fix;
      v.audit_fixed = true;
      v.audit_issue = f.issue;
    }
  }

  data.audit_model = MODEL;
  data.audit_at = new Date().toISOString();
  data.audit_failures = failures.length;
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

async function main() {
  const { book: bookFilter, chapter: chapterFilter, apply } = parseArgs();

  if (!bookFilter) {
    console.error('❌ --book is required');
    process.exit(1);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Clear Bible Translation — GPT-4o Audit');
  console.log(`  Book: ${bookFilter}${chapterFilter ? ` ch.${chapterFilter}` : ' (all chapters)'}`);
  console.log(`  Apply fixes: ${apply ? 'YES' : 'no'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Discover chapters
  const bookDir = path.join(CT_DIR, bookFilter);
  if (!fs.existsSync(bookDir)) {
    console.error(`❌ No CT data for ${bookFilter}. Run ct-generate-v2 first.`);
    process.exit(1);
  }

  let chapters: number[];
  if (chapterFilter) {
    chapters = [chapterFilter];
  } else {
    chapters = fs.readdirSync(bookDir)
      .filter(f => f.endsWith('.json'))
      .map(f => parseInt(f.replace('.json', '')))
      .sort((a, b) => a - b);
  }

  let totalFailures = 0;
  let totalVerses = 0;

  for (const ch of chapters) {
    const data = loadChapterFile(bookFilter, ch);
    if (!data) { console.warn(`   ⚠️  No file for ch.${ch}`); continue; }

    const bookName = data.book_name;
    const verses = data.verses.map((v: any) => ({
      verse: v.verse,
      kjv: v.kjv,
      ct: v.ct
    }));
    totalVerses += verses.length;

    process.stdout.write(`   Auditing ${bookName} ${ch} (${verses.length} verses)... `);

    try {
      const failures = await auditChapterWithGPT(bookName, ch, verses);
      totalFailures += failures.length;

      if (failures.length === 0) {
        console.log('✅ PASS');
      } else {
        console.log(`❌ ${failures.length} failures`);
        for (const f of failures) {
          console.log(`\n   📍 ${f.ref}`);
          console.log(`   Issue: ${f.issue}`);
          console.log(`   KJV:   ${f.kjv}`);
          console.log(`   CT:    ${f.ct}`);
          console.log(`   Fix:   ${f.fix}`);
        }
        if (apply) {
          applyFixes(bookFilter, ch, failures);
          console.log(`\n   🔧 Applied ${failures.length} fix(es) to ${bookFilter}/${ch}.json`);
        }
      }

      // Respect OpenAI rate limits
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.log(`ERROR: ${err instanceof Error ? err.message : err}`);
    }
  }

  const passRate = totalVerses > 0
    ? (((totalVerses - totalFailures) / totalVerses) * 100).toFixed(1)
    : '0';

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Total verses: ${totalVerses}`);
  console.log(`  Failures:     ${totalFailures}`);
  console.log(`  Pass rate:    ${passRate}%`);
  if (!apply && totalFailures > 0) {
    console.log(`\n  Run with --apply to automatically patch failures`);
  }
}

main();
