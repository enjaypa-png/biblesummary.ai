/**
 * Seed KJV Bible Verses using REST API directly (no Supabase JS client)
 * This avoids any client version compatibility issues.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const GITHUB_BASE = 'https://raw.githubusercontent.com/aruljohn/Bible-kjv/master';

const BOOK_FILES: Record<string, string> = {
  'Genesis': 'genesis', 'Exodus': 'exodus', 'Leviticus': 'leviticus',
  'Numbers': 'numbers', 'Deuteronomy': 'deuteronomy', 'Joshua': 'joshua',
  'Judges': 'judges', 'Ruth': 'ruth', '1Samuel': '1-samuel', '2Samuel': '2-samuel',
  '1Kings': '1-kings', '2Kings': '2-kings', '1Chronicles': '1-chronicles',
  '2Chronicles': '2-chronicles', 'Ezra': 'ezra', 'Nehemiah': 'nehemiah',
  'Esther': 'esther', 'Job': 'job', 'Psalms': 'psalms', 'Proverbs': 'proverbs',
  'Ecclesiastes': 'ecclesiastes', 'SongofSolomon': 'song-of-solomon',
  'Isaiah': 'isaiah', 'Jeremiah': 'jeremiah', 'Lamentations': 'lamentations',
  'Ezekiel': 'ezekiel', 'Daniel': 'daniel', 'Hosea': 'hosea', 'Joel': 'joel',
  'Amos': 'amos', 'Obadiah': 'obadiah', 'Jonah': 'jonah', 'Micah': 'micah',
  'Nahum': 'nahum', 'Habakkuk': 'habakkuk', 'Zephaniah': 'zephaniah',
  'Haggai': 'haggai', 'Zechariah': 'zechariah', 'Malachi': 'malachi',
  'Matthew': 'matthew', 'Mark': 'mark', 'Luke': 'luke', 'John': 'john',
  'Acts': 'acts', 'Romans': 'romans', '1Corinthians': '1-corinthians',
  '2Corinthians': '2-corinthians', 'Galatians': 'galatians', 'Ephesians': 'ephesians',
  'Philippians': 'philippians', 'Colossians': 'colossians',
  '1Thessalonians': '1-thessalonians', '2Thessalonians': '2-thessalonians',
  '1Timothy': '1-timothy', '2Timothy': '2-timothy', 'Titus': 'titus',
  'Philemon': 'philemon', 'Hebrews': 'hebrews', 'James': 'james',
  '1Peter': '1-peter', '2Peter': '2-peter', '1John': '1-john',
  '2John': '2-john', '3John': '3-john', 'Jude': 'jude', 'Revelation': 'revelation'
};

// Direct REST API call to Supabase (bypasses JS client entirely)
async function supabaseRest(endpoint: string, method: string, body?: any) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    method,
    headers: {
      'apikey': SERVICE_KEY!,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Accept-Profile': 'public',
      'Content-Profile': 'public',
      'Prefer': method === 'POST' ? 'return=minimal' : 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase REST error (${res.status}): ${text}`);
  }
  if (method === 'GET') return res.json();
  return null;
}

async function main() {
  console.log('Seeding KJV Bible verses...\n');

  // Get books from database
  const books: { id: string; slug: string }[] = await supabaseRest(
    'books?select=id,slug&order=order_index', 'GET'
  );
  console.log(`Found ${books.length} books in database\n`);

  if (books.length === 0) {
    console.error('No books found. Run the books SQL seed first.');
    process.exit(1);
  }

  // Check existing verses
  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/verses?select=id&limit=1`,
    { headers: { 'apikey': SERVICE_KEY!, 'Authorization': `Bearer ${SERVICE_KEY}` } }
  );
  const existing = await existingRes.json();
  if (existing.length > 0) {
    console.log('Verses already exist. To re-seed, run in Supabase SQL Editor:');
    console.log('  DELETE FROM verses;');
    process.exit(0);
  }

  let totalVerses = 0;

  for (const [filename, slug] of Object.entries(BOOK_FILES)) {
    const book = books.find(b => b.slug === slug);
    if (!book) { console.warn(`  Book not found: ${slug}`); continue; }

    // Fetch from GitHub
    console.log(`  Fetching ${filename}...`);
    const ghRes = await fetch(`${GITHUB_BASE}/${filename}.json`);
    if (!ghRes.ok) { console.error(`  Failed to fetch ${filename}`); continue; }
    const data = await ghRes.json();

    // Build verses array
    const verses: { book_id: string; chapter: number; verse: number; text: string }[] = [];
    for (const ch of data.chapters) {
      for (const v of ch.verses) {
        verses.push({
          book_id: book.id,
          chapter: parseInt(ch.chapter),
          verse: parseInt(v.verse),
          text: v.text
        });
      }
    }

    // Insert in batches of 500
    for (let i = 0; i < verses.length; i += 500) {
      const batch = verses.slice(i, i + 500);
      await supabaseRest('verses', 'POST', batch);
    }

    totalVerses += verses.length;
    console.log(`  Done: ${slug} (${verses.length} verses)`);

    // Small delay
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\nTotal: ${totalVerses} verses loaded.`);
  console.log('Done!');
}

main().catch(e => { console.error(e); process.exit(1); });
