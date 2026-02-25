/**
 * Seed Clear Bible Translation (CT) Verses into Supabase
 *
 * This script reads the reviewed CT translation JSON files from
 * data/translations/ct/ and inserts them into the verses table
 * with translation='ct'.
 *
 * Usage:
 *   npm run ct:seed                     # Seed all available CT chapters
 *   npm run ct:seed -- --book genesis   # Seed a specific book
 *   npm run ct:seed -- --dry-run        # Preview without inserting
 *
 * Requirements:
 *   - CT JSON files in data/translations/ct/{book}/{chapter}.json
 *   - Migration 013 must be applied (translation column exists)
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
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
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
  console.log('  Clear Bible Translation (CT) — Database Seeder');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (dryRun) console.log('  Mode: DRY RUN (no database changes)');
  if (bookFilter) console.log(`  Book filter: ${bookFilter}`);
  console.log('');

  // Check if CT directory exists
  if (!fs.existsSync(CT_DIR)) {
    console.error(`❌ No CT files found at ${CT_DIR}`);
    console.error('   Run "npm run ct:generate" first to generate translations.');
    process.exit(1);
  }

  // Get books from database (need book_id for insertion)
  const { data: dbBooks, error: booksError } = await supabase
    .from('books')
    .select('id, slug, name')
    .order('order_index');

  if (booksError) {
    console.error(`❌ Failed to fetch books: ${booksError.message}`);
    process.exit(1);
  }

  const bookMap = new Map(dbBooks!.map((b) => [b.slug, b]));

  // Find all CT book directories
  let bookDirs = fs.readdirSync(CT_DIR).filter((d) => {
    return fs.statSync(path.join(CT_DIR, d)).isDirectory();
  });

  if (bookFilter) {
    bookDirs = bookDirs.filter((d) => d === bookFilter);
    if (bookDirs.length === 0) {
      console.error(`❌ No CT files found for book "${bookFilter}"`);
      process.exit(1);
    }
  }

  let totalInserted = 0;
  let totalChapters = 0;

  for (const bookSlug of bookDirs) {
    const dbBook = bookMap.get(bookSlug);
    if (!dbBook) {
      console.warn(`   ⚠️  Book "${bookSlug}" not found in database, skipping`);
      continue;
    }

    const bookDir = path.join(CT_DIR, bookSlug);
    const chapterFiles = fs.readdirSync(bookDir)
      .filter((f) => f.endsWith('.json'))
      .sort((a, b) => parseInt(a) - parseInt(b));

    console.log(`📖 ${dbBook.name} (${chapterFiles.length} chapters)`);

    for (const file of chapterFiles) {
      const filePath = path.join(bookDir, file);
      const data: ChapterFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // Build verse records
      const versesToInsert = data.verses
        .filter((v) => v.ct && !v.ct.startsWith('[MISSING'))
        .map((v) => ({
          book_id: dbBook.id,
          chapter: data.chapter,
          verse: v.verse,
          text: v.ct,
          translation: 'ct'
        }));

      if (versesToInsert.length === 0) {
        console.warn(`   ⚠️  ${dbBook.name} ${data.chapter}: no valid CT verses, skipping`);
        continue;
      }

      if (dryRun) {
        console.log(`   [dry-run] ${dbBook.name} ${data.chapter}: ${versesToInsert.length} verses`);
        totalInserted += versesToInsert.length;
        totalChapters++;
        continue;
      }

      // Upsert verses (insert or update if they already exist)
      // We use the unique constraint (book_id, chapter, verse, translation)
      const { error: insertError } = await supabase
        .from('verses')
        .upsert(versesToInsert, {
          onConflict: 'book_id,chapter,verse,translation'
        });

      if (insertError) {
        console.error(`   ❌ ${dbBook.name} ${data.chapter}: ${insertError.message}`);
        continue;
      }

      totalInserted += versesToInsert.length;
      totalChapters++;
      console.log(`   ✅ ${dbBook.name} ${data.chapter}: ${versesToInsert.length} verses`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Done! ${dryRun ? '[DRY RUN] Would insert' : 'Inserted'}: ${totalInserted} verses across ${totalChapters} chapters`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main();
