/**
 * CT Verse Editor — Fix individual verses directly in Supabase
 *
 * Usage:
 *   npm run ct:edit                           # Interactive mode — apply all fixes in FIXES list
 *   npm run ct:edit -- --dry-run              # Preview changes without writing
 *   npm run ct:edit -- --ref "John 3:16"      # Show current CT for a specific verse
 *
 * To add fixes: edit the FIXES array below, then run the script.
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

// ─── FIXES ───────────────────────────────────────────────────────────────────
// Add verse corrections here. Each entry specifies the verse reference
// and the corrected CT text. Run `npm run ct:edit` to apply them all.
//
// To find what a verse currently says:
//   npm run ct:edit -- --ref "Genesis 1:31"

interface VerseFix {
  ref: string;        // e.g., "Genesis 1:31"
  book_slug: string;
  chapter: number;
  verse: number;
  reason: string;     // Why this fix is needed
  ct: string;         // The corrected CT text
}

const FIXES: VerseFix[] = [
  {
    ref: 'Genesis 1:31',
    book_slug: 'genesis',
    chapter: 1,
    verse: 31,
    reason: 'Protected term: "made" not "produced"',
    ct: 'God looked at everything he had made, and it was very good. Evening came, and then morning came — the sixth day.'
  },
  {
    ref: 'John 1:1',
    book_slug: 'john',
    chapter: 1,
    verse: 1,
    reason: 'Iconic opening — keep "In the beginning" structure',
    ct: 'In the beginning was the Word, and the Word was with God, and the Word was God.'
  },
  {
    ref: 'Philippians 4:13',
    book_slug: 'philippians',
    chapter: 4,
    verse: 13,
    reason: '"handle" is weak — "do" is stronger and more faithful',
    ct: 'I can do all things through Christ who gives me strength.'
  },
  {
    ref: 'John 15:13',
    book_slug: 'john',
    chapter: 15,
    verse: 13,
    reason: 'Tighten wording — more natural and powerful',
    ct: '"No one has greater love than this: to lay down one\'s life for one\'s friends."'
  },
  {
    ref: 'Psalm 1:1',
    book_slug: 'psalms',
    chapter: 1,
    verse: 1,
    reason: '"Blessed" carries theological weight that "happy" lacks',
    ct: 'Blessed is the one who does not follow the advice of the wicked, who does not join in with sinners, and who does not take a seat among those who mock.'
  },
  {
    ref: 'Proverbs 31:10',
    book_slug: 'proverbs',
    chapter: 31,
    verse: 10,
    reason: '"find" is more natural than "discover"',
    ct: 'A woman of noble character — who can find one? Her worth is far above rubies.'
  },
  // ─── CT Audit fixes (2026-02-20) ────────────────────────────────────────
  {
    ref: 'Isaiah 53:3',
    book_slug: 'isaiah',
    chapter: 53,
    verse: 3,
    reason: 'Audit: "turned away in disgust" adds interpretation not present in KJV',
    ct: 'He was looked down on and turned away by people — a man defined by suffering, deeply familiar with pain. We turned our faces away from him; he was despised, and we considered him worthless.'
  },
  {
    ref: 'Proverbs 31:30',
    book_slug: 'proverbs',
    chapter: 31,
    verse: 30,
    reason: 'Audit: "wholeheartedly dedicated" adds interpretation not in KJV "feareth the LORD"',
    ct: 'Charm can be misleading, and beauty fades away, but a woman who fears the LORD — she will be praised.'
  },
  {
    ref: '1 Samuel 17:45',
    book_slug: '1-samuel',
    chapter: 17,
    verse: 45,
    reason: 'Audit: "javelin" should be "shield" to match KJV',
    ct: 'David answered the Philistine, "You come at me with a sword, a spear, and a shield, but I come at you in the name of the LORD of Armies, the God of Israel\'s forces — the one you have mocked."'
  },
  {
    ref: '2 Kings 5:13',
    book_slug: '2-kings',
    chapter: 5,
    verse: 13,
    reason: 'Audit: "be clean" changed to "be healed" — should match KJV wording',
    ct: 'But his servants approached him and said, "Sir, if the prophet had told you to do something difficult, wouldn\'t you have done it? How much easier is it when he simply tells you, \'Wash, and be clean\'?"'
  },
  // ─── Exodus 11–20 Audit fixes (2026-02-20) ────────────────────────────────
  {
    ref: 'Exodus 12:41',
    book_slug: 'exodus',
    chapter: 12,
    verse: 41,
    reason: 'Audit: "hosts of the LORD" conveys organized army, not just "people"',
    ct: 'At the end of exactly 430 years, on that very same day, all the armies of the LORD marched out of the land of Egypt.'
  },
  {
    ref: 'Exodus 12:51',
    book_slug: 'exodus',
    chapter: 12,
    verse: 51,
    reason: 'Audit: "organized by their tribal divisions" is interpretation — KJV says "by their armies"',
    ct: 'On that very day, the LORD brought the Israelites out of the land of Egypt according to their armies.'
  },
  {
    ref: 'Exodus 15:2',
    book_slug: 'exodus',
    chapter: 15,
    verse: 2,
    reason: 'Audit: "build a dwelling place" is clunky — "praise him" captures the intent more naturally',
    ct: 'The LORD is my strength and my song, and he has become my salvation. He is my God, and I will praise him; he is the God of my father, and I will lift him up in praise.'
  },
  {
    ref: 'Exodus 18:21',
    book_slug: 'exodus',
    chapter: 18,
    verse: 21,
    reason: 'Audit: "wholeheartedly dedicated to God" is interpretive — "God-fearing" is direct and well understood',
    ct: 'Beyond that, select capable people from among all the Israelites \u2014 God-fearing people who are trustworthy and who despise dishonest profit. Appoint them as leaders over groups of 1,000, 100, 50, and 10.'
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getBookId(slug: string): Promise<number | null> {
  const { data } = await supabase
    .from('books')
    .select('id')
    .eq('slug', slug)
    .single();
  return data?.id || null;
}

async function getCurrentCT(bookId: number, chapter: number, verse: number): Promise<string | null> {
  const { data } = await supabase
    .from('verses')
    .select('text')
    .eq('book_id', bookId)
    .eq('chapter', chapter)
    .eq('verse', verse)
    .eq('translation', 'ct')
    .single();
  return data?.text || null;
}

async function updateCT(bookId: number, chapter: number, verse: number, newText: string): Promise<boolean> {
  const { error } = await supabase
    .from('verses')
    .update({ text: newText })
    .eq('book_id', bookId)
    .eq('chapter', chapter)
    .eq('verse', verse)
    .eq('translation', 'ct');
  return !error;
}

/**
 * Sync a fix to the local JSON file (data/translations/ct/{book}/{chapter}.json)
 * so that ct:seed doesn't overwrite the database fix later.
 */
