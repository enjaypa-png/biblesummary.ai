/**
 * Normalize "the rest of the acts of ..." formulas in CT.
 *
 * Typical CT pattern (very close to KJV):
 *   "The rest of all the acts of Asa, and all his might, and all that he did, ... are they not written in the book of the chronicles..."
 *
 * New pattern:
 *   "The rest of what Asa did—his might, everything he did, and the cities he built—are written in the book of the chronicles..."
 *
 * We keep the same information, but:
 *   - change "acts" → "what [name] did"
 *   - change "are they not written" → "are written"
 *
 * Usage:
 *   npm run ct:rest-of-acts              # apply changes
 *   npm run ct:rest-of-acts -- --dry-run # preview only
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

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

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CT "Rest of the Acts" Normalizer');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (dryRun) console.log('  Mode: DRY RUN (no database changes)\n');

  const { data: verses, error } = await supabase
    .from('verses')
    .select('id, book_id, chapter, verse, text')
    .eq('translation', 'ct')
    .ilike('text', 'the rest of%acts of%');

  if (error) {
    console.error('❌ Failed to load CT verses:', error.message);
    process.exit(1);
  }

  if (!verses || verses.length === 0) {
    console.log('  No CT verses matched the pattern.');
    return;
  }

  const { data: books } = await supabase.from('books').select('id, name');

  let touched = 0;
  for (const v of verses) {
    const original = v.text as string;
    let updated = original;

    // 1) "The rest of (all the) acts of X" → "The rest of what X did"
    updated = updated.replace(
      /The rest of (all the |all )?acts of ([^,?]+)(?=[,?])/i,
      (_match, _allPart, namePart) => `The rest of what ${namePart.trim()} did`
    );

    // 2) "are they not written in the book of the chronicles of" → "are written in the book of the chronicles of"
    updated = updated.replace(
      /are they not written in the book of the chronicles of/gi,
      'are written in the book of the chronicles of'
    );

    if (updated === original) continue;

    touched++;
    const book = books?.find((b) => b.id === v.book_id);
    console.log(`\n  📖 ${book?.name ?? 'Book'} ${v.chapter}:${v.verse}`);
    console.log(`     Before: ${original}`);
    console.log(`     After:  ${updated}`);

    if (!dryRun) {
      const { error: updateError } = await supabase
        .from('verses')
        .update({ text: updated })
        .eq('id', v.id);
      if (updateError) {
        console.error(`     ❌ Failed to update: ${updateError.message}`);
      } else {
        console.log('     ✅ Updated');
      }
    } else {
      console.log('     🏜️ Would update (dry run)');
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ${dryRun ? 'Would update' : 'Updated'} ${touched} verse(s) using this formula`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});

