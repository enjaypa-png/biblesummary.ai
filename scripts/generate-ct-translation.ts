/**
 * Generate Clear Translation (CT) Bible Text
 *
 * This script processes KJV Bible text chapter-by-chapter through the Claude API
 * to produce the Clear Translation. Output is saved as JSON files for review
 * before being seeded into the database.
 *
 * Usage:
 *   npm run ct:generate                     # Generate all books (resumes where it left off)
 *   npm run ct:generate -- --book genesis    # Generate a specific book
 *   npm run ct:generate -- --book genesis --chapter 1   # Generate a specific chapter
 *   npm run ct:generate -- --book genesis --force       # Regenerate even if files exist
 *
 * Requirements:
 *   - ANTHROPIC_API_KEY in .env.local
 *   - NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Output:
 *   data/translations/ct/{book-slug}/{chapter}.json
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { CT_SYSTEM_PROMPT, buildUserPrompt } from './ct-translation/prompt';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

if (!anthropicApiKey) {
  console.error('❌ Missing ANTHROPIC_API_KEY in .env.local');
  console.error('   Get your API key at: https://console.anthropic.com/');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const anthropic = new Anthropic({ apiKey: anthropicApiKey });

// Output directory for generated translations
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'translations', 'ct');

// Claude model to use (Sonnet for good quality at reasonable cost)
const MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 8192;

// Rate limiting: pause between API calls (ms)
const DELAY_BETWEEN_CALLS = 1500;

// ─── Types ───────────────────────────────────────────────────────────────────

interface DbBook {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  total_chapters: number;
}

interface DbVerse {
  verse: number;
  text: string;
}

interface CTVerse {
  verse: number;
  text: string;
}

interface ChapterOutput {
  book: string;
  book_name: string;
  chapter: number;
  translation: 'ct';
  generated_at: string;
  model: string;
  verses: {
    verse: number;
    kjv: string;
    ct: string;
  }[];
}

// ─── CLI Args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let book: string | null = null;
  let chapter: number | null = null;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--book' && args[i + 1]) {
      book = args[i + 1];
      i++;
    } else if (args[i] === '--chapter' && args[i + 1]) {
      chapter = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--force') {
      force = true;
    }
  }

  return { book, chapter, force };
}

// ─── File I/O ────────────────────────────────────────────────────────────────

function getOutputPath(bookSlug: string, chapter: number): string {
  return path.join(OUTPUT_DIR, bookSlug, `${chapter}.json`);
}

function chapterExists(bookSlug: string, chapter: number): boolean {
  return fs.existsSync(getOutputPath(bookSlug, chapter));
}

function saveChapter(data: ChapterOutput): void {
  const outputPath = getOutputPath(data.book, data.chapter);
  const dir = path.dirname(outputPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Claude API ──────────────────────────────────────────────────────────────

async function generateCTChapter(
  bookName: string,
  chapter: number,
  kjvVerses: DbVerse[]
): Promise<CTVerse[]> {
  const userPrompt = buildUserPrompt(bookName, chapter, kjvVerses);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: CT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  });

  // Extract text from response
  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text in Claude response');
  }

  // Parse JSON response
  let parsed: CTVerse[];
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    // Try extracting JSON from markdown code fences if Claude wrapped it
    const match = textBlock.text.match(/\[[\s\S]*\]/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error(`Failed to parse Claude response as JSON:\n${textBlock.text.slice(0, 200)}`);
    }
  }

  // Validate: every KJV verse should have a CT verse
  if (parsed.length !== kjvVerses.length) {
    console.warn(
      `   ⚠️  Verse count mismatch: KJV has ${kjvVerses.length}, CT has ${parsed.length}`
    );
  }

  return parsed;
}

// ─── Main Processing ─────────────────────────────────────────────────────────

async function processChapter(
  book: DbBook,
  chapter: number,
  force: boolean
): Promise<boolean> {
  // Skip if already generated (unless --force)
  if (!force && chapterExists(book.slug, chapter)) {
    return false; // skipped
  }

  // Fetch KJV verses for this chapter
  const { data: verses, error } = await supabase
    .from('verses')
    .select('verse, text')
    .eq('book_id', book.id)
    .eq('chapter', chapter)
    .order('verse');

  if (error) throw new Error(`DB error: ${error.message}`);
  if (!verses || verses.length === 0) {
    console.warn(`   ⚠️  No verses found for ${book.name} ${chapter}`);
    return false;
  }

  // Generate CT text via Claude
  const ctVerses = await generateCTChapter(book.name, chapter, verses);

  // Build output with side-by-side KJV and CT for easy review
  const output: ChapterOutput = {
    book: book.slug,
    book_name: book.name,
    chapter,
    translation: 'ct',
    generated_at: new Date().toISOString(),
    model: MODEL,
    verses: verses.map((kjv, i) => ({
      verse: kjv.verse,
      kjv: kjv.text,
      ct: ctVerses[i]?.text || `[MISSING - verse ${kjv.verse}]`
    }))
  };

  saveChapter(output);
  return true; // generated
}

async function processBook(book: DbBook, force: boolean, singleChapter?: number) {
  const chapters = singleChapter
    ? [singleChapter]
    : Array.from({ length: book.total_chapters }, (_, i) => i + 1);

  let generated = 0;
  let skipped = 0;

  for (const chapter of chapters) {
    const label = `${book.name} ${chapter}`;

    try {
      const wasGenerated = await processChapter(book, chapter, force);

      if (wasGenerated) {
        generated++;
        console.log(`   ✅ ${label} (${generated} generated)`);
        // Rate limit between API calls
        await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_CALLS));
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`   ❌ ${label}: ${err instanceof Error ? err.message : err}`);
      // Continue with next chapter rather than failing the whole run
      console.log('   Continuing with next chapter...');
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  return { generated, skipped };
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

async function main() {
  const { book: bookFilter, chapter: chapterFilter, force } = parseArgs();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Clear Translation (CT) Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Model: ${MODEL}`);
  console.log(`  Output: ${OUTPUT_DIR}`);
  if (bookFilter) console.log(`  Book filter: ${bookFilter}`);
  if (chapterFilter) console.log(`  Chapter filter: ${chapterFilter}`);
  if (force) console.log(`  Force regenerate: yes`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Fetch books from database
  let query = supabase.from('books').select('*').order('order_index');

  if (bookFilter) {
    query = query.eq('slug', bookFilter);
  }

  const { data: books, error } = await query;

  if (error) {
    console.error(`❌ Failed to fetch books: ${error.message}`);
    process.exit(1);
  }

  if (!books || books.length === 0) {
    console.error(`❌ No books found${bookFilter ? ` matching "${bookFilter}"` : ''}`);
    if (bookFilter) {
      console.error('   Use the book slug (e.g., "genesis", "1-samuel", "song-of-solomon")');
    }
    process.exit(1);
  }

  let totalGenerated = 0;
  let totalSkipped = 0;

  for (const book of books) {
    console.log(`\n📖 ${book.name} (${book.total_chapters} chapters)`);

    const result = await processBook(
      book as DbBook,
      force,
      chapterFilter ?? undefined
    );

    totalGenerated += result.generated;
    totalSkipped += result.skipped;

    if (result.skipped > 0 && result.generated === 0) {
      console.log(`   (all ${result.skipped} chapters already exist — use --force to regenerate)`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Done! Generated: ${totalGenerated} | Skipped: ${totalSkipped}`);
  console.log(`  Output: ${OUTPUT_DIR}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main();
