/**
 * Seed WEB verses for chapters that have no CT JSON file
 *
 * Some books have incomplete CT JSON coverage (e.g., Psalms 1/150,
 * Acts 7/28). This script fetches WEB text directly from GitHub
 * and inserts it into Supabase for those missing chapters.
 *
 * Usage:
 *   npm run web:seed:missing              # Seed all missing chapters
 *   npm run web:seed:missing -- --dry-run # Preview without inserting
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fetchWEBBook } from './fetch-web';

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
const booksJson: { name: string; slug: string; total_chapters: number }[] =
  JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'books.json'), 'utf-8'));

function parseArgs() {
  const args = process.argv.slice(2);
  let dryRun = false;
  for (const a of args) {
    if (a === '--dry-run') dryRun = true;
  }
  return { dryRun };
}

async function main() {
  const { dryRun } = parseArgs();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Seed WEB verses for missing chapters (direct from GitHub)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (dryRun) console.log('  Mode: DRY RUN (no database changes)');
  console.log('');

  // Get books from database
  const { data: dbBooks, error: booksError } = await supabase
    .from('books')
    .select('id, slug, name')
    .order('order_index');

  if (booksError) {
    console.error(`Failed to fetch books: ${booksError.message}`);
    process.exit(1);
  }

  const bookMap = new Map(dbBooks!.map((b) => [b.slug, b]));

  let totalInserted = 0;
  let totalChapters = 0;

  for (const bookInfo of booksJson) {
    const { slug, total_chapters, name } = bookInfo;
    const dbBook = bookMap.get(slug);
    if (!dbBook) continue;

    // Find which chapters already have CT JSON files
    const bookDir = path.join(CT_DIR, slug);
    const existingChapters = new Set<number>();
    if (fs.existsSync(bookDir)) {
      for (const f of fs.readdirSync(bookDir)) {
        if (f.endsWith('.json')) {
          existingChapters.add(parseInt(f));
        }
      }
    }

    // Find missing chapters
    const missingChapters: number[] = [];
    for (let ch = 1; ch <= total_chapters; ch++) {
      if (!existingChapters.has(ch)) {
        missingChapters.push(ch);
      }
    }

    if (missingChapters.length === 0) continue;

    // Fetch WEB data for this book
    let webChapters: Map<number, { verse: number; text: string }[]>;
    try {
      webChapters = await fetchWEBBook(slug);
    } catch (err: any) {
      console.warn(`   ⚠ ${name}: Failed to fetch WEB data (${err.message})`);
      continue;
    }

    let bookVerses = 0;
    let bookChapters = 0;

    for (const ch of missingChapters) {
      const webVerses = webChapters.get(ch);
      if (!webVerses || webVerses.length === 0) {
        continue;
      }

      const versesToInsert = webVerses.map((v) => ({
        book_id: dbBook.id,
        chapter: ch,
        verse: v.verse,
        text: v.text,
        translation: 'web'
      }));

      if (dryRun) {
        bookVerses += versesToInsert.length;
        bookChapters++;
        totalInserted += versesToInsert.length;
        totalChapters++;
        continue;
      }

      const { error: insertError } = await supabase
        .from('verses')
        .upsert(versesToInsert, {
          onConflict: 'book_id,chapter,verse,translation'
        });

      if (insertError) {
        console.error(`   ${name} ch ${ch}: ${insertError.message}`);
        continue;
      }

      bookVerses += versesToInsert.length;
      bookChapters++;
      totalInserted += versesToInsert.length;
      totalChapters++;
    }

    if (bookVerses > 0) {
      console.log(`   ${name}: +${bookVerses} WEB verses across ${bookChapters} missing chapters`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (totalInserted === 0) {
    console.log('  No missing chapters found — all WEB verses already seeded!');
  } else {
    console.log(`  ${dryRun ? '[DRY RUN] Would insert' : 'Inserted'}: ${totalInserted} verses across ${totalChapters} chapters`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main();