function syncLocalJson(bookSlug: string, chapter: number, verse: number, newText: string): boolean {
  const CT_DIR = path.join(process.cwd(), 'data', 'translations', 'ct');
  const filePath = path.join(CT_DIR, bookSlug, `${chapter}.json`);

  if (!fs.existsSync(filePath)) {
    return false; // No local file — nothing to sync
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const verseObj = data.verses?.find((v: { verse: number }) => v.verse === verse);
    if (verseObj) {
      verseObj.ct = newText;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ─── Lookup mode ─────────────────────────────────────────────────────────────

async function lookupVerse(ref: string) {
  // Parse "Genesis 1:31" → book_slug, chapter, verse
  const match = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) {
    console.error(`❌ Invalid reference format: "${ref}". Use "Book Chapter:Verse" (e.g., "Genesis 1:31")`);
    return;
  }

  const bookName = match[1];
  const chapter = parseInt(match[2]);
  const verse = parseInt(match[3]);

  // Find book by name
  const { data: books } = await supabase
    .from('books')
    .select('id, slug, name')
    .ilike('name', bookName);

  if (!books || books.length === 0) {
    console.error(`❌ Book not found: "${bookName}"`);
    return;
  }

  const book = books[0];

  // Get KJV
  const { data: kjvRow } = await supabase
    .from('verses')
    .select('text')
    .eq('book_id', book.id)
    .eq('chapter', chapter)
    .eq('verse', verse)
    .eq('translation', 'kjv')
    .single();

  // Get CT
  const { data: ctRow } = await supabase
    .from('verses')
    .select('text')
    .eq('book_id', book.id)
    .eq('chapter', chapter)
    .eq('verse', verse)
    .eq('translation', 'ct')
    .single();

  console.log(`\n  📖 ${book.name} ${chapter}:${verse} (slug: ${book.slug})\n`);
  console.log(`  KJV: ${kjvRow?.text || '[NOT FOUND]'}`);
  console.log(`  CT:  ${ctRow?.text || '[NOT FOUND]'}`);
  console.log('');
}

// ─── Apply fixes ─────────────────────────────────────────────────────────────

async function applyFixes(dryRun: boolean) {
  if (FIXES.length === 0) {
    console.log('  No fixes defined. Edit the FIXES array in ct-edit.ts to add corrections.');
    return;
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  CT Verse Editor — ${FIXES.length} fixes`);
  if (dryRun) console.log(`  🏜️  DRY RUN — no changes will be written`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  let applied = 0;
  let skipped = 0;
  let errors = 0;

  for (const fix of FIXES) {
    const bookId = await getBookId(fix.book_slug);
    if (!bookId) {
      console.log(`  ❌ ${fix.ref}: Book "${fix.book_slug}" not found`);
      errors++;
      continue;
    }

    const currentCT = await getCurrentCT(bookId, fix.chapter, fix.verse);

    if (!currentCT) {
      console.log(`  ❌ ${fix.ref}: No CT verse found in database`);
      errors++;
      continue;
    }

    if (currentCT === fix.ct) {
      console.log(`  ⏭️  ${fix.ref}: Already correct`);
      skipped++;
      continue;
    }

    console.log(`  📖 ${fix.ref}`);
    console.log(`     Reason: ${fix.reason}`);
    console.log(`     Before: ${currentCT}`);
    console.log(`     After:  ${fix.ct}`);

    if (!dryRun) {
      const success = await updateCT(bookId, fix.chapter, fix.verse, fix.ct);
      if (success) {
        const synced = syncLocalJson(fix.book_slug, fix.chapter, fix.verse, fix.ct);
        console.log(`     ✅ Updated${synced ? ' (+ local JSON synced)' : ''}`);
        applied++;
      } else {
        console.log(`     ❌ Failed to update`);
        errors++;
      }
    } else {
      console.log(`     🏜️  Would update (dry run)`);
      applied++;
    }
    console.log('');
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  ${dryRun ? 'Would apply' : 'Applied'}: ${applied} | Skipped: ${skipped} | Errors: ${errors}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  let dryRun = false;
  let ref: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--ref' && args[i + 1]) {
      ref = args[i + 1];
      i++;
    }
  }

  if (ref) {
    await lookupVerse(ref);
  } else {
    await applyFixes(dryRun);
  }
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
