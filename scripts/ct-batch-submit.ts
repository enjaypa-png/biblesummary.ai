/**
 * Submit Clear Translation (CT) as a Batch Job (50% cost savings)
 *
 * This script builds chapter requests and submits them to the Anthropic
 * Message Batches API for asynchronous processing at 50% cost.
 * Results are typically ready within 1 hour.
 *
 * Usage:
 *   npm run ct:batch:submit                                          # Full Bible
 *   npm run ct:batch:submit -- --book genesis                        # One book
 *   npm run ct:batch:submit -- --books genesis,psalms,romans         # Multiple books
 *   npm run ct:batch:submit -- --books genesis,psalms --chapter 2    # Ch 2 of each
 *   npm run ct:batch:submit -- --books genesis,psalms --chapters 1-3 # Ch 1-3 of each
 *   npm run ct:batch:submit -- --force                               # Regenerate existing
 *   npm run ct:batch:submit -- --force --exclude genesis:1-10        # Regenerate all except Gen 1-10
 *   npm run ct:batch:submit -- --source github                       # Fetch KJV from GitHub instead of Supabase
 *   npm run ct:batch:submit -- --dry-run                             # Preview without submitting
 *
 * After submitting:
 *   npm run ct:batch:status                   # Check if batch is done
 *   npm run ct:batch:download                 # Download results when ready
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { CT_SYSTEM_PROMPT, buildUserPrompt } from './ct-translation/prompt';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

if (!anthropicApiKey) {
  console.error('❌ Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: anthropicApiKey });

const MODEL = 'claude-opus-4-6';
const MAX_TOKENS = 16384;
const TEMPERATURE = 0.5;
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'translations', 'ct');
const BATCH_DIR = path.join(process.cwd(), 'data', 'translations', 'ct-batch');

// GitHub raw content base URL for KJV text
const GITHUB_BASE = 'https://raw.githubusercontent.com/aruljohn/Bible-kjv/master';

// Slug → GitHub filename mapping
const SLUG_TO_GITHUB: Record<string, string> = {
  'genesis': 'Genesis', 'exodus': 'Exodus', 'leviticus': 'Leviticus',
  'numbers': 'Numbers', 'deuteronomy': 'Deuteronomy', 'joshua': 'Joshua',
  'judges': 'Judges', 'ruth': 'Ruth', '1-samuel': '1Samuel', '2-samuel': '2Samuel',
  '1-kings': '1Kings', '2-kings': '2Kings', '1-chronicles': '1Chronicles',
  '2-chronicles': '2Chronicles', 'ezra': 'Ezra', 'nehemiah': 'Nehemiah',
  'esther': 'Esther', 'job': 'Job', 'psalms': 'Psalms', 'proverbs': 'Proverbs',
  'ecclesiastes': 'Ecclesiastes', 'song-of-solomon': 'SongofSolomon',
  'isaiah': 'Isaiah', 'jeremiah': 'Jeremiah', 'lamentations': 'Lamentations',
  'ezekiel': 'Ezekiel', 'daniel': 'Daniel', 'hosea': 'Hosea', 'joel': 'Joel',
  'amos': 'Amos', 'obadiah': 'Obadiah', 'jonah': 'Jonah', 'micah': 'Micah',
  'nahum': 'Nahum', 'habakkuk': 'Habakkuk', 'zephaniah': 'Zephaniah',
  'haggai': 'Haggai', 'zechariah': 'Zechariah', 'malachi': 'Malachi',
  'matthew': 'Matthew', 'mark': 'Mark', 'luke': 'Luke', 'john': 'John',
  'acts': 'Acts', 'romans': 'Romans', '1-corinthians': '1Corinthians',
  '2-corinthians': '2Corinthians', 'galatians': 'Galatians', 'ephesians': 'Ephesians',
  'philippians': 'Philippians', 'colossians': 'Colossians',
  '1-thessalonians': '1Thessalonians', '2-thessalonians': '2Thessalonians',
  '1-timothy': '1Timothy', '2-timothy': '2Timothy', 'titus': 'Titus',
  'philemon': 'Philemon', 'hebrews': 'Hebrews', 'james': 'James',
  '1-peter': '1Peter', '2-peter': '2Peter', '1-john': '1John', '2-john': '2John',
  '3-john': '3John', 'jude': 'Jude', 'revelation': 'Revelation'
};

interface GitHubBookData {
  book: string;
  chapters: {
    chapter: string;
    verses: { verse: string; text: string }[];
  }[];
}

interface BookInfo {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  total_chapters: number;
}

// Cache for GitHub book data
const githubCache = new Map<string, GitHubBookData>();

async function fetchVersesFromGitHub(bookSlug: string, chapter: number): Promise<{ verse: number; text: string }[] | null> {
  const githubName = SLUG_TO_GITHUB[bookSlug];
  if (!githubName) return null;

  if (!githubCache.has(bookSlug)) {
    // Try local file first, then network fetch
    const localPath = path.join(process.cwd(), 'data', `kjv-${bookSlug}.json`);
    if (fs.existsSync(localPath)) {
      githubCache.set(bookSlug, JSON.parse(fs.readFileSync(localPath, 'utf-8')));
    } else {
      // Use child_process curl as fallback (Node fetch may fail in some environments)
      const { execSync } = await import('child_process');
      const url = `${GITHUB_BASE}/${githubName}.json`;
      try {
        const json = execSync(`curl -sf "${url}"`, { encoding: 'utf-8', timeout: 30000 });
        const data = JSON.parse(json);
        // Save locally for future use
        fs.writeFileSync(localPath, JSON.stringify(data), 'utf-8');
        githubCache.set(bookSlug, data);
      } catch {
        console.warn(`   ⚠️  Failed to fetch ${bookSlug} from GitHub`);
        return null;
      }
    }
  }

  const bookData = githubCache.get(bookSlug)!;
  const chapterData = bookData.chapters.find(c => parseInt(c.chapter) === chapter);
  if (!chapterData) return null;

  return chapterData.verses.map(v => ({ verse: parseInt(v.verse), text: v.text }));
}

// ─── CLI Args ────────────────────────────────────────────────────────────────

/** Exclusion map: slug → Set of chapter numbers to skip */
type ExcludeMap = Map<string, Set<number>>;

