/**
 * CT Quality Review — Key Verses
 *
 * Pulls the most well-known Bible verses from Supabase and displays
 * them side-by-side (KJV vs CT) for quality review.
 *
 * Usage:
 *   npm run ct:review                    # Review key verses (terminal + HTML)
 *   npm run ct:review -- --genre poetry  # Filter by genre
 *   npm run ct:review -- --genre all     # Show all genres
 *
 * Outputs:
 *   - Terminal: side-by-side comparison
 *   - HTML file: data/translations/ct-review.html (open in browser)
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

// ─── The "Greatest Hits" — verses every Bible reader knows ───────────────────

interface KeyVerse {
  ref: string;       // e.g., "John 3:16"
  book_slug: string;
  chapter: number;
  verse: number;
  genre: string;     // narrative, poetry, law, prophecy, epistle, gospel
  note: string;      // why this verse matters for review
}

const KEY_VERSES: KeyVerse[] = [
  // ── Genesis / Creation ──
  { ref: 'Genesis 1:1', book_slug: 'genesis', chapter: 1, verse: 1, genre: 'narrative', note: 'Most iconic opening line in literature' },
  { ref: 'Genesis 1:3', book_slug: 'genesis', chapter: 1, verse: 3, genre: 'narrative', note: 'Let there be light — must be powerful and simple' },
  { ref: 'Genesis 1:27', book_slug: 'genesis', chapter: 1, verse: 27, genre: 'narrative', note: 'Created 3x repetition — must be preserved' },
  { ref: 'Genesis 1:31', book_slug: 'genesis', chapter: 1, verse: 31, genre: 'narrative', note: 'Very good — capstone of creation' },
  { ref: 'Genesis 2:7', book_slug: 'genesis', chapter: 2, verse: 7, genre: 'narrative', note: 'Breath of life — theological weight' },
  { ref: 'Genesis 2:18', book_slug: 'genesis', chapter: 2, verse: 18, genre: 'narrative', note: 'Not good for man to be alone' },
  { ref: 'Genesis 3:9', book_slug: 'genesis', chapter: 3, verse: 9, genre: 'narrative', note: 'Where art thou — God seeking man' },
  { ref: 'Genesis 12:1', book_slug: 'genesis', chapter: 12, verse: 1, genre: 'narrative', note: 'Abrahams call — foundational covenant' },
  { ref: 'Genesis 22:8', book_slug: 'genesis', chapter: 22, verse: 8, genre: 'narrative', note: 'God will provide — prophetic' },
  { ref: 'Genesis 50:20', book_slug: 'genesis', chapter: 50, verse: 20, genre: 'narrative', note: 'What you meant for evil — Josephs declaration' },

  // ── Exodus ──
  { ref: 'Exodus 3:14', book_slug: 'exodus', chapter: 3, verse: 14, genre: 'narrative', note: 'I AM THAT I AM — divine name' },
  { ref: 'Exodus 14:14', book_slug: 'exodus', chapter: 14, verse: 14, genre: 'narrative', note: 'The LORD shall fight for you' },
  { ref: 'Exodus 20:3', book_slug: 'exodus', chapter: 20, verse: 3, genre: 'law', note: 'First commandment' },

  // ── Leviticus / Numbers / Deuteronomy ──
  { ref: 'Leviticus 19:18', book_slug: 'leviticus', chapter: 19, verse: 18, genre: 'law', note: 'Love thy neighbor — quoted by Jesus' },
  { ref: 'Numbers 6:24', book_slug: 'numbers', chapter: 6, verse: 24, genre: 'poetry', note: 'The LORD bless thee — priestly blessing start' },
  { ref: 'Numbers 6:25', book_slug: 'numbers', chapter: 6, verse: 25, genre: 'poetry', note: 'Priestly blessing continued' },
  { ref: 'Numbers 6:26', book_slug: 'numbers', chapter: 6, verse: 26, genre: 'poetry', note: 'Priestly blessing end — give thee peace' },
  { ref: 'Deuteronomy 6:4', book_slug: 'deuteronomy', chapter: 6, verse: 4, genre: 'law', note: 'Hear O Israel — the Shema' },
  { ref: 'Deuteronomy 6:5', book_slug: 'deuteronomy', chapter: 6, verse: 5, genre: 'law', note: 'Love the LORD with all your heart' },
  { ref: 'Deuteronomy 31:6', book_slug: 'deuteronomy', chapter: 31, verse: 6, genre: 'narrative', note: 'Be strong and courageous' },

  // ── Joshua / Judges / Ruth ──
  { ref: 'Joshua 1:9', book_slug: 'joshua', chapter: 1, verse: 9, genre: 'narrative', note: 'Be strong and courageous — popular verse' },
  { ref: 'Joshua 24:15', book_slug: 'joshua', chapter: 24, verse: 15, genre: 'narrative', note: 'As for me and my house' },
  { ref: 'Ruth 1:16', book_slug: 'ruth', chapter: 1, verse: 16, genre: 'narrative', note: 'Where you go I will go — iconic loyalty' },

  // ── Psalms (Poetry) ──
  { ref: 'Psalm 1:1', book_slug: 'psalms', chapter: 1, verse: 1, genre: 'poetry', note: 'Blessed is the man — opening psalm' },
  { ref: 'Psalm 23:1', book_slug: 'psalms', chapter: 23, verse: 1, genre: 'poetry', note: 'The LORD is my shepherd' },
  { ref: 'Psalm 23:4', book_slug: 'psalms', chapter: 23, verse: 4, genre: 'poetry', note: 'Valley of the shadow of death' },
  { ref: 'Psalm 23:6', book_slug: 'psalms', chapter: 23, verse: 6, genre: 'poetry', note: 'Goodness and mercy — closing' },
  { ref: 'Psalm 27:1', book_slug: 'psalms', chapter: 27, verse: 1, genre: 'poetry', note: 'The LORD is my light' },
  { ref: 'Psalm 37:4', book_slug: 'psalms', chapter: 37, verse: 4, genre: 'poetry', note: 'Delight thyself in the LORD' },
  { ref: 'Psalm 46:1', book_slug: 'psalms', chapter: 46, verse: 1, genre: 'poetry', note: 'God is our refuge and strength' },
  { ref: 'Psalm 46:10', book_slug: 'psalms', chapter: 46, verse: 10, genre: 'poetry', note: 'Be still and know' },
  { ref: 'Psalm 51:10', book_slug: 'psalms', chapter: 51, verse: 10, genre: 'poetry', note: 'Create in me a clean heart' },
  { ref: 'Psalm 91:1', book_slug: 'psalms', chapter: 91, verse: 1, genre: 'poetry', note: 'Dwells in the secret place' },
  { ref: 'Psalm 91:11', book_slug: 'psalms', chapter: 91, verse: 11, genre: 'poetry', note: 'Angels charge over thee' },
  { ref: 'Psalm 100:3', book_slug: 'psalms', chapter: 100, verse: 3, genre: 'poetry', note: 'We are his people' },
  { ref: 'Psalm 103:12', book_slug: 'psalms', chapter: 103, verse: 12, genre: 'poetry', note: 'As far as east from west' },
  { ref: 'Psalm 118:24', book_slug: 'psalms', chapter: 118, verse: 24, genre: 'poetry', note: 'This is the day the LORD has made' },
  { ref: 'Psalm 119:105', book_slug: 'psalms', chapter: 119, verse: 105, genre: 'poetry', note: 'Thy word is a lamp' },
  { ref: 'Psalm 121:1', book_slug: 'psalms', chapter: 121, verse: 1, genre: 'poetry', note: 'I lift my eyes to the hills' },
  { ref: 'Psalm 139:14', book_slug: 'psalms', chapter: 139, verse: 14, genre: 'poetry', note: 'Fearfully and wonderfully made' },
  { ref: 'Psalm 150:6', book_slug: 'psalms', chapter: 150, verse: 6, genre: 'poetry', note: 'Let everything that has breath praise the LORD' },

  // ── Proverbs / Ecclesiastes ──
  { ref: 'Proverbs 3:5', book_slug: 'proverbs', chapter: 3, verse: 5, genre: 'poetry', note: 'Trust in the LORD with all your heart' },
  { ref: 'Proverbs 3:6', book_slug: 'proverbs', chapter: 3, verse: 6, genre: 'poetry', note: 'He shall direct thy paths' },
  { ref: 'Proverbs 22:6', book_slug: 'proverbs', chapter: 22, verse: 6, genre: 'poetry', note: 'Train up a child' },
  { ref: 'Proverbs 31:10', book_slug: 'proverbs', chapter: 31, verse: 10, genre: 'poetry', note: 'Virtuous woman' },
  { ref: 'Ecclesiastes 3:1', book_slug: 'ecclesiastes', chapter: 3, verse: 1, genre: 'poetry', note: 'To everything there is a season' },

  // ── Prophecy (Isaiah / Jeremiah / etc.) ──
  { ref: 'Isaiah 6:8', book_slug: 'isaiah', chapter: 6, verse: 8, genre: 'prophecy', note: 'Here am I, send me' },
  { ref: 'Isaiah 9:6', book_slug: 'isaiah', chapter: 9, verse: 6, genre: 'prophecy', note: 'For unto us a child is born — messianic' },
  { ref: 'Isaiah 40:31', book_slug: 'isaiah', chapter: 40, verse: 31, genre: 'prophecy', note: 'Mount up with wings as eagles' },
  { ref: 'Isaiah 41:10', book_slug: 'isaiah', chapter: 41, verse: 10, genre: 'prophecy', note: 'Fear not for I am with you' },
  { ref: 'Isaiah 53:5', book_slug: 'isaiah', chapter: 53, verse: 5, genre: 'prophecy', note: 'By his stripes we are healed' },
  { ref: 'Isaiah 55:8', book_slug: 'isaiah', chapter: 55, verse: 8, genre: 'prophecy', note: 'My thoughts are not your thoughts' },
  { ref: 'Jeremiah 29:11', book_slug: 'jeremiah', chapter: 29, verse: 11, genre: 'prophecy', note: 'Plans to prosper you — most quoted OT verse' },
  { ref: 'Micah 6:8', book_slug: 'micah', chapter: 6, verse: 8, genre: 'prophecy', note: 'Do justly, love mercy, walk humbly' },

  // ── Gospels ──
  { ref: 'Matthew 5:3', book_slug: 'matthew', chapter: 5, verse: 3, genre: 'gospel', note: 'Blessed are the poor in spirit — Beatitudes' },
  { ref: 'Matthew 5:14', book_slug: 'matthew', chapter: 5, verse: 14, genre: 'gospel', note: 'You are the light of the world' },
  { ref: 'Matthew 6:9', book_slug: 'matthew', chapter: 6, verse: 9, genre: 'gospel', note: 'Our Father — Lords Prayer start' },
  { ref: 'Matthew 6:33', book_slug: 'matthew', chapter: 6, verse: 33, genre: 'gospel', note: 'Seek first the kingdom' },
  { ref: 'Matthew 7:7', book_slug: 'matthew', chapter: 7, verse: 7, genre: 'gospel', note: 'Ask and it shall be given' },
  { ref: 'Matthew 11:28', book_slug: 'matthew', chapter: 11, verse: 28, genre: 'gospel', note: 'Come unto me all ye that labor' },
  { ref: 'Matthew 22:37', book_slug: 'matthew', chapter: 22, verse: 37, genre: 'gospel', note: 'Greatest commandment' },
  { ref: 'Matthew 28:19', book_slug: 'matthew', chapter: 28, verse: 19, genre: 'gospel', note: 'Great Commission' },
  { ref: 'Matthew 28:20', book_slug: 'matthew', chapter: 28, verse: 20, genre: 'gospel', note: 'I am with you always' },
  { ref: 'John 1:1', book_slug: 'john', chapter: 1, verse: 1, genre: 'gospel', note: 'In the beginning was the Word' },
  { ref: 'John 1:14', book_slug: 'john', chapter: 1, verse: 14, genre: 'gospel', note: 'The Word became flesh' },
  { ref: 'John 3:16', book_slug: 'john', chapter: 3, verse: 16, genre: 'gospel', note: 'For God so loved the world — THE verse' },
  { ref: 'John 3:17', book_slug: 'john', chapter: 3, verse: 17, genre: 'gospel', note: 'Not to condemn but to save' },
  { ref: 'John 8:32', book_slug: 'john', chapter: 8, verse: 32, genre: 'gospel', note: 'The truth shall set you free' },
  { ref: 'John 10:10', book_slug: 'john', chapter: 10, verse: 10, genre: 'gospel', note: 'I am come that they might have life' },
  { ref: 'John 11:35', book_slug: 'john', chapter: 11, verse: 35, genre: 'gospel', note: 'Jesus wept — shortest verse' },
  { ref: 'John 13:34', book_slug: 'john', chapter: 13, verse: 34, genre: 'gospel', note: 'Love one another' },
  { ref: 'John 14:6', book_slug: 'john', chapter: 14, verse: 6, genre: 'gospel', note: 'I am the way the truth and the life' },
  { ref: 'John 14:27', book_slug: 'john', chapter: 14, verse: 27, genre: 'gospel', note: 'Peace I leave with you' },
  { ref: 'John 15:13', book_slug: 'john', chapter: 15, verse: 13, genre: 'gospel', note: 'Greater love hath no man' },

  // ── Acts ──
  { ref: 'Acts 1:8', book_slug: 'acts', chapter: 1, verse: 8, genre: 'narrative', note: 'You shall receive power' },
  { ref: 'Acts 2:38', book_slug: 'acts', chapter: 2, verse: 38, genre: 'narrative', note: 'Repent and be baptized' },

  // ── Epistles (Romans, Corinthians, etc.) ──
  { ref: 'Romans 1:16', book_slug: 'romans', chapter: 1, verse: 16, genre: 'epistle', note: 'Not ashamed of the gospel' },
  { ref: 'Romans 3:23', book_slug: 'romans', chapter: 3, verse: 23, genre: 'epistle', note: 'All have sinned' },
  { ref: 'Romans 5:8', book_slug: 'romans', chapter: 5, verse: 8, genre: 'epistle', note: 'While we were yet sinners' },
  { ref: 'Romans 6:23', book_slug: 'romans', chapter: 6, verse: 23, genre: 'epistle', note: 'Wages of sin is death' },
  { ref: 'Romans 8:1', book_slug: 'romans', chapter: 8, verse: 1, genre: 'epistle', note: 'No condemnation' },
  { ref: 'Romans 8:28', book_slug: 'romans', chapter: 8, verse: 28, genre: 'epistle', note: 'All things work together for good' },
  { ref: 'Romans 8:31', book_slug: 'romans', chapter: 8, verse: 31, genre: 'epistle', note: 'If God be for us' },
  { ref: 'Romans 8:38', book_slug: 'romans', chapter: 8, verse: 38, genre: 'epistle', note: 'Nothing can separate us' },
  { ref: 'Romans 10:9', book_slug: 'romans', chapter: 10, verse: 9, genre: 'epistle', note: 'Confess and believe — salvation verse' },
  { ref: 'Romans 12:2', book_slug: 'romans', chapter: 12, verse: 2, genre: 'epistle', note: 'Be not conformed to this world' },
  { ref: '1 Corinthians 10:13', book_slug: '1-corinthians', chapter: 10, verse: 13, genre: 'epistle', note: 'No temptation beyond what you can bear' },
  { ref: '1 Corinthians 13:4', book_slug: '1-corinthians', chapter: 13, verse: 4, genre: 'epistle', note: 'Love is patient — love chapter' },
  { ref: '1 Corinthians 13:13', book_slug: '1-corinthians', chapter: 13, verse: 13, genre: 'epistle', note: 'Faith hope and love' },
  { ref: '2 Corinthians 5:17', book_slug: '2-corinthians', chapter: 5, verse: 17, genre: 'epistle', note: 'New creature in Christ' },
  { ref: '2 Corinthians 12:9', book_slug: '2-corinthians', chapter: 12, verse: 9, genre: 'epistle', note: 'My grace is sufficient' },
  { ref: 'Galatians 2:20', book_slug: 'galatians', chapter: 2, verse: 20, genre: 'epistle', note: 'Crucified with Christ' },
  { ref: 'Galatians 5:22', book_slug: 'galatians', chapter: 5, verse: 22, genre: 'epistle', note: 'Fruit of the Spirit' },
  { ref: 'Ephesians 2:8', book_slug: 'ephesians', chapter: 2, verse: 8, genre: 'epistle', note: 'By grace through faith' },
  { ref: 'Ephesians 2:10', book_slug: 'ephesians', chapter: 2, verse: 10, genre: 'epistle', note: 'We are his workmanship' },
  { ref: 'Ephesians 6:11', book_slug: 'ephesians', chapter: 6, verse: 11, genre: 'epistle', note: 'Armor of God' },
  { ref: 'Philippians 4:6', book_slug: 'philippians', chapter: 4, verse: 6, genre: 'epistle', note: 'Be anxious for nothing' },
  { ref: 'Philippians 4:8', book_slug: 'philippians', chapter: 4, verse: 8, genre: 'epistle', note: 'Whatever is true, noble, right' },
  { ref: 'Philippians 4:13', book_slug: 'philippians', chapter: 4, verse: 13, genre: 'epistle', note: 'I can do all things through Christ' },
  { ref: 'Colossians 3:23', book_slug: 'colossians', chapter: 3, verse: 23, genre: 'epistle', note: 'Work as unto the Lord' },
  { ref: '2 Timothy 1:7', book_slug: '2-timothy', chapter: 1, verse: 7, genre: 'epistle', note: 'Spirit of power love and sound mind' },
  { ref: '2 Timothy 3:16', book_slug: '2-timothy', chapter: 3, verse: 16, genre: 'epistle', note: 'All scripture is God-breathed' },
  { ref: 'Hebrews 4:12', book_slug: 'hebrews', chapter: 4, verse: 12, genre: 'epistle', note: 'Word of God is living and active' },
  { ref: 'Hebrews 11:1', book_slug: 'hebrews', chapter: 11, verse: 1, genre: 'epistle', note: 'Faith is the substance of things hoped for' },
  { ref: 'Hebrews 12:1', book_slug: 'hebrews', chapter: 12, verse: 1, genre: 'epistle', note: 'Cloud of witnesses' },
  { ref: 'James 1:2', book_slug: 'james', chapter: 1, verse: 2, genre: 'epistle', note: 'Count it all joy' },
  { ref: 'James 1:5', book_slug: 'james', chapter: 1, verse: 5, genre: 'epistle', note: 'If any lack wisdom' },
  { ref: '1 Peter 5:7', book_slug: '1-peter', chapter: 5, verse: 7, genre: 'epistle', note: 'Cast all your cares' },
  { ref: '1 John 1:9', book_slug: '1-john', chapter: 1, verse: 9, genre: 'epistle', note: 'If we confess our sins' },
  { ref: '1 John 4:8', book_slug: '1-john', chapter: 4, verse: 8, genre: 'epistle', note: 'God is love' },

  // ── Revelation ──
  { ref: 'Revelation 3:20', book_slug: 'revelation', chapter: 3, verse: 20, genre: 'prophecy', note: 'Behold I stand at the door and knock' },
  { ref: 'Revelation 21:4', book_slug: 'revelation', chapter: 21, verse: 4, genre: 'prophecy', note: 'No more tears — new heaven' },
];

// ─── Fetch from Supabase ─────────────────────────────────────────────────────

interface VerseResult {
  ref: string;
  genre: string;
  note: string;
  kjv: string;
  ct: string;
}

async function fetchVerses(): Promise<VerseResult[]> {
  // First get all books for slug→id mapping
  const { data: books } = await supabase
    .from('books')
    .select('id, slug');

  if (!books) {
    console.error('❌ Could not fetch books');
    process.exit(1);
  }

  const slugToId = new Map(books.map(b => [b.slug, b.id]));
  const results: VerseResult[] = [];

  for (const kv of KEY_VERSES) {
    const bookId = slugToId.get(kv.book_slug);
    if (!bookId) {
      results.push({ ref: kv.ref, genre: kv.genre, note: kv.note, kjv: '[BOOK NOT FOUND]', ct: '[BOOK NOT FOUND]' });
      continue;
    }

    // Fetch KJV
    const { data: kjvRow } = await supabase
      .from('verses')
      .select('text')
      .eq('book_id', bookId)
      .eq('chapter', kv.chapter)
      .eq('verse', kv.verse)
      .eq('translation', 'kjv')
      .single();

    // Fetch CT
    const { data: ctRow } = await supabase
      .from('verses')
      .select('text')
      .eq('book_id', bookId)
      .eq('chapter', kv.chapter)
      .eq('verse', kv.verse)
      .eq('translation', 'ct')
      .single();

    results.push({
      ref: kv.ref,
      genre: kv.genre,
      note: kv.note,
      kjv: kjvRow?.text || '[NOT FOUND]',
      ct: ctRow?.text || '[NOT FOUND]'
    });
  }

  return results;
}

// ─── Terminal Output ─────────────────────────────────────────────────────────

function printTerminal(results: VerseResult[], genreFilter: string | null) {
  const filtered = genreFilter && genreFilter !== 'all'
    ? results.filter(r => r.genre === genreFilter)
    : results;

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  CT Quality Review — ${filtered.length} Key Verses`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  let currentGenre = '';

  for (const r of filtered) {
    if (r.genre !== currentGenre) {
      currentGenre = r.genre;
      console.log(`\n  ── ${currentGenre.toUpperCase()} ──────────────────────────────────────\n`);
    }

    console.log(`  📖 ${r.ref}  (${r.note})`);
    console.log(`  KJV: ${r.kjv}`);
    console.log(`  CT:  ${r.ct}`);
    console.log('');
  }

  // Summary
  const missing = filtered.filter(r => r.ct === '[NOT FOUND]');
  if (missing.length > 0) {
    console.log(`\n  ⚠️  ${missing.length} verses missing CT translation:`);
    for (const m of missing) {
      console.log(`     - ${m.ref}`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  HTML review file saved to: data/translations/ct-review.html`);
  console.log(`  Open it in your browser for an easier reading experience.`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

// ─── HTML Output ─────────────────────────────────────────────────────────────

function generateHTML(results: VerseResult[]): string {
  const genreColors: Record<string, string> = {
    narrative: '#2563eb',
    poetry: '#7c3aed',
    law: '#b45309',
    prophecy: '#dc2626',
    gospel: '#059669',
    epistle: '#0891b2'
  };

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CT Quality Review — Key Verses</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', serif; background: #f8f9fa; color: #1a1a1a; padding: 2rem; max-width: 900px; margin: 0 auto; }
  h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
  .subtitle { color: #666; margin-bottom: 2rem; font-size: 0.95rem; }
  .filters { margin-bottom: 2rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .filter-btn { padding: 0.4rem 1rem; border: 1px solid #ddd; border-radius: 20px; background: white; cursor: pointer; font-size: 0.85rem; }
  .filter-btn.active { background: #1a1a1a; color: white; border-color: #1a1a1a; }
  .genre-header { font-size: 1.1rem; font-weight: bold; margin: 2rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #ddd; text-transform: uppercase; letter-spacing: 0.05em; }
  .verse-card { background: white; border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .verse-ref { font-weight: bold; font-size: 1rem; margin-bottom: 0.15rem; }
  .verse-note { font-size: 0.8rem; color: #888; margin-bottom: 0.75rem; font-style: italic; }
  .verse-genre { display: inline-block; font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 10px; color: white; margin-left: 0.5rem; vertical-align: middle; }
  .verse-text { margin-bottom: 0.5rem; line-height: 1.6; }
  .verse-label { font-weight: bold; font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 0.03em; }
  .kjv-text { color: #555; }
  .ct-text { color: #1a1a1a; }
  .missing { color: #dc2626; font-style: italic; }
  .stats { background: white; border-radius: 8px; padding: 1rem; margin-bottom: 2rem; display: flex; gap: 2rem; font-size: 0.9rem; }
  .stat-num { font-size: 1.5rem; font-weight: bold; }
</style>
</head>
<body>
<h1>CT Quality Review</h1>
<p class="subtitle">${results.length} key verses — side-by-side KJV and Clear Translation</p>

<div class="stats">
  <div><div class="stat-num">${results.length}</div>Verses</div>
  <div><div class="stat-num">${results.filter(r => r.ct !== '[NOT FOUND]').length}</div>With CT</div>
  <div><div class="stat-num">${results.filter(r => r.ct === '[NOT FOUND]').length}</div>Missing</div>
</div>

<div class="filters">
  <button class="filter-btn active" onclick="filterGenre('all')">All</button>
  ${[...new Set(results.map(r => r.genre))].map(g =>
    `<button class="filter-btn" onclick="filterGenre('${g}')">${g}</button>`
  ).join('\n  ')}
</div>

`;

  let currentGenre = '';
  for (const r of results) {
    if (r.genre !== currentGenre) {
      currentGenre = r.genre;
      const color = genreColors[r.genre] || '#666';
      html += `<div class="genre-header" data-genre="${r.genre}" style="color: ${color}">${r.genre}</div>\n`;
    }

    const ctClass = r.ct === '[NOT FOUND]' ? 'missing' : 'ct-text';
    const color = genreColors[r.genre] || '#666';

    html += `<div class="verse-card" data-genre="${r.genre}">
  <div class="verse-ref">${r.ref}<span class="verse-genre" style="background:${color}">${r.genre}</span></div>
  <div class="verse-note">${r.note}</div>
  <div class="verse-text"><span class="verse-label">KJV: </span><span class="kjv-text">${r.kjv}</span></div>
  <div class="verse-text"><span class="verse-label">CT: </span><span class="${ctClass}">${r.ct}</span></div>
</div>\n`;
  }

  html += `
<script>
function filterGenre(genre) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('.verse-card, .genre-header').forEach(el => {
    if (genre === 'all' || el.dataset.genre === genre) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });
}
</script>
</body>
</html>`;

  return html;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  let genreFilter: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--genre' && args[i + 1]) {
      genreFilter = args[i + 1];
      i++;
    }
  }

  console.log('  Fetching key verses from Supabase...\n');

  const results = await fetchVerses();

  // Save HTML
  const htmlPath = path.join(process.cwd(), 'data', 'translations', 'ct-review.html');
  const dir = path.dirname(htmlPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(htmlPath, generateHTML(results));

  // Print to terminal
  printTerminal(results, genreFilter);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
