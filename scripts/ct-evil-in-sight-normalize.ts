/**
 * Normalize the "did evil in the sight of the LORD" formula in CT.
 *
 * Target pattern (CT side):
 *   "did evil in the sight of the LORD"
 *
 * New pattern:
 *   "did what the LORD saw as evil"
 *
 * This keeps the same theological meaning (God judging actions as evil)
 * but reads more like normal modern English.
 *
 * Usage:
 *   npm run ct:evil:normalize              # apply changes
 *   npm run ct:evil:normalize -- --dry-run # preview only
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
  console.log('  CT "Did Evil in the Sight of the LORD" Normalizer');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (dryRun) console.log('  Mode: DRY RUN (no database changes)\n');

  // Find all CT verses anywhere in the Bible that use this exact KJV-style formula.
  const { data: verses, error } = await supabase
    .from('verses')
    .select('id, book_id, chapter, verse, text')
    .eq('translation', 'ct')
    .ilike('text', '%did evil in the sight of the lord%');

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
    const updated = original.replace(
      /did evil in the sight of the LORD/gi,
      'did what the LORD saw as evil'
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

