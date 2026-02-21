/**
 * CT Audit Script — Compare CT verses against KJV and flag errors.
 *
 * Fetches both translations from Supabase, sends them to Claude for
 * comparison, and outputs a Markdown table of failures with corrected text.
 *
 * Usage:
 *   npm run ct:audit -- --book ruth                    # Audit all chapters of Ruth
 *   npm run ct:audit -- --book ruth --chapter 2        # Audit Ruth chapter 2 only
 *   npm run ct:audit -- --book ruth --chapters 1-2     # Audit Ruth chapters 1–2
 *   npm run ct:audit -- --book ruth --dry-run          # Show verse counts, don't call Claude
 *   npm run ct:audit -- --book ruth --apply            # Audit AND apply fixes to Supabase
 *   npm run ct:audit -- --book ruth --out results.md   # Save results to file
 *
 * Requirements:
 *   - ANTHROPIC_API_KEY in .env.local
 *   - NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { CT_AUDIT_PROMPT } from './ct-translation/prompt';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// ─── Config ──────────────────────────────────────────────────────────────────

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 16384;
const DELAY_BETWEEN_CALLS = 1500;

// ─── Environment ─────────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

if (!anthropicApiKey) {
  console.error('❌ Missing ANTHROPIC_API_KEY in .env.local');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const anthropic = new Anthropic({ apiKey: anthropicApiKey });

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditFinding {
  ref: string;
  issue: string;
  fix: string;
}

interface Verse {
  chapter: number;
  verse: number;
  text: string;
}

interface Book {
  id: number;
  name: string;
  slug: string;
  total_chapters: number;
}

// ─── CLI Args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let book: string | null = null;
  let chapters: number[] | null = null;
  let dryRun = false;
  let apply = false;
  let outFile: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--book' && args[i + 1]) {
      book = args[i + 1];
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
    } else if (args[i] === '--apply') {
      apply = true;
    } else if (args[i] === '--out' && args[i + 1]) {
      outFile = args[i + 1];
      i++;
    }
  }

  if (!book) {
    console.error('❌ --book is required. Example: npm run ct:audit -- --book ruth');
    process.exit(1);
  }

  return { book, chapters, dryRun, apply, outFile };
}

// ─── Supabase Queries ────────────────────────────────────────────────────────

async function getBook(slug: string): Promise<Book> {
  const { data, error } = await supabase
    .from('books')
    .select('id, name, slug, total_chapters')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    console.error(`❌ Book "${slug}" not found. Use the book slug (e.g., "genesis", "1-samuel", "ruth").`);
    process.exit(1);
  }

  return data as Book;
}

async function getVerses(bookId: number, chapter: number, translation: 'ct' | 'kjv'): Promise<Verse[]> {
  const { data, error } = await supabase
    .from('verses')
    .select('chapter, verse, text')
    .eq('book_id', bookId)
    .eq('chapter', chapter)
    .eq('translation', translation)
    .order('verse');

  if (error) throw new Error(`DB error: ${error.message}`);
  return (data || []) as Verse[];
}

async function updateCT(bookId: number, chapter: number, verse: number, newText: string): Promise<boolean> {
  const { error } = await supabase
    .from('verses')
    .update({ text: newText })
    .eq('book_id', bookId)
    .eq('chapter', chapter)
    .eq('verse', verse)
    .eq('translation', 'ct');
  return !error;
}

// ─── Claude API ──────────────────────────────────────────────────────────────

async function auditChapter(bookName: string, chapter: number, kjvVerses: Verse[], ctVerses: Verse[]): Promise<AuditFinding[]> {
  // Build the verse pairs for Claude
  const pairs = kjvVerses.map(kjv => {
    const ct = ctVerses.find(c => c.verse === kjv.verse);
    return `${bookName} ${chapter}:${kjv.verse}\nKJV: ${kjv.text}\nCT:  ${ct?.text || '[MISSING]'}`;
  });

  // Check for CT verses that don't have a KJV counterpart
  const extraCT = ctVerses.filter(ct => !kjvVerses.find(k => k.verse === ct.verse));
  for (const extra of extraCT) {
    pairs.push(`${bookName} ${chapter}:${extra.verse}\nKJV: [MISSING]\nCT:  ${extra.text}`);
  }

  const userPrompt = `Audit these ${bookName} chapter ${chapter} verse pairs. For each verse, compare the CT against the KJV and flag any failures. Output a JSON array of failures only.\n\n${pairs.join('\n\n')}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0,
    system: CT_AUDIT_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') return [];

  try {
    const parsed = JSON.parse(textBlock.text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Try extracting JSON from markdown fences
    const match = textBlock.text.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        console.warn(`   ⚠️  Failed to parse audit response for chapter ${chapter}`);
        return [];
      }
    }
    console.warn(`   ⚠️  Failed to parse audit response for chapter ${chapter}`);
    return [];
  }
}

// ─── Output Formatting ──────────────────────────────────────────────────────

function formatMarkdownTable(bookName: string, findings: AuditFinding[]): string {
  if (findings.length === 0) {
    return `## ${bookName} — CT Audit\n\n✅ All verses passed. No issues found.\n`;
  }

  let md = `## ${bookName} — CT Audit\n\n`;
  md += `**${findings.length} issue${findings.length === 1 ? '' : 's'} found.**\n\n`;
  md += `| Reference | Issue | Corrected CT |\n`;
  md += `|-----------|-------|-------------|\n`;

  for (const f of findings) {
    // Escape pipes in text for markdown table
    const issue = f.issue.replace(/\|/g, '\\|');
    const fix = f.fix.replace(/\|/g, '\\|');
    md += `| ${f.ref} | ${issue} | ${fix} |\n`;
  }

  return md;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { book: bookSlug, chapters: chapterFilter, dryRun, apply, outFile } = parseArgs();

  const book = await getBook(bookSlug);
  const chapterList = chapterFilter
    ? chapterFilter.filter(c => c >= 1 && c <= book.total_chapters)
    : Array.from({ length: book.total_chapters }, (_, i) => i + 1);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  CT Audit — ${book.name}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Chapters: ${chapterList.join(', ')}`);
  console.log(`  Model: ${MODEL}`);
  if (dryRun) console.log('  Mode: DRY RUN (no Claude calls)');
  if (apply) console.log('  Mode: APPLY (will write fixes to Supabase)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const allFindings: AuditFinding[] = [];

  for (const chapter of chapterList) {
    const kjvVerses = await getVerses(book.id, chapter, 'kjv');
    const ctVerses = await getVerses(book.id, chapter, 'ct');

    console.log(`  📖 ${book.name} ${chapter}: ${kjvVerses.length} KJV, ${ctVerses.length} CT`);

    if (kjvVerses.length === 0) {
      console.log(`     ⚠️  No KJV verses — skipping`);
      continue;
    }

    if (ctVerses.length === 0) {
      console.log(`     ⚠️  No CT verses — skipping`);
      continue;
    }

    if (dryRun) continue;

    const findings = await auditChapter(book.name, chapter, kjvVerses, ctVerses);

    if (findings.length === 0) {
      console.log(`     ✅ All verses passed`);
    } else {
      console.log(`     ❌ ${findings.length} issue${findings.length === 1 ? '' : 's'} found`);
      allFindings.push(...findings);
    }

    // Rate limit
    if (chapter < chapterList[chapterList.length - 1]) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_CALLS));
    }
  }

  if (dryRun) {
    console.log('\n  Dry run complete. Use without --dry-run to run the audit.\n');
    return;
  }

  // Output results
  const markdown = formatMarkdownTable(book.name, allFindings);

  console.log('\n' + markdown);

  if (outFile) {
    fs.writeFileSync(outFile, markdown, 'utf-8');
    console.log(`\n  📄 Results saved to ${outFile}`);
  }

  // Apply fixes if requested
  if (apply && allFindings.length > 0) {
    console.log(`\n  Applying ${allFindings.length} fixes to Supabase...\n`);
    let applied = 0;
    let failed = 0;

    for (const finding of allFindings) {
      // Parse ref like "Ruth 2:4" → chapter 2, verse 4
      const match = finding.ref.match(/(\d+):(\d+)/);
      if (!match) {
        console.log(`     ❌ Could not parse ref: ${finding.ref}`);
        failed++;
        continue;
      }

      const ch = parseInt(match[1]);
      const v = parseInt(match[2]);

      const success = await updateCT(book.id, ch, v, finding.fix);
      if (success) {
        console.log(`     ✅ ${finding.ref}`);
        applied++;
      } else {
        console.log(`     ❌ ${finding.ref} — failed to update`);
        failed++;
      }
    }

    console.log(`\n  Applied: ${applied} | Failed: ${failed}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Audit complete: ${allFindings.length} issue${allFindings.length === 1 ? '' : 's'} in ${book.name}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
