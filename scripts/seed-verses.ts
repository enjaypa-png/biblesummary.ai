/**
 * Seed KJV Bible Verses
 *
 * This script fetches KJV Bible text from GitHub and loads all ~31,000 verses
 * into the Supabase database.
 *
 * Source: https://github.com/aruljohn/Bible-kjv
 * License: Public Domain (KJV)
 *
 * Run with: npm run seed:verses
 *
 * Requirements:
 * - Books must be seeded first (run seed:books or SQL seed)
 * - SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

// GitHub raw content base URL
const GITHUB_BASE = 'https://raw.githubusercontent.com/aruljohn/Bible-kjv/master';

// Map of book names from GitHub to our database slugs
const BOOK_MAPPING: Record<string, string> = {
  'Genesis': 'genesis',
  'Exodus': 'exodus',
  'Leviticus': 'leviticus',
  'Numbers': 'numbers',
  'Deuteronomy': 'deuteronomy',
  'Joshua': 'joshua',
  'Judges': 'judges',
  'Ruth': 'ruth',
  '1Samuel': '1-samuel',
  '2Samuel': '2-samuel',
  '1Kings': '1-kings',
  '2Kings': '2-kings',
  '1Chronicles': '1-chronicles',
  '2Chronicles': '2-chronicles',
  'Ezra': 'ezra',
  'Nehemiah': 'nehemiah',
  'Esther': 'esther',
  'Job': 'job',
  'Psalms': 'psalms',
  'Proverbs': 'proverbs',
  'Ecclesiastes': 'ecclesiastes',
  'SongofSolomon': 'song-of-solomon',
  'Isaiah': 'isaiah',
  'Jeremiah': 'jeremiah',
  'Lamentations': 'lamentations',
  'Ezekiel': 'ezekiel',
  'Daniel': 'daniel',
  'Hosea': 'hosea',
  'Joel': 'joel',
  'Amos': 'amos',
  'Obadiah': 'obadiah',
  'Jonah': 'jonah',
  'Micah': 'micah',
  'Nahum': 'nahum',
  'Habakkuk': 'habakkuk',
  'Zephaniah': 'zephaniah',
  'Haggai': 'haggai',
  'Zechariah': 'zechariah',
  'Malachi': 'malachi',
  'Matthew': 'matthew',
  'Mark': 'mark',
  'Luke': 'luke',
  'John': 'john',
  'Acts': 'acts',
  'Romans': 'romans',
  '1Corinthians': '1-corinthians',
  '2Corinthians': '2-corinthians',
  'Galatians': 'galatians',
  'Ephesians': 'ephesians',
  'Philippians': 'philippians',
  'Colossians': 'colossians',
  '1Thessalonians': '1-thessalonians',
  '2Thessalonians': '2-thessalonians',
  '1Timothy': '1-timothy',
  '2Timothy': '2-timothy',
  'Titus': 'titus',
  'Philemon': 'philemon',
  'Hebrews': 'hebrews',
  'James': 'james',
  '1Peter': '1-peter',
  '2Peter': '2-peter',
  '1John': '1-john',
  '2John': '2-john',
  '3John': '3-john',
  'Jude': 'jude',
  'Revelation': 'revelation'
};

interface Verse {
  verse: string;
  text: string;
}

interface Chapter {
  chapter: string;
  verses: Verse[];
}

interface BookData {
  book: string;
  chapters: Chapter[];
}

async function fetchBookData(bookFilename: string): Promise<BookData> {
  const url = `${GITHUB_BASE}/${bookFilename}.json`;
  console.log(`   Fetching ${bookFilename}...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${bookFilename}: ${response.statusText}`);
  }

  return response.json();
}

async function seedVerses() {
  console.log('📖 Seeding KJV Bible verses...\n');

  try {
    // Get all books from database
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, slug')
      .order('order_index');

    if (booksError) throw new Error(`Failed to fetch books: ${booksError.message}`);
    if (!books || books.length === 0) {
      throw new Error('No books found in database. Run seed:books first.');
    }

    console.log(`Found ${books.length} books in database\n`);

    // Check if verses already exist
    const { count, error: countError } = await supabase
      .from('verses')
      .select('*', { count: 'exact', head: true });

    if (countError) throw new Error(`Failed to check verses: ${countError.message}`);

    if (count && count > 0) {
      console.log(`⚠️  Database already has ${count} verses`);
      console.log('   To re-seed, delete existing verses first:\n');
      console.log('   DELETE FROM verses;\n');
      process.exit(0);
    }

    let totalVerses = 0;
    let processedBooks = 0;

    // Process each book
    for (const [bookFilename, bookSlug] of Object.entries(BOOK_MAPPING)) {
      const book = books.find(b => b.slug === bookSlug);
      if (!book) {
        console.warn(`   ⚠️  Book not found: ${bookSlug}`);
        continue;
      }

      try {
        // Fetch book data from GitHub
        const bookData = await fetchBookData(bookFilename);

        // Prepare verses for insertion
        const versesToInsert = [];

        for (const chapter of bookData.chapters) {
          const chapterNum = parseInt(chapter.chapter);

          for (const verse of chapter.verses) {
            const verseNum = parseInt(verse.verse);

            versesToInsert.push({
              book_id: book.id,
              chapter: chapterNum,
              verse: verseNum,
              text: verse.text
            });
          }
        }

        // Insert verses in batches of 1000
        const BATCH_SIZE = 1000;
        for (let i = 0; i < versesToInsert.length; i += BATCH_SIZE) {
          const batch = versesToInsert.slice(i, i + BATCH_SIZE);

          const { error: insertError } = await supabase
            .from('verses')
            .insert(batch);

          if (insertError) {
            throw new Error(`Failed to insert batch: ${insertError.message}`);
          }
        }

        totalVerses += versesToInsert.length;
        processedBooks++;

        console.log(`   ✅ ${bookSlug}: ${versesToInsert.length} verses`);

      } catch (error) {
        console.error(`   ❌ Error processing ${bookFilename}:`, error);
        throw error;
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n✅ Successfully inserted ${totalVerses} verses from ${processedBooks} books\n`);

    // Verify total
    const { count: finalCount, error: finalCountError } = await supabase
      .from('verses')
      .select('*', { count: 'exact', head: true });

    if (!finalCountError) {
      console.log(`📊 Database now contains ${finalCount} verses\n`);
    }

    console.log('🎉 Verse seeding complete!');

  } catch (error) {
    console.error('\n❌ Error seeding verses:');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the seed function
seedVerses();
