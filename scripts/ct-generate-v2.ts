/**
 * Clear Bible Translation (CT) — Generator v2
 *
 * Uses WEB + KJV as dual-source input to Claude Opus.
 * Produces NIV/God's Word quality fresh renderings.
 * Output saved to data/translations/ct/{book}/{chapter}.json
 *
 * Usage:
 *   npx tsx scripts/ct-generate-v2.ts                          # All books
 *   npx tsx scripts/ct-generate-v2.ts --book genesis           # One book
 *   npx tsx scripts/ct-generate-v2.ts --book genesis --chapter 1
 *   npx tsx scripts/ct-generate-v2.ts --book genesis --force   # Regenerate existing
 *
 * Requirements:
 *   ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { CT_SYSTEM_PROMPT_V2, buildUserPromptV2 } from './ct-translation/prompt-v2';
import { fetchWEBChapter } from './fetch-web';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
if (!anthropicApiKey) { console.error('❌ Missing ANTHROPIC_API_KEY'); process.exit(1); }

const anthropic = new Anthropic({ apiKey: anthropicApiKey });

const MODEL = 'claude-opus-4-6';
const MAX_TOKENS = 16384;
const TEMPERATURE = 0.3;
const DELAY_MS = 1500;
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'translations', 'ct');
const GITHUB_BASE = 'https://raw.githubusercontent.com/aruljohn/Bible-kjv/master';

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

interface Verse { verse: number; text: string; }

// Cache for KJV book data
const kjvCache = new Map<string, any>();

async function fetchKJVChapter(slug: string, chapter: number): Promise<Verse[]> {
  if (!kjvCache.has(slug)) {
    const name = SLUG_TO_GITHUB[slug];
    if (!name) throw new Error(`No KJV mapping for ${slug}`);
    const res = await fetch(`${GITHUB_BASE}/${name}.json`);
    if (!res.ok) throw new Error(`KJV fetch failed for ${slug}`);
    kjvCache.set(slug, await res.json());
  }
  const book = kjvCache.get(slug);
  const ch = book.chapters.find((c: any) => parseInt(c.chapter) === chapter);
  if (!ch) throw new Error(`KJV: no chapter ${chapter} in ${slug}`);
  return ch.verses.map((v: any) => ({ verse: parseInt(v.verse), text: v.text }));
}

function parseArgs() {
  const args = process.argv.slice(2);
  let book: string | null = null;
  let chapter: number | null = null;
  let force = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--book' && args[i+1]) { book = args[++i]; }
    else if (args[i] === '--chapter' && args[i+1]) { chapter = parseInt(args[++i]); }
    else if (args[i] === '--force') { force = true; }
  }
  return { book, chapter, force };
}

function outputPath(slug: string, ch: number) {
  return path.join(OUTPUT_DIR, slug, `${ch}.json`);
}

function exists(slug: string, ch: number) {
  return fs.existsSync(outputPath(slug, ch));
}

async function generateChapter(bookSlug: string, bookName: string, chapter: number): Promise<any[]> {
  const [kjvVerses, webVerses] = await Promise.all([
    fetchKJVChapter(bookSlug, chapter),
    fetchWEBChapter(bookSlug, chapter)
  ]);

  // Build a verse number → web text map for alignment
  const webMap = new Map(webVerses.map(v => [v.verse, v.text]));

  const combined = kjvVerses.map(kjv => ({
    verse: kjv.verse,
    kjv: kjv.text,
    web: webMap.get(kjv.verse) || kjv.text // fallback to KJV if WEB missing
  }));

  const userPrompt = buildUserPromptV2(bookName, chapter, combined);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: CT_SYSTEM_PROMPT_V2,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const block = response.content.find(b => b.type === 'text');
  if (!block || block.type !== 'text') throw new Error('No text in response');

  let parsed: any[];
  try {
    parsed = JSON.parse(block.text);
  } catch {
    const match = block.text.match(/\[[\s\S]*\]/);
    if (match) parsed = JSON.parse(match[0]);
    else throw new Error(`Cannot parse JSON from response:\n${block.text.slice(0, 300)}`);
  }

  if (parsed.length !== kjvVerses.length) {
    console.warn(`   ⚠️  Verse count mismatch: KJV ${kjvVerses.length}, CT ${parsed.length}`);
  }

  // Save with all sources for review
  const out = {
    book: bookSlug,
    book_name: bookName,
    chapter,
    translation: 'ct',
    prompt_version: 'v2',
    generated_at: new Date().toISOString(),
    model: MODEL,
    verses: kjvVerses.map((kjv, i) => ({
      verse: kjv.verse,
      kjv: kjv.text,
      web: webMap.get(kjv.verse) || '',
      ct: parsed[i]?.text || `[MISSING - verse ${kjv.verse}]`
    }))
  };

  const dir = path.join(OUTPUT_DIR, bookSlug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath(bookSlug, chapter), JSON.stringify(out, null, 2));

  return parsed;
}

async function main() {
  const { book: bookFilter, chapter: chapterFilter, force } = parseArgs();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Clear Bible Translation — Generator v2');
  console.log('  Source: WEB + KJV dual input');
  console.log('  Style: NIV / God\'s Word quality');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Load books from data/books.json
  const booksPath = path.join(process.cwd(), 'data', 'books.json');
  let books = JSON.parse(fs.readFileSync(booksPath, 'utf-8'));
  if (bookFilter) books = books.filter((b: any) => b.slug === bookFilter);
  if (!books.length) { console.error(`❌ No book found: ${bookFilter}`); process.exit(1); }

  let totalGenerated = 0;
  let totalSkipped = 0;

  for (const book of books) {
    console.log(`\n📖 ${book.name}`);
    const chapters = chapterFilter
      ? [chapterFilter]
      : Array.from({ length: book.total_chapters }, (_, i) => i + 1);

    for (const ch of chapters) {
      if (!force && exists(book.slug, ch)) {
        totalSkipped++;
        continue;
      }
      try {
        await generateChapter(book.slug, book.name, ch);
        console.log(`   ✅ ${book.name} ${ch}`);
        totalGenerated++;
        await new Promise(r => setTimeout(r, DELAY_MS));
      } catch (err) {
        console.error(`   ❌ ${book.name} ${ch}: ${err instanceof Error ? err.message : err}`);
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Done. Generated: ${totalGenerated} | Skipped: ${totalSkipped}`);
}

main();
