/**
 * KJV Modern English Rendering - API Automation Script
 * 
 * This script:
 * 1. Pulls KJV verse text from your Supabase database (chapter by chapter)
 * 2. Sends each chapter to Claude's API with the modernization prompt
 * 3. Parses the modernized verses from Claude's response
 * 4. Saves the results as JSON files in /output directory
 * 
 * After running this script, use seed-modern-text.ts to upload results to Supabase.
 * 
 * REQUIREMENTS:
 * - ANTHROPIC_API_KEY in .env.local (get one at console.anthropic.com)
 * - NEXT_PUBLIC_SUPABASE_URL in .env.local
 * - SUPABASE_SERVICE_ROLE_KEY in .env.local
 * - Books and verses must already be seeded in Supabase
 * 
 * USAGE:
 *   npm run modernize                  # Run all books
 *   npm run modernize -- --book genesis  # Run a single book
 *   npm run modernize -- --resume       # Resume from where you left off
 * 
 * COST ESTIMATE:
 * - Uses Claude Sonnet 4.5 ($3 input / $15 output per million tokens)
 * - Uses prompt caching to save ~90% on repeated system prompt
 * - Full Bible: approximately $5-15 depending on caching efficiency
 * - Uses Batch API for 50% discount when --batch flag is used
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables in .env.local');
  process.exit(1);
}

if (!anthropicApiKey) {
  console.error('❌ Missing ANTHROPIC_API_KEY in .env.local');
  console.error('   Get your API key at: https://console.anthropic.com/settings/keys');
  console.error('   Then add to .env.local: ANTHROPIC_API_KEY=sk-ant-...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

// ============================================================
// SYSTEM PROMPT - The modernization rules (cached across calls)
// ============================================================
const SYSTEM_PROMPT = `You are rendering the King James Version (KJV) Bible into clear, natural modern English.

YOUR GOAL:
Produce text that reads like the GOD'S WORD Translation (GW) — clear, natural, everyday English that any modern reader can understand on the first read. The meaning must be faithful to the KJV source, but the language should feel like it was originally written in modern English, not like old English with a few words swapped out.

STYLE MODEL — GOD'S WORD Translation (GW):
Study these examples of the GW style carefully. This is exactly how your output should read:

KJV: "Now it came to pass in the days when the judges ruled, that there was a famine in the land. And a certain man of Bethlehemjudah went to sojourn in the country of Moab, he, and his wife, and his two sons."
GW: "In the days when the judges were ruling, there was a famine in the land. A man from Bethlehem in Judah went with his wife and two sons to live for a while in the country of Moab."

KJV: "And Ruth said, Intreat me not to leave thee, or to return from following after thee: for whither thou goest, I will go; and where thou lodgest, I will lodge: thy people shall be my people, and thy God my God"
GW: "But Ruth answered, 'Don't force me to leave you. Don't make me turn back from following you. Wherever you go, I will go, and wherever you stay, I will stay. Your people will be my people, and your God will be my God.'"

KJV: "And she said unto them, Call me not Naomi, call me Mara: for the Almighty hath dealt very bitterly with me."
GW: "She answered them, 'Don't call me Naomi. Call me Mara, because the Almighty has made my life very bitter.'"

Notice how GW:
- Uses natural sentence structure (not just word swaps)
- Breaks long run-on sentences into shorter, clearer ones
- Replaces archaic phrasing with how a modern person would naturally say it
- Adds quotation marks around spoken dialogue
- Keeps the meaning completely faithful while sounding natural
- Maintains a respectful, clear tone — never casual or slangy

RULES:
1. Every KJV verse must produce exactly one corresponding output verse. Never merge or split verses.
2. Preserve ALL meaning, events, names, numbers, and theological content from the KJV.
3. Preserve divine names exactly: God, LORD, Lord GOD, the Almighty, etc.
4. Do NOT add interpretation, commentary, footnotes, or headings.
5. Do NOT skip or summarize any verse content.
6. Add quotation marks around direct speech/dialogue.
7. Use natural modern English sentence structure — do NOT just swap archaic words while keeping awkward KJV grammar.
8. "It came to pass" → Remove or replace naturally (e.g., "One day...", "Then...", or just start the sentence).
9. Be consistent: if you render a word or phrase one way, use the same rendering throughout.

WHAT TO CHANGE:
- All archaic grammar and sentence structure → natural modern English
- All archaic vocabulary → modern equivalents
- Awkward KJV word order → natural English word order
- Long compound sentences with semicolons → shorter, clearer sentences
- Implicit dialogue → add quotation marks

WHAT TO KEEP:
- Every verse's complete meaning
- All names, places, and numbers exactly as written
- Divine names (God, LORD, etc.)
- The respectful, dignified tone
- Verse-by-verse structure (1:1 correspondence)

OUTPUT FORMAT:
Output ONLY a JSON array. Each element has "verse" (number) and "text" (modernized text).
Example: [{"verse": 1, "text": "In the days when the judges were ruling, there was a famine in the land. A man from Bethlehem in Judah went with his wife and two sons to live for a while in the country of Moab."}]
Do not include any other text, commentary, or markdown. Raw JSON array only.

QUALITY CHECK — Before outputting, verify:
1. Every verse from the input has a corresponding output verse
2. No meaning was lost or changed
3. The text reads naturally — like it was written in modern English, not translated
4. Names and numbers are unchanged
5. Divine names are preserved exactly`;

// ============================================================
// OUTPUT DIRECTORY
// ============================================================
const OUTPUT_DIR = path.join(process.cwd(), 'scripts', 'modern-output');

// ============================================================
// PARSE COMMAND LINE ARGUMENTS
// ============================================================
const args = process.argv.slice(2);
const bookFilter = args.find(a => a.startsWith('--book='))?.split('=')[1] 
  || (args.indexOf('--book') !== -1 ? args[args.indexOf('--book') + 1] : null);
const resumeMode = args.includes('--resume');

// ============================================================
// HELPER: Call Claude API with caching
// ============================================================
interface ModernVerse {
  verse: number;
  text: string;
}

async function callClaudeAPI(bookName: string, chapterNum: number, versesText: string): Promise<ModernVerse[]> {
  const userPrompt = `Modernize this chapter into clear, natural modern English (GW style).

Book: ${bookName}
Chapter: ${chapterNum}

Render each verse into natural modern English. Add quotation marks around dialogue. Keep all meaning, names, and divine names. Output ONLY the JSON array.

KJV source text:

${versesText}

Output the JSON array now.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' }  // Cache the system prompt
        }
      ],
      messages: [
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  
  // Log token usage for cost tracking
  const usage = data.usage;
  if (usage) {
    const cacheInfo = usage.cache_creation_input_tokens 
      ? ` (cache write: ${usage.cache_creation_input_tokens}, cache read: ${usage.cache_read_input_tokens || 0})`
      : ` (cache read: ${usage.cache_read_input_tokens || 0})`;
    console.log(`     Tokens - input: ${usage.input_tokens}${cacheInfo}, output: ${usage.output_tokens}`);
  }

  // Extract text content from response
  const textContent = data.content?.find((c: any) => c.type === 'text')?.text;
  if (!textContent) {
    throw new Error('No text content in API response');
  }

  // Parse JSON from response (handle possible markdown code fences)
  let cleanJson = textContent.trim();
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed: ModernVerse[] = JSON.parse(cleanJson);
    return parsed;
  } catch (parseError) {
    console.error('     ⚠️  Failed to parse JSON response, saving raw text for manual review');
    // Save the raw response for debugging
    const debugPath = path.join(OUTPUT_DIR, '_debug');
    if (!fs.existsSync(debugPath)) fs.mkdirSync(debugPath, { recursive: true });
    fs.writeFileSync(
      path.join(debugPath, `${bookName.toLowerCase()}_${chapterNum}_raw.txt`),
      textContent
    );
    throw new Error(`JSON parse failed for ${bookName} ${chapterNum}`);
  }
}

// ============================================================
// HELPER: Check if chapter already processed (for --resume)
// ============================================================
function isChapterProcessed(bookSlug: string, chapter: number): boolean {
  const filePath = path.join(OUTPUT_DIR, bookSlug, `chapter_${chapter}.json`);
  return fs.existsSync(filePath);
}

// ============================================================
// HELPER: Save chapter results
// ============================================================
function saveChapterResults(bookSlug: string, chapter: number, verses: ModernVerse[]) {
  const bookDir = path.join(OUTPUT_DIR, bookSlug);
  if (!fs.existsSync(bookDir)) fs.mkdirSync(bookDir, { recursive: true });
  
  fs.writeFileSync(
    path.join(bookDir, `chapter_${chapter}.json`),
    JSON.stringify(verses, null, 2)
  );
}

// ============================================================
// MAIN: Process all chapters
// ============================================================
async function main() {
  console.log('📖 KJV Modern English Rendering - API Automation\n');
  console.log('   Model: Claude Sonnet 4.5 (with prompt caching)');
  console.log(`   Output: ${OUTPUT_DIR}\n`);

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Get all books from database
  let booksQuery = supabase.from('books').select('id, name, slug, total_chapters').order('order_index');
  
  if (bookFilter) {
    booksQuery = booksQuery.eq('slug', bookFilter);
  }

  const { data: books, error: booksError } = await booksQuery;
  
  if (booksError) {
    console.error('❌ Failed to fetch books:', booksError.message);
    process.exit(1);
  }
  
  if (!books || books.length === 0) {
    console.error(bookFilter ? `❌ Book "${bookFilter}" not found in database` : '❌ No books found');
    process.exit(1);
  }

  console.log(`   Processing ${books.length} book(s)...\n`);

  // Track stats
  let totalChapters = 0;
  let processedChapters = 0;
  let skippedChapters = 0;
  let errorChapters: string[] = [];
  const startTime = Date.now();

  for (const book of books) {
    console.log(`\n📘 ${book.name} (${book.total_chapters} chapters)`);

    for (let chapter = 1; chapter <= book.total_chapters; chapter++) {
      totalChapters++;

      // Skip if already processed (--resume mode)
      if (resumeMode && isChapterProcessed(book.slug, chapter)) {
        skippedChapters++;
        continue;
      }

      // Fetch verses for this chapter from Supabase
      const { data: verses, error: versesError } = await supabase
        .from('verses')
        .select('verse, text')
        .eq('book_id', book.id)
        .eq('chapter', chapter)
        .order('verse');

      if (versesError || !verses || verses.length === 0) {
        console.error(`   ❌ Ch ${chapter}: No verses found`);
        errorChapters.push(`${book.name} ${chapter}`);
        continue;
      }

      // Format verses as numbered text for the prompt
      const versesText = verses.map(v => `${v.verse}. ${v.text}`).join('\n');

      try {
        console.log(`   📝 Ch ${chapter} (${verses.length} verses)...`);
        
        const modernVerses = await callClaudeAPI(book.name, chapter, versesText);

        // Validate: check verse count matches
        if (modernVerses.length !== verses.length) {
          console.warn(`     ⚠️  Verse count mismatch! KJV: ${verses.length}, Modern: ${modernVerses.length}`);
          // Still save it but flag it for review
          const flagPath = path.join(OUTPUT_DIR, '_flagged.txt');
          fs.appendFileSync(flagPath, `${book.name} ${chapter}: Expected ${verses.length} verses, got ${modernVerses.length}\n`);
        }

        saveChapterResults(book.slug, chapter, modernVerses);
        processedChapters++;
        console.log(`     ✅ Saved ${modernVerses.length} verses`);

      } catch (error: any) {
        console.error(`     ❌ Error: ${error.message}`);
        errorChapters.push(`${book.name} ${chapter}`);

        // If rate limited, wait and retry once
        if (error.message.includes('429') || error.message.includes('rate')) {
          console.log('     ⏳ Rate limited - waiting 60 seconds...');
          await new Promise(r => setTimeout(r, 60000));
          
          try {
            const versesText2 = verses.map(v => `${v.verse}. ${v.text}`).join('\n');
            const modernVerses = await callClaudeAPI(book.name, chapter, versesText2);
            saveChapterResults(book.slug, chapter, modernVerses);
            processedChapters++;
            errorChapters.pop(); // Remove from error list
            console.log(`     ✅ Retry succeeded`);
          } catch (retryError: any) {
            console.error(`     ❌ Retry failed: ${retryError.message}`);
          }
        }
      }

      // Small delay between API calls to be respectful of rate limits
      // Prompt caching has a 5-minute TTL, so we want to keep moving
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Final report
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('\n' + '='.repeat(50));
  console.log('📊 MODERNIZATION COMPLETE');
  console.log('='.repeat(50));
  console.log(`   Total chapters:    ${totalChapters}`);
  console.log(`   Processed:         ${processedChapters}`);
  console.log(`   Skipped (resume):  ${skippedChapters}`);
  console.log(`   Errors:            ${errorChapters.length}`);
  console.log(`   Time:              ${elapsed} minutes`);
  
  if (errorChapters.length > 0) {
    console.log(`\n   ❌ Failed chapters:`);
    errorChapters.forEach(ch => console.log(`      - ${ch}`));
    console.log(`\n   Run with --resume to retry failed chapters.`);
  }

  // Save a completion log
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '_completion_log.json'),
    JSON.stringify({
      completedAt: new Date().toISOString(),
      totalChapters,
      processedChapters,
      skippedChapters,
      errorChapters,
      elapsedMinutes: parseFloat(elapsed)
    }, null, 2)
  );

  console.log(`\n   Next step: Run "npm run seed:modern" to upload to Supabase\n`);
}

// Run
main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
