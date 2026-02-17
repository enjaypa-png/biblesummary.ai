/**
 * Download CT Batch Results
 *
 * Retrieves completed batch results and saves them as chapter JSON files
 * in the same format as the real-time generator (data/translations/ct/).
 *
 * Usage:
 *   npm run ct:batch:download                       # Download latest batch
 *   npm run ct:batch:download -- --id msgbatch_xxx   # Download specific batch
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const OUTPUT_DIR = path.join(process.cwd(), 'data', 'translations', 'ct');
const BATCH_DIR = path.join(process.cwd(), 'data', 'translations', 'ct-batch');
const MODEL = 'claude-opus-4-6';

interface ChapterMap {
  custom_id: string;
  book_slug: string;
  book_name: string;
  chapter: number;
}

interface BatchInfo {
  batch_id: string;
  chapter_map: ChapterMap[];
}

async function main() {
  // Get batch ID
  const args = process.argv.slice(2);
  let batchId: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id' && args[i + 1]) {
      batchId = args[i + 1];
      i++;
    }
  }

  let batchInfo: BatchInfo;

  if (!batchId) {
    const latestPath = path.join(BATCH_DIR, 'latest.json');
    if (!fs.existsSync(latestPath)) {
      console.error('❌ No batch found. Run ct:batch:submit first.');
      process.exit(1);
    }
    batchInfo = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
    batchId = batchInfo.batch_id;
  } else {
    const batchPath = path.join(BATCH_DIR, `batch_${batchId}.json`);
    if (fs.existsSync(batchPath)) {
      batchInfo = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
    } else {
      console.error('❌ No batch info file found. Cannot map results to chapters.');
      process.exit(1);
    }
  }

  // Check batch status first
  const batch = await anthropic.messages.batches.retrieve(batchId!);

  if (batch.processing_status !== 'ended') {
    console.log(`\n  ⏳ Batch is still ${batch.processing_status}. Try again later.`);
    console.log(`     Processing: ${batch.request_counts.processing} remaining`);
    return;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CT Batch Download');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Batch ID: ${batchId}`);
  console.log(`  Succeeded: ${batch.request_counts.succeeded}`);
  console.log(`  Errored: ${batch.request_counts.errored}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Build lookup map from chapter_map
  const chapterLookup = new Map<string, ChapterMap>();
  for (const entry of batchInfo.chapter_map) {
    chapterLookup.set(entry.custom_id, entry);
  }

  // Stream results
  let saved = 0;
  let errors = 0;

  for await (const result of anthropic.messages.batches.results(batchId!)) {
    const customId = result.custom_id;
    const chapterInfo = chapterLookup.get(customId);

    if (!chapterInfo) {
      console.warn(`   ⚠️  Unknown custom_id: ${customId}`);
      continue;
    }

    const label = `${chapterInfo.book_name} ${chapterInfo.chapter}`;

    if (result.result.type !== 'succeeded') {
      console.error(`   ❌ ${label}: ${result.result.type}`);
      errors++;
      continue;
    }

    // Extract text from response
    const message = result.result.message;
    const textBlock = message.content.find((b: any) => b.type === 'text');

    if (!textBlock || textBlock.type !== 'text') {
      console.error(`   ❌ ${label}: No text in response`);
      errors++;
      continue;
    }

    // Parse JSON
    let ctVerses: { verse: number; text: string }[];
    try {
      ctVerses = JSON.parse(textBlock.text);
    } catch {
      const match = textBlock.text.match(/\[[\s\S]*\]/);
      if (match) {
        ctVerses = JSON.parse(match[0]);
      } else {
        console.error(`   ❌ ${label}: JSON parse failed`);
        // Save raw for debugging
        const debugDir = path.join(BATCH_DIR, '_debug');
        if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
        fs.writeFileSync(
          path.join(debugDir, `${customId}_raw.txt`),
          textBlock.text
        );
        errors++;
        continue;
      }
    }

    // Fetch KJV verses for side-by-side output
    const { data: kjvVerses } = await supabase
      .from('verses')
      .select('verse, text')
      .eq('book_id', (await supabase
        .from('books')
        .select('id')
        .eq('slug', chapterInfo.book_slug)
        .single()).data?.id)
      .eq('chapter', chapterInfo.chapter)
      .order('verse');

    // Build output in same format as real-time generator
    const output = {
      book: chapterInfo.book_slug,
      book_name: chapterInfo.book_name,
      chapter: chapterInfo.chapter,
      translation: 'ct' as const,
      generated_at: new Date().toISOString(),
      model: MODEL,
      verses: (kjvVerses || []).map((kjv, i) => ({
        verse: kjv.verse,
        kjv: kjv.text,
        ct: ctVerses[i]?.text || `[MISSING - verse ${kjv.verse}]`
      }))
    };

    // Save chapter file
    const bookDir = path.join(OUTPUT_DIR, chapterInfo.book_slug);
    if (!fs.existsSync(bookDir)) fs.mkdirSync(bookDir, { recursive: true });
    fs.writeFileSync(
      path.join(bookDir, `${chapterInfo.chapter}.json`),
      JSON.stringify(output, null, 2)
    );

    saved++;
    if (saved % 50 === 0) {
      console.log(`   📥 ${saved} chapters saved...`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Download complete!`);
  console.log(`  Saved: ${saved} chapters`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Output: ${OUTPUT_DIR}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (errors > 0) {
    console.log(`\n  ⚠️  ${errors} chapters had errors. Check ct-batch/_debug/ for details.`);
    console.log('  You can regenerate failed chapters with: npm run ct:generate -- --book <slug> --chapter <num>');
  }

  console.log('\n  Next: Review output, then run: npm run ct:seed');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