function parseExclude(val: string): ExcludeMap {
  const map: ExcludeMap = new Map();
  for (const entry of val.split(',')) {
    const [slug, range] = entry.trim().split(':');
    if (!slug) continue;
    if (!range) {
      // Exclude entire book — will be populated later with all chapters
      map.set(slug, new Set([-1])); // sentinel: -1 means "all"
      continue;
    }
    const chapters = new Set<number>();
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(Number);
      for (let c = start; c <= end; c++) chapters.add(c);
    } else {
      chapters.add(parseInt(range, 10));
    }
    map.set(slug, chapters);
  }
  return map;
}

function isExcluded(exclude: ExcludeMap, slug: string, chapter: number): boolean {
  const set = exclude.get(slug);
  if (!set) return false;
  return set.has(-1) || set.has(chapter);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let books: string[] = [];
  let chapters: number[] | null = null;
  let exclude: ExcludeMap = new Map();
  let force = false;
  let dryRun = false;
  let source: 'supabase' | 'github' = 'supabase';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--book' && args[i + 1]) {
      books.push(args[i + 1]);
      i++;
    } else if (args[i] === '--books' && args[i + 1]) {
      books.push(...args[i + 1].split(',').map(b => b.trim()));
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
    } else if (args[i] === '--exclude' && args[i + 1]) {
      exclude = parseExclude(args[i + 1]);
      i++;
    } else if (args[i] === '--source' && args[i + 1]) {
      source = args[i + 1] as 'supabase' | 'github';
      i++;
    } else if (args[i] === '--force') {
      force = true;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { books: books.length > 0 ? books : null, chapters, exclude, force, dryRun, source };
}

