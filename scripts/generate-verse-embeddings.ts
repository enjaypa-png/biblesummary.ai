/**
 * Generate embeddings for all Bible verses in Supabase.
 *
 * For each verse in the `verses` table:
 *   - Build a combined text from book_id, chapter, verse, text, and modern_text
 *   - Call OpenAI embeddings API (text-embedding-3-small)
 *   - Store the vector into the `embedding` column
 *
 * Behavior:
 *   - Processes verses in batches of 100
 *   - Skips verses where `embedding` is already set
 *   - Logs progress every 500 verses
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

if (!openaiApiKey) {
  console.error('❌ Missing OPENAI_API_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const openai = new OpenAI({ apiKey: openaiApiKey });

const BATCH_SIZE = 100;
const LOG_INTERVAL = 500;
const EMBEDDING_MODEL = 'text-embedding-3-small';

interface VerseRow {
  id: string;
  book_id: number;
  chapter: number;
  verse: number;
  text: string | null;
  modern_text: string | null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildInputText(v: VerseRow): string {
  const parts: string[] = [];
  parts.push(`Book ${v.book_id} Chapter ${v.chapter} Verse ${v.verse}.`);
  if (v.text) parts.push(v.text);
  if (v.modern_text) parts.push(v.modern_text);
  return parts.join('\n');
}

async function fetchNextBatch(): Promise<VerseRow[]> {
  const { data, error } = await supabase
    .from('verses')
    .select('id, book_id, chapter, verse, text, modern_text')
    .is('embedding', null)
    .order('id', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    throw new Error(`Supabase fetch error: ${error.message}`);
  }

  return (data as VerseRow[]) || [];
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Verse Embedding Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Model: ${EMBEDDING_MODEL}`);
  console.log(`  Batch size: ${BATCH_SIZE}\n`);

  let totalProcessed = 0;

  // Loop until there are no more verses without embeddings
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch = await fetchNextBatch();
    if (!batch.length) break;

    const inputs = batch.map(buildInputText);

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: inputs
    });

    if (!response.data || response.data.length !== batch.length) {
      throw new Error(`Embedding response size mismatch. Expected ${batch.length}, got ${response.data?.length ?? 0}`);
    }

    // Update ONLY the embedding column for each verse
    for (let i = 0; i < batch.length; i++) {
      const verse = batch[i];
      const embedding = response.data[i].embedding;

      let attempts = 0;
      // Retry a few times on transient 5xx / HTML errors from Supabase / Cloudflare
      while (true) {
        attempts++;
        const { error: updateError } = await supabase
          .from('verses')
          .update({ embedding })
          .eq('id', verse.id);

        if (!updateError) break;

        const msg = updateError.message || '';
        const transient =
          msg.includes('502') ||
          msg.includes('503') ||
          msg.includes('Bad gateway') ||
          msg.includes('<!DOCTYPE html>');

        if (!transient || attempts >= 3) {
          console.error(`  ❌ Supabase update error for verse id=${verse.id} after ${attempts} attempt(s): ${msg}`);
          // Skip this verse and continue; do NOT abort the whole run
          break;
        }

        console.warn(`  ⚠️ Transient Supabase error for verse id=${verse.id} (attempt ${attempts}) — retrying in 5s...`);
        await sleep(5000);
      }
    }

    totalProcessed += batch.length;
    if (totalProcessed % LOG_INTERVAL === 0) {
      console.log(`  ✅ Processed ${totalProcessed} verses so far...`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Done. Total verses processed: ${totalProcessed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch((err) => {
  console.error('❌ Fatal error while generating embeddings:', err);
  process.exit(1);
});

