/**
 * World English Bible (WEB) Fetcher
 *
 * Fetches WEB verses from TehShrike/world-english-bible on GitHub.
 * Public domain. Parses the structured JSON format into simple verse arrays.
 *
 * Usage (as a module):
 *   import { fetchWEBChapter, fetchWEBBook } from './fetch-web';
 */

const WEB_BASE = 'https://raw.githubusercontent.com/TehShrike/world-english-bible/master/json';

// Map our book slugs to WEB filenames
const SLUG_TO_WEB: Record<string, string> = {
  'genesis': 'genesis', 'exodus': 'exodus', 'leviticus': 'leviticus',
  'numbers': 'numbers', 'deuteronomy': 'deuteronomy', 'joshua': 'joshua',
  'judges': 'judges', 'ruth': 'ruth', '1-samuel': '1samuel', '2-samuel': '2samuel',
  '1-kings': '1kings', '2-kings': '2kings', '1-chronicles': '1chronicles',
  '2-chronicles': '2chronicles', 'ezra': 'ezra', 'nehemiah': 'nehemiah',
  'esther': 'esther', 'job': 'job', 'psalms': 'psalms', 'proverbs': 'proverbs',
  'ecclesiastes': 'ecclesiastes', 'song-of-solomon': 'songofsolomon',
  'isaiah': 'isaiah', 'jeremiah': 'jeremiah', 'lamentations': 'lamentations',
  'ezekiel': 'ezekiel', 'daniel': 'daniel', 'hosea': 'hosea', 'joel': 'joel',
  'amos': 'amos', 'obadiah': 'obadiah', 'jonah': 'jonah', 'micah': 'micah',
  'nahum': 'nahum', 'habakkuk': 'habakkuk', 'zephaniah': 'zephaniah',
  'haggai': 'haggai', 'zechariah': 'zechariah', 'malachi': 'malachi',
  'matthew': 'matthew', 'mark': 'mark', 'luke': 'luke', 'john': 'john',
  'acts': 'acts', 'romans': 'romans', '1-corinthians': '1corinthians',
  '2-corinthians': '2corinthians', 'galatians': 'galatians',
  'ephesians': 'ephesians', 'philippians': 'philippians',
  'colossians': 'colossians', '1-thessalonians': '1thessalonians',
  '2-thessalonians': '2thessalonians', '1-timothy': '1timothy',
  '2-timothy': '2timothy', 'titus': 'titus', 'philemon': 'philemon',
  'hebrews': 'hebrews', 'james': 'james', '1-peter': '1peter',
  '2-peter': '2peter', '1-john': '1john', '2-john': '2john',
  '3-john': '3john', 'jude': 'jude', 'revelation': 'revelation'
};

interface WEBItem {
  type: string;
  chapterNumber?: number;
  verseNumber?: number;
  value?: string;
}

export interface WEBVerse {
  verse: number;
  text: string;
}

// Cache so we only fetch each book once per process
const bookCache = new Map<string, Map<number, WEBVerse[]>>();

/**
 * Parse raw WEB JSON (array of typed items) into chapter → verse map
 */
function parseWEBBook(items: WEBItem[]): Map<number, WEBVerse[]> {
  const chapters = new Map<number, Map<number, string>>();

  for (const item of items) {
    if (item.type !== 'paragraph text' && item.type !== 'line text') continue;
    if (!item.chapterNumber || !item.verseNumber || !item.value) continue;

    const ch = item.chapterNumber;
    const v = item.verseNumber;
    let text = item.value.trim();

    // WEB uses "Yahweh" — normalize to "LORD"
    text = text.replace(/\bYahweh\b/g, 'LORD');
    // Remove trailing whitespace artifacts
    text = text.replace(/\s{2,}/g, ' ').trim();

    if (!chapters.has(ch)) chapters.set(ch, new Map());
    const chMap = chapters.get(ch)!;

    // Some verses span multiple items — concatenate
    if (chMap.has(v)) {
      chMap.set(v, chMap.get(v)! + ' ' + text);
    } else {
      chMap.set(v, text);
    }
  }

  // Convert to WEBVerse arrays sorted by verse number
  const result = new Map<number, WEBVerse[]>();
  for (const [ch, verseMap] of chapters) {
    const verses: WEBVerse[] = Array.from(verseMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([verse, text]) => ({ verse, text }));
    result.set(ch, verses);
  }

  return result;
}

/**
 * Fetch all chapters for a book. Cached after first fetch.
 */
export async function fetchWEBBook(bookSlug: string): Promise<Map<number, WEBVerse[]>> {
  if (bookCache.has(bookSlug)) return bookCache.get(bookSlug)!;

  const webName = SLUG_TO_WEB[bookSlug];
  if (!webName) throw new Error(`No WEB mapping for slug: ${bookSlug}`);

  const url = `${WEB_BASE}/${webName}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch WEB ${bookSlug}: ${res.statusText}`);

  const items: WEBItem[] = await res.json();
  const parsed = parseWEBBook(items);
  bookCache.set(bookSlug, parsed);
  return parsed;
}

/**
 * Fetch a single chapter's WEB verses.
 */
export async function fetchWEBChapter(bookSlug: string, chapter: number): Promise<WEBVerse[]> {
  const book = await fetchWEBBook(bookSlug);
  const verses = book.get(chapter);
  if (!verses) throw new Error(`WEB: no verses found for ${bookSlug} chapter ${chapter}`);
  return verses;
}
