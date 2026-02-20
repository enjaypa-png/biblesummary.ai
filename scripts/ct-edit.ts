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
  // ─── Exodus 21–40 CT Audit Corrections (Feb 2026) ───────────────────────
  {
    ref: 'Exodus 25:5',
    book_slug: 'exodus',
    chapter: 25,
    verse: 5,
    reason: 'Audit: "fine leather" is too generic for Hebrew tahaš — "durable leather" is more precise',
    ct: 'ram skins dyed red, durable leather, and acacia wood,'
  },
  {
    ref: 'Exodus 32:25',
    book_slug: 'exodus',
    chapter: 32,
    verse: 25,
    reason: 'Audit: improve nuance — "running wild" and "disgrace" better reflect the public shame of Hebrew pāraʿ',
    ct: 'Moses saw that the people were running wild — Aaron had let them get out of control, making them a disgrace to their enemies.'
  },
  {
    ref: 'Exodus 34:28',
    book_slug: 'exodus',
    chapter: 34,
    verse: 28,
    reason: 'Audit (accuracy): Exodus 34:1 makes clear God wrote the tablets, not Moses — CT must clarify the subject',
    ct: 'Moses was there with the LORD for 40 days and 40 nights, and during that time he did not eat bread or drink water. Then the LORD wrote the words of the covenant — the 10 commandments — on the tablets.'
  },
  {
    ref: 'Exodus 38:8',
    book_slug: 'exodus',
    chapter: 38,
    verse: 8,
    reason: 'Audit: "contributed" flows more naturally than "donated" in this context',
    ct: 'He made the bronze basin and its bronze stand from the mirrors contributed by the women who served at the entrance of the tent of meeting.'
  },
  {
    ref: 'Exodus 39:34',
    book_slug: 'exodus',
    chapter: 39,
    verse: 34,
    reason: 'Audit: consistency with Exodus 25:5 — "fine leather" → "durable leather" for tahaš',
    ct: 'the covering of ram skins dyed red, the covering of durable leather, and the inner curtain;'
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
        console.log(`     ✅ Updated`);
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
