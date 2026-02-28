/**
 * Normalize king introduction formulas in 1–2 Kings CT text.
 *
 * Target pattern (CT side):
 *   "began to reign over ... and he reigned N years"
 *
 * New pattern:
 *   "became king over ... and ruled N years"
 *
 * This keeps all facts the same (who, where, how long) but reads
 * more like normal modern English.
 *
 * Usage:
 *   npm run ct:kings:intros              # apply changes
 *   npm run ct:kings:intros -- --dry-run # preview only
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
  console.log('  CT Kings Intros Normalizer');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (dryRun) console.log('  Mode: DRY RUN (no database changes)\n');

  // Fetch 1–2 Kings ids
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('id, slug, name')
    .in('slug', ['1-kings', '2-kings']);

  if (booksError || !books?.length) {
    console.error('❌ Could not load 1–2 Kings from books table');
    process.exit(1);
  }

  const bookIds = books.map((b) => b.id);

  // Find CT verses in those books whose text uses the "began to reign" formula.
  // We deliberately limit this to verses that contain BOTH phrases so we only
  // touch the stock intro pattern, not every use of "reigned".
  const { data: verses, error: versesError } = await supabase
    .from('verses')
    .select('id, book_id, chapter, verse, text')
    .in('book_id', bookIds)
    .eq('translation', 'ct')
    .ilike('text', '%began to reign%');

  if (versesError) {
    console.error('❌ Failed to load CT verses:', versesError.message);
    process.exit(1);
  }

  if (!verses || verses.length === 0) {
    console.log('  No CT verses in Kings matched the pattern.');
    return;
  }

  let touched = 0;
  for (const v of verses) {
    const original = v.text as string;
    if (!original.includes('began to reign')) continue;

    // Only adjust verses that also talk about length of rule; this keeps us
    // focused on intros like 2 Kings 13:1.
    if (!/reigned\s+\w+/i.test(original)) continue;

    const updated = original
      .replace('began to reign over', 'became king over')
      .replace('began to reign', 'became king')
      .replace(/reigned(\s+\w+)/gi, 'ruled$1');

    if (updated === original) continue;

    touched++;
    const book = books.find((b) => b.id === v.book_id);
    console.log(`\n  📖 ${book?.name} ${v.chapter}:${v.verse}`);
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
  console.log(`  ${dryRun ? 'Would update' : 'Updated'} ${touched} verse(s) in 1–2 Kings`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});