function chapterExists(bookSlug: string, chapter: number): boolean {
  return fs.existsSync(path.join(OUTPUT_DIR, bookSlug, `${chapter}.json`));
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { books: bookFilter, chapters: chapterFilter, exclude, force, dryRun, source } = parseArgs();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CT Batch Submit (50% cost savings)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Model: ${MODEL}`);
  console.log(`  Source: ${source}`);
  if (bookFilter) console.log(`  Books: ${bookFilter.join(', ')}`);
  if (chapterFilter) console.log(`  Chapters: ${chapterFilter.join(', ')}`);
  if (exclude.size > 0) {
    const excludeDesc = [...exclude.entries()].map(([slug, chs]) =>
      chs.has(-1) ? slug : `${slug}:${[...chs].sort((a,b) => a-b).join(',')}`
    ).join(', ');
    console.log(`  Exclude: ${excludeDesc}`);
  }
  if (force) console.log(`  Force: yes`);
  if (dryRun) console.log(`  🏜️  DRY RUN — will NOT submit to API`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Fetch books list
  let books: BookInfo[];

  if (source === 'github') {
    const booksPath = path.join(process.cwd(), 'data', 'books.json');
    const allBooks: any[] = JSON.parse(fs.readFileSync(booksPath, 'utf-8'));
    books = allBooks
      .filter(b => !bookFilter || bookFilter.includes(b.slug))
      .map(b => ({ ...b, id: b.slug }));
  } else {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase env vars. Use --source github to fetch KJV from GitHub.');
      process.exit(1);
    }
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });

    let query = supabase.from('books').select('*').order('order_index');
    if (bookFilter) query = query.in('slug', bookFilter);

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      console.error('❌ No books found');
      if (bookFilter) {
        console.error('   Use book slugs (e.g., "genesis", "1-samuel", "song-of-solomon")');
      }
      process.exit(1);
    }
    books = data as BookInfo[];
  }

  if (books.length === 0) {
    console.error('❌ No books found');
    process.exit(1);
  }

  // Build batch requests
  const requests: any[] = [];
  let skipped = 0;

  for (const book of books) {
    const chaptersToProcess = chapterFilter
      ? chapterFilter.filter(c => c >= 1 && c <= book.total_chapters)
      : Array.from({ length: book.total_chapters }, (_, i) => i + 1);

    let bookQueued = 0;
    let bookSkipped = 0;
    let bookExcluded = 0;

    for (const chapter of chaptersToProcess) {
      if (isExcluded(exclude, book.slug, chapter)) {
        bookExcluded++;
        continue;
      }

      if (!force && chapterExists(book.slug, chapter)) {
        skipped++;
        bookSkipped++;
        continue;
      }

      // Fetch KJV verses
      let verses: { verse: number; text: string }[] | null = null;

      if (source === 'github') {
        verses = await fetchVersesFromGitHub(book.slug, chapter);
      } else {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
        });

        const { data: vData, error: vError } = await supabase
          .from('verses')
          .select('verse, text')
          .eq('book_id', book.id)
          .eq('chapter', chapter)
          .eq('translation', 'kjv')
          .order('verse');

        if (!vError && vData && vData.length > 0) {
          verses = vData;
        }
      }

      if (!verses || verses.length === 0) {
        console.warn(`   ⚠️  No verses for ${book.name} ${chapter}, skipping`);
        continue;
      }

      const userPrompt = buildUserPrompt(book.name, chapter, verses);
      const customId = `${book.slug}_${chapter}`;

      requests.push({
        custom_id: customId,
        params: {
          model: MODEL,
          max_tokens: MAX_TOKENS,
          temperature: TEMPERATURE,
          system: CT_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }]
        }
      });

      bookQueued++;
    }

    const notes = [
      bookSkipped > 0 ? `${bookSkipped} skipped` : '',
      bookExcluded > 0 ? `${bookExcluded} excluded` : ''
    ].filter(Boolean).join(', ');
    const noteStr = notes ? ` (${notes})` : '';
    console.log(`   📖 ${book.name}: ${bookQueued} chapters queued${noteStr}`);
  }

  console.log(`\n   Total requests: ${requests.length}`);
  console.log(`   Skipped (already exist): ${skipped}`);

  if (requests.length === 0) {
    console.log('\n   Nothing to submit! All chapters already generated.');
    console.log('   Use --force to regenerate.');
    return;
  }

  // Estimate cost (50% off Opus pricing)
  const estimatedCost = (requests.length * 2500 * 37.5) / 1_000_000;
  console.log(`   Estimated cost: ~$${estimatedCost.toFixed(0)}-${(estimatedCost * 1.5).toFixed(0)} (50% batch discount applied)`);

  // Dry run — stop here
  if (dryRun) {
    console.log('\n   🏜️  DRY RUN complete. No batch was submitted.');
    console.log('   Remove --dry-run to submit for real.');

    console.log('\n   Sample request (first in batch):');
    console.log(`     custom_id: ${requests[0].custom_id}`);
    console.log(`     model: ${requests[0].params.model}`);
    console.log(`     temperature: ${requests[0].params.temperature}`);
    console.log(`     system prompt: ${requests[0].params.system.substring(0, 80)}...`);
    console.log(`     user prompt: ${requests[0].params.messages[0].content.substring(0, 100)}...`);
    return;
  }

  console.log('\n   Submitting batch...');

  const batch = await anthropic.messages.batches.create({
    requests: requests
  });

  console.log(`\n   ✅ Batch submitted!`);
  console.log(`   Batch ID: ${batch.id}`);
  console.log(`   Status: ${batch.processing_status}`);

  // Save batch metadata
  if (!fs.existsSync(BATCH_DIR)) fs.mkdirSync(BATCH_DIR, { recursive: true });

  const batchInfo = {
    batch_id: batch.id,
    submitted_at: new Date().toISOString(),
    total_requests: requests.length,
    skipped_existing: skipped,
    book_filter: bookFilter || 'all',
    chapter_map: requests.map(r => {
      const [slug, ch] = r.custom_id.split('_');
      const book = books.find(b => b.slug === slug);
      return {
        custom_id: r.custom_id,
        book_slug: slug,
        book_name: book?.name || slug,
        chapter: parseInt(ch)
      };
    })
  };

  fs.writeFileSync(
    path.join(BATCH_DIR, `batch_${batch.id}.json`),
    JSON.stringify(batchInfo, null, 2)
  );

  fs.writeFileSync(
    path.join(BATCH_DIR, 'latest.json'),
    JSON.stringify(batchInfo, null, 2)
  );

  console.log(`\n   Batch info saved to: data/translations/ct-batch/`);
  console.log('\n   Next steps:');
  console.log('   1. Check status:    npm run ct:batch:status');
  console.log('   2. Download results: npm run ct:batch:download');
  console.log('\n   Most batches complete within 1 hour.');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
