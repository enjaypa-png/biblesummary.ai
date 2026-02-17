/**
 * Submit Clear Translation (CT) as a Batch Job (50% cost savings)
 *
 * This script builds all remaining chapter requests and submits them
 * to the Anthropic Message Batches API for asynchronous processing.
 * Results are typically ready within 1 hour.
 *
 * Usage:
 *   npm run ct:batch:submit                  # Submit all remaining chapters
 *   npm run ct:batch:submit -- --book genesis # Submit one book only
 *   npm run ct:batch:submit -- --force        # Resubmit even if output exists
 *
 * After submitting:
 *   npm run ct:batch:status                   # Check if batch is done
 *   npm run ct:batch:download                 # Download results when ready
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { CT_SYSTEM_PROMPT, buildUserPrompt } from './ct-translation/prompt';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase env vars');
  process.exit(1);
}
if (!anthropicApiKey) {
  console.error('❌ Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const anthropic = new Anthropic({ apiKey: anthropicApiKey });

const MODEL = 'claude-opus-4-6';
const MAX_TOKENS = 8192;
const TEMPERATURE = 0.7;
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'translations', 'ct');
const BATCH_DIR = path.join(process.cwd(), 'data', 'translations', 'ct-batch');

// ─── CLI Args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let book: string | null = null;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--book' && args[i + 1]) {
      book = args[i + 1];
      i++;
    } else if (args[i] === '--force') {
      force = true;
    }
  }

  return { book, force };
}

function chapterExists(bookSlug: string, chapter: number): boolean {
  return fs.existsSync(path.join(OUTPUT_DIR, bookSlug, `${chapter}.json`));
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { book: bookFilter, force } = parseArgs();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CT Batch Submit (50% cost savings)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Model: ${MODEL}`);
  if (bookFilter) console.log(`  Book filter: ${bookFilter}`);
  if (force) console.log(`  Force: yes`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Fetch books
  let query = supabase.from('books').select('*').order('order_index');
  if (bookFilter) query = query.eq('slug', bookFilter);

  const { data: books, error } = await query;
  if (error || !books || books.length === 0) {
    console.error('❌ No books found');
    process.exit(1);
  }

  // Build batch requests
  const requests: any[] = [];
  let skipped = 0;

  for (const book of books) {
    for (let chapter = 1; chapter <= book.total_chapters; chapter++) {
      // Skip already-generated chapters unless --force
      if (!force && chapterExists(book.slug, chapter)) {
        skipped++;
        continue;
      }

      // Fetch KJV verses
      const { data: verses, error: vError } = await supabase
        .from('verses')
        .select('verse, text')
        .eq('book_id', book.id)
        .eq('chapter', chapter)
        .order('verse');

      if (vError || !verses || verses.length === 0) {
        console.warn(`   ⚠️  No verses for ${book.name} ${chapter}, skipping`);
        continue;
      }

      const userPrompt = buildUserPrompt(book.name, chapter, verses);

      // custom_id format: "genesis_1" — we'll parse this when downloading results
      const customId = `${book.slug}_${chapter}`;

      requests.push({
        custom_id: customId,
        params: {
          model: MODEL,
          max_tokens: MAX_TOKENS,
          temperature: TEMPERATURE,
          system: CT_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }]
        }
      });
    }

    console.log(`   📖 ${book.name}: ${book.total_chapters} chapters queued`);
  }

  console.log(`\n   Total requests: ${requests.length}`);
  console.log(`   Skipped (already exist): ${skipped}`);

  if (requests.length === 0) {
    console.log('\n   Nothing to submit! All chapters already generated.');
    console.log('   Use --force to regenerate.');
    return;
  }

  // Estimate cost (50% off Opus pricing)
  // Rough: ~2500 tokens per chapter (input+output), Opus output is $75/M, with 50% = $37.50/M
  const estimatedCost = (requests.length * 2500 * 37.5) / 1_000_000;
  console.log(`   Estimated cost: ~$${estimatedCost.toFixed(0)}-${(estimatedCost * 1.5).toFixed(0)} (50% batch discount applied)`);

  console.log('\n   Submitting batch...');

  // Submit batch
  const batch = await anthropic.messages.batches.create({
    requests: requests
  });

  console.log(`\n   ✅ Batch submitted!`);
  console.log(`   Batch ID: ${batch.id}`);
  console.log(`   Status: ${batch.processing_status}`);

  // Save batch ID for status checking and downloading
  if (!fs.existsSync(BATCH_DIR)) fs.mkdirSync(BATCH_DIR, { recursive: true });

  const batchInfo = {
    batch_id: batch.id,
    submitted_at: new Date().toISOString(),
    total_requests: requests.length,
    skipped_existing: skipped,
    book_filter: bookFilter || 'all',
    // Save the custom_id → book/chapter mapping for download script
    chapter_map: requests.map(r => {
      const [slug, ch] = r.custom_id.split('_');
      const book = books.find(b => b.slug === slug);
      return {
        custom_id: r.custom_id,
        book_slug: slug,
        book_name: book?.name || slug,
        chapter: parseInt(ch)
      };
    })
  };

  fs.writeFileSync(
    path.join(BATCH_DIR, `batch_${batch.id}.json`),
    JSON.stringify(batchInfo, null, 2)
  );

  // Also save as "latest" for convenience
  fs.writeFileSync(
    path.join(BATCH_DIR, 'latest.json'),
    JSON.stringify(batchInfo, null, 2)
  );

  console.log(`\n   Batch info saved to: data/translations/ct-batch/`);
  console.log('\n   Next steps:');
  console.log('   1. Check status:    npm run ct:batch:status');
  console.log('   2. Download results: npm run ct:batch:download');
  console.log('\n   Most batches complete within 1 hour.');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
