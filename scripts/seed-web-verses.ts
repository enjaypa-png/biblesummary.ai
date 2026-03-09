/**
 * Seed World English Bible (WEB) Verses into Supabase
 *
 * This script reads the CT translation JSON files from
 * data/translations/ct/ and extracts the WEB text, inserting
 * it into the verses table with translation='web'.
 *
 * The WEB text is already embedded in each CT JSON file alongside
 * the KJV and CT fields.
 *
 * Usage:
 *   npm run web:seed                     # Seed all available WEB chapters
 *   npm run web:seed -- --book genesis   # Seed a specific book
 *   npm run web:seed -- --dry-run        # Preview without inserting
 *
 * Requirements:
 *   - CT JSON files in data/translations/ct/{book}/{chapter}.json
 *   - Migration 20260309_add_web_translation must be applied
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const CT_DIR = path.join(process.cwd(), 'data', 'translations', 'ct');

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChapterFile {
  book: string;
  book_name: string;
  chapter: number;
  verses: {
    verse: number;
    kjv: string;
    web?: string;
    ct: string;
  }[];
}

// ─── CLI Args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let book: string | null = null;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--book' && args[i + 1]) {
      book = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { book, dryRun };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { book: bookFilter, dryRun } = parseArgs();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  World English Bible (WEB) — Database Seeder');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (dryRun) console.log('  Mode: DRY RUN (no database changes)');
  if (bookFilter) console.log(`  Book filter: ${bookFilter}`);
  console.log('');

  // Check if CT directory exists (WEB data is embedded in CT files)
  if (!fs.existsSync(CT_DIR)) {
    console.error(`No CT files found at ${CT_DIR}`);
    console.error('WEB text is embedded in CT JSON files. Generate CT first.');
    process.exit(1);
  }

  // Get books from database (need book_id for insertion)
  const { data: dbBooks, error: booksError } = await supabase
    .from('books')
    .select('id, slug, name')
    .order('order_index');

  if (booksError) {
    console.error(`Failed to fetch books: ${booksError.message}`);
    process.exit(1);
  }

  const bookMap = new Map(dbBooks!.map((b) => [b.slug, b]));

  // Find all book directories
  let bookDirs = fs.readdirSync(CT_DIR).filter((d) => {
    return fs.statSync(path.join(CT_DIR, d)).isDirectory();
  });

  if (bookFilter) {
    bookDirs = bookDirs.filter((d) => d === bookFilter);
    if (bookDirs.length === 0) {
      console.error(`No CT files found for book "${bookFilter}"`);
      process.exit(1);
    }
  }

  let totalInserted = 0;
  let totalChapters = 0;
  let totalSkipped = 0;

  for (const bookSlug of bookDirs) {
    const dbBook = bookMap.get(bookSlug);
    if (!dbBook) {
      console.warn(`   Book "${bookSlug}" not found in database, skipping`);
      continue;
    }

    const bookDir = path.join(CT_DIR, bookSlug);
    const chapterFiles = fs.readdirSync(bookDir)
      .filter((f) => f.endsWith('.json'))
      .sort((a, b) => parseInt(a) - parseInt(b));

    let bookVerses = 0;

    for (const file of chapterFiles) {
      const filePath = path.join(bookDir, file);
      const data: ChapterFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // Build verse records — only include verses that have WEB text
      const versesToInsert = data.verses
        .filter((v) => v.web && v.web.trim().length > 0)
        .map((v) => ({
          book_id: dbBook.id,
          chapter: data.chapter,
          verse: v.verse,
          text: v.web!,
          translation: 'web'
        }));

      if (versesToInsert.length === 0) {
        totalSkipped++;
        continue;
      }

      if (dryRun) {
        bookVerses += versesToInsert.length;
        totalInserted += versesToInsert.length;
        totalChapters++;
        continue;
      }

      // Upsert verses (insert or update if they already exist)
      const { error: insertError } = await supabase
        .from('verses')
        .upsert(versesToInsert, {
          onConflict: 'book_id,chapter,verse,translation'
        });

      if (insertError) {
        console.error(`   ${dbBook.name} ${data.chapter}: ${insertError.message}`);
        continue;
      }

      bookVerses += versesToInsert.length;
      totalInserted += versesToInsert.length;
      totalChapters++;
    }

    if (bookVerses > 0) {
      console.log(`   ${dbBook.name}: ${bookVerses} WEB verses across ${chapterFiles.length} chapters`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Done! ${dryRun ? '[DRY RUN] Would insert' : 'Inserted'}: ${totalInserted} verses across ${totalChapters} chapters`);
  if (totalSkipped > 0) {
    console.log(`  Skipped: ${totalSkipped} chapters with no WEB text`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main();
