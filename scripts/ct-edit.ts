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
  // ─── Audit #2: Exodus 1–10 CT Corrections (Feb 2026) ──────────────────────
  {
    ref: 'Exodus 1:22',
    book_slug: 'exodus',
    chapter: 1,
    verse: 22,
    reason: 'Audit (completeness): CT adds "Hebrew" which is not in the KJV — removes scope change',
    ct: 'Then Pharaoh issued a command to all his people: "Throw every newborn boy into the Nile River, but let every girl live."'
  },
  {
    ref: 'Exodus 2:9',
    book_slug: 'exodus',
    chapter: 2,
    verse: 9,
    reason: 'Audit (accuracy): "her child" implies ownership not present in KJV — should be "the child"',
    ct: 'Pharaoh\'s daughter said to her, "Take this child and nurse him for me, and I\'ll pay you for it." So the woman took the child and nursed him.'
  },
  {
    ref: 'Exodus 2:25',
    book_slug: 'exodus',
    chapter: 2,
    verse: 25,
    reason: 'Audit (completeness): "of their suffering" is not in the KJV — KJV says "God had respect unto them"',
    ct: 'God looked on the Israelites, and God acknowledged them.'
  },
  {
    ref: 'Exodus 3:19',
    book_slug: 'exodus',
    chapter: 3,
    verse: 19,
    reason: 'Audit (accuracy): "unless" changes meaning — KJV says "no, not by a mighty hand"',
    ct: '"But I know that the king of Egypt will not let you go, no, not even by a mighty hand."'
  },
  {
    ref: 'Exodus 4:13',
    book_slug: 'exodus',
    chapter: 4,
    verse: 13,
    reason: 'Audit (completeness): CT omits "by the hand of him whom thou wilt send" — changes intent',
    ct: 'But Moses said, "Please, Lord — send by the hand of whoever you will send."'
  },
  {
    ref: 'Exodus 4:18',
    book_slug: 'exodus',
    chapter: 4,
    verse: 18,
    reason: 'Audit (accuracy): "Go with my blessing" adds content not in KJV — KJV says "Go in peace"',
    ct: 'Moses went back to his father-in-law Jethro and said, "Please let me return to my people in Egypt to see if any of them are still alive." Jethro told Moses, "Go in peace."'
  },
  {
    ref: 'Exodus 4:26',
    book_slug: 'exodus',
    chapter: 4,
    verse: 26,
    reason: 'Audit (accuracy): CT changes subject from "he" to "the LORD" — KJV does not specify the LORD',
    ct: 'So he let him go. She had said "husband of blood" because of the circumcision.'
  },
  {
    ref: 'Exodus 5:9',
    book_slug: 'exodus',
    chapter: 5,
    verse: 9,
    reason: 'Audit (accuracy): "lies" is too strong — KJV says "vain words"',
    ct: '"Make the work harder on these men so they stay busy and stop paying attention to empty words."'
  },
  {
    ref: 'Exodus 5:12',
    book_slug: 'exodus',
    chapter: 5,
    verse: 12,
    reason: 'Audit (accuracy): "to use as straw" implies substitution — KJV says "instead of straw"',
    ct: 'So the people spread out across all of Egypt to gather stubble instead of straw.'
  },
  {
    ref: 'Exodus 6:3',
    book_slug: 'exodus',
    chapter: 6,
    verse: 3,
    reason: 'Audit (accuracy): KJV specifically uses "JEHOVAH" — CT must preserve the specific name',
    ct: 'I revealed myself to Abraham, Isaac, and Jacob as God Almighty, but by my name JEHOVAH I was not known to them.'
  },
  {
    ref: 'Exodus 6:12',
    book_slug: 'exodus',
    chapter: 6,
    verse: 12,
    reason: 'Audit (accuracy): "I\'m a terrible speaker" adds interpretation — KJV says "uncircumcised lips"',
    ct: 'But Moses protested to the LORD, "Look, the Israelites wouldn\'t even listen to me. Why would Pharaoh listen to me? I am a man of uncircumcised lips."'
  },
  {
    ref: 'Exodus 8:16',
    book_slug: 'exodus',
    chapter: 8,
    verse: 16,
    reason: 'Audit (accuracy): "gnats" should be "lice" to match KJV',
    ct: 'The LORD told Moses, "Tell Aaron to extend his staff and strike the dust on the ground, so that it turns into lice throughout all of Egypt."'
  },
  {
    ref: 'Exodus 8:17',
    book_slug: 'exodus',
    chapter: 8,
    verse: 17,
    reason: 'Audit (accuracy): "gnats" should be "lice" to match KJV',
    ct: 'They did this — Aaron extended his hand with his staff and struck the dust on the ground, and lice appeared on people and animals. All the dust across Egypt turned into lice.'
  },
  {
    ref: 'Exodus 8:22',
    book_slug: 'exodus',
    chapter: 8,
    verse: 22,
    reason: 'Audit (accuracy): "at work in this land" changes KJV\'s "in the midst of the earth"',
    ct: '"But on that day I will treat the region of Goshen differently — where my people live — so that no swarms of flies will be there. This way you will know that I am the LORD in the midst of the earth."'
  },
  {
    ref: 'Exodus 8:26',
    book_slug: 'exodus',
    chapter: 8,
    verse: 26,
    reason: 'Audit (accuracy): "sacred" changes meaning — KJV says "abomination of the Egyptians"',
    ct: 'Moses replied, "That wouldn\'t be right, because the animals we sacrifice to the LORD our God are an abomination to the Egyptians. If we sacrifice what is an abomination to the Egyptians right in front of them, won\'t they stone us?'
  },
  {
    ref: 'Exodus 9:32',
    book_slug: 'exodus',
    chapter: 9,
    verse: 32,
    reason: 'Audit (accuracy): "mature later in the season" adds content — KJV says "they were not grown up"',
    ct: 'But the wheat and the spelt were not destroyed because they had not yet grown up.'
  },
  {
    ref: 'Exodus 10:10',
    book_slug: 'exodus',
    chapter: 10,
    verse: 10,
    reason: 'Audit (accuracy): "evil plan" adds interpretation — KJV says "look to it; for evil is before you"',
    ct: 'Pharaoh said to them, "The LORD had better be with you if I ever let you and your little ones go! Look to it, for evil is before you."'
  },
  // ─── Audit #3: Leviticus 1–10 CT Corrections (Feb 2026) ───────────────────
  {
    ref: 'Leviticus 2:12',
    book_slug: 'leviticus',
    chapter: 2,
    verse: 12,
    reason: 'Audit (completeness): CT adds "yeast and honey" not present in KJV — KJV says "the oblation of the firstfruits"',
    ct: 'You may present them to the LORD as a firstfruits offering, but they must not be burned on the altar as a pleasing aroma.'
  },
  {
    ref: 'Leviticus 4:26',
    book_slug: 'leviticus',
    chapter: 4,
    verse: 26,
    reason: 'Audit (accuracy): "the leader\'s sin" adds specificity — KJV says "his sin"',
    ct: 'He must burn all the fat on the altar, just like the fat from peace offerings. In this way the priest will make atonement for him concerning his sin, and he will be forgiven.'
  },
  {
    ref: 'Leviticus 7:14',
    book_slug: 'leviticus',
    chapter: 7,
    verse: 14,
    reason: 'Audit (completeness): CT omits "heave offering" and "whole oblation" — must preserve KJV terms',
    ct: 'From the whole offering, he must set aside one portion as a heave offering to the LORD. It will belong to the priest who splashes the blood of the peace offering.'
  },
  {
    ref: 'Leviticus 7:29',
    book_slug: 'leviticus',
    chapter: 7,
    verse: 29,
    reason: 'Audit (accuracy): CT omits the requirement to bring from the sacrifice itself',
    ct: '"Tell the Israelites: Anyone who brings a peace offering to the LORD must personally bring his offering to the LORD from the sacrifice of his peace offerings.'
  },
  {
    ref: 'Leviticus 7:32',
    book_slug: 'leviticus',
    chapter: 7,
    verse: 32,
    reason: 'Audit (accuracy): "contribution" should be "heave offering" and "thigh" should be "shoulder" per KJV',
    ct: 'You must also give the right shoulder to the priest as a heave offering from your peace offerings.'
  },
  {
    ref: 'Leviticus 7:33',
    book_slug: 'leviticus',
    chapter: 7,
    verse: 33,
    reason: 'Audit (accuracy): "right thigh" should be "right shoulder" per KJV',
    ct: 'The son of Aaron who splashes the blood and presents the fat of the peace offering gets the right shoulder as his portion.'
  },
  {
    ref: 'Leviticus 8:25',
    book_slug: 'leviticus',
    chapter: 8,
    verse: 25,
    reason: 'Audit (accuracy): "right thigh" should be "right shoulder" per KJV',
    ct: 'He took the fat, the fat tail, all the fat covering the internal organs, the lobe of the liver, the 2 kidneys with their fat, and the right shoulder.'
  },
  {
    ref: 'Leviticus 8:26',
    book_slug: 'leviticus',
    chapter: 8,
    verse: 26,
    reason: 'Audit (accuracy): "right thigh" should be "right shoulder" per KJV',
    ct: 'From the basket of unleavened bread that was in the LORD\'s presence, he took one unleavened cake, one cake of bread made with oil, and one wafer, and placed them on top of the fat portions and the right shoulder.'
  },
  {
    ref: 'Leviticus 9:24',
    book_slug: 'leviticus',
    chapter: 9,
    verse: 24,
    reason: 'Audit (accuracy): "shouts of praise" adds interpretation — KJV simply says "they shouted"',
    ct: 'Fire blazed out from the LORD\'s presence and consumed the burnt offering and the fat on the altar. When all the people witnessed this, they shouted and dropped to the ground with their faces down.'
  },
  {
    ref: 'Leviticus 10:20',
    book_slug: 'leviticus',
    chapter: 10,
    verse: 20,
    reason: 'Audit (completeness): "explanation" adds content — KJV says "when Moses heard that, he was content"',
    ct: 'When Moses heard this, he was satisfied.'
  },
  // ─── Audit #4: Leviticus 11–13 CT Corrections (Feb 2026) ──────────────────
  // 14 of 17 findings applied. Items 3 (11:15), 5 (11:17), and 10 (11:23)
  // were rejected: 3 & 5 are standard modernizations ("every type of" = "after
  // his kind", dropping initial "And"); 10 asks the CT to add scientific
  // clarification not present in the KJV, violating audit principles.
  {
    ref: 'Leviticus 11:13',
    book_slug: 'leviticus',
    chapter: 11,
    verse: 13,
    reason: 'Audit (accuracy): "black vulture" should be "osprey" — KJV says "ospray"',
    ct: 'Among the birds, these are the ones you must consider disgusting and must not eat: the eagle, the bearded vulture, and the osprey,'
  },
  {
    ref: 'Leviticus 11:14',
    book_slug: 'leviticus',
    chapter: 11,
    verse: 14,
    reason: 'Audit (accuracy): "red kite" and "black kite" are not in the KJV — KJV says "the vulture, and the kite after his kind"',
    ct: 'the vulture, and every type of kite,'
  },
  {
    ref: 'Leviticus 11:16',
    book_slug: 'leviticus',
    chapter: 11,
    verse: 16,
    reason: 'Audit (accuracy): "seagull" should be "cuckoo" — KJV says "cuckow"',
    ct: 'the horned owl, the nighthawk, the cuckoo, and every type of hawk,'
  },
  {
    ref: 'Leviticus 11:18',
    book_slug: 'leviticus',
    chapter: 11,
    verse: 18,
    reason: 'Audit (accuracy): CT uses different animal names — KJV says "the swan, and the pelican, and the gier eagle"',
    ct: 'the swan, the pelican, and the gier eagle,'
  },
  {
    ref: 'Leviticus 11:19',
    book_slug: 'leviticus',
    chapter: 11,
    verse: 19,
    reason: 'Audit (accuracy): "hoopoe" should be "lapwing" — KJV says "lapwing"',
    ct: 'the stork, every type of heron, the lapwing, and the bat.'
  },
  {
    ref: 'Leviticus 11:20',
    book_slug: 'leviticus',
    chapter: 11,
    verse: 20,
    reason: 'Audit (accuracy): "winged insects" should be "fowls" — KJV says "fowls that creep"',
    ct: 'All fowls that walk on 4 legs must be considered disgusting to you.'
  },
  {
    ref: 'Leviticus 11:22',
    book_slug: 'leviticus',
    chapter: 11,
    verse: 22,
    reason: 'Audit (accuracy): "cricket" should be "beetle" — KJV says "beetle"',
    ct: 'Specifically, you may eat these: every type of locust, every type of bald locust, every type of beetle, and every type of grasshopper.'
  },
  {
    ref: 'Leviticus 11:29',
    book_slug: 'leviticus',
    chapter: 11,
    verse: 29,
    reason: 'Audit (accuracy): "every type of large lizard" should be "tortoise" — KJV says "tortoise after his kind"',
    ct: 'Among the small creatures that move along the ground, these are unclean for you: the weasel, the mouse, and every type of tortoise,'
  },
  {
    ref: 'Leviticus 11:30',
    book_slug: 'leviticus',
    chapter: 11,
    verse: 30,
    reason: 'Audit (accuracy): CT uses different animal names — KJV says "the ferret, and the chameleon, and the lizard, and the snail, and the mole"',
    ct: 'the ferret, the chameleon, the lizard, the snail, and the mole.'
  },
  {
    ref: 'Leviticus 11:36',
    book_slug: 'leviticus',
    chapter: 11,
    verse: 36,
    reason: 'Audit (accuracy): "anyone who touches" narrows KJV\'s "that which toucheth" — should be "whatever touches"',
    ct: 'A spring or a cistern that collects water will still be clean, but whatever touches their carcass becomes unclean.'
  },
  {
    ref: 'Leviticus 11:41',
    book_slug: 'leviticus',
    chapter: 11,
    verse: 41,
    reason: 'Audit (accuracy): "disgusting" should be "abomination" — KJV says "shall be an abomination"',
    ct: 'Every creature that crawls along the ground is an abomination and must not be eaten.'
  },
  {
    ref: 'Leviticus 11:42',
    book_slug: 'leviticus',
    chapter: 11,
    verse: 42,
    reason: 'Audit (accuracy): "disgusting" should be "abomination" — KJV says "they are an abomination"',
    ct: 'Whether it slithers on its belly, walks on 4 legs, or has many legs — no creature that crawls on the ground may be eaten, because they are all an abomination.'
  },
  {
    ref: 'Leviticus 11:43',
    book_slug: 'leviticus',
    chapter: 11,
    verse: 43,
    reason: 'Audit (completeness): CT adds "by eating" which is not in KJV — narrows the meaning of the command',
    ct: 'Do not make yourselves repulsive with any crawling creature. Do not contaminate yourselves with them or become defiled through them.'
  },
  {
    ref: 'Leviticus 13:23',
    book_slug: 'leviticus',
    chapter: 13,
    verse: 23,
    reason: 'Audit (accuracy): "a scar from the boil" changes diagnosis — KJV says "it is a burning boil"',
    ct: 'But if the shiny spot remains in place and does not spread, it is a burning boil, and the priest must declare the person clean.'
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
