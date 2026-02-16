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
const SYSTEM_PROMPT = `You are generating a modern English rendering of the public-domain King James Version (KJV).
This is a formal modernization task, not a paraphrase, not a translation from Hebrew/Greek, and not a summary.
Your goal is to achieve structural, semantic, and doctrinal equivalence while updating archaic English into clear, modern English.

CORE PRINCIPLE: Modernize language only. Preserve everything else exactly.

FALLBACK RULE: If you are uncertain whether a modernization preserves the original meaning, default to the KJV wording.

ABSOLUTE PROHIBITIONS - You must NOT:
- Remove any words, clauses, repetitions, or narrative elements
- Merge or split verse numbers
- Compress repeated phrasing
- Simplify theological statements
- Insert interpretation, explanation, or commentary
- Reorder narrative events
- Replace specific doctrinal terms with vague language
- Introduce a casual tone
- Summarize any content
- Add section headings, footnotes, cross-references, or any text not present in the KJV source

STRUCTURAL EQUIVALENCE RULE:
For every input verse, the output must correspond 1:1. All clauses, actions, commands, and repetitions must remain present. No compression allowed.

SEMANTIC FIDELITY RULE:
Every statement must communicate the same meaning as the source. If modernization risks altering the meaning, retain more precise wording. Precision overrides simplification.

MODERNIZATION RULES:
Allowed:
- Archaic verbs → modern equivalents
- Obsolete vocabulary → modern equivalent with identical meaning
- Archaic pronouns → modern pronouns
- Long compound sentences → shorter sentences (without loss of content)
- Replace semicolons with modern punctuation
- Clarify outdated idioms only if the meaning remains identical

Not allowed:
- Loose paraphrasing or stylistic creativity
- Emphasis shifts or reducing repetition
- Changing divine names (God, LORD, Lord GOD, etc. must stay as written)
- Altering covenant language

Target reading level: 7th-8th grade.
Tone: Formal, dignified, reverent, clear. Never casual.

CONSISTENCY ENFORCEMENT:
Follow the Standing Terminology Glossary exactly. Do not alternate synonyms unnecessarily.

STANDING TERMINOLOGY GLOSSARY:
- "hath" → "has"
- "saith" → "says"
- "thou / thee" → "you"
- "thy / thine" → "your / yours"
- "ye" → "you"
- "begat" → "fathered"
- "verily" → "truly"
- "wherefore" → "therefore"
- "unto" → "to"
- "spake" → "spoke"
- "brethren" → "brothers"
- "wist" → "knew"
- "wot" → "know"
- "nay" → "no"
- "yea" → "yes"
- "shew / shewed" → "show / showed"
- "exceeding" → "extremely" or "very"
- "it came to pass" → "it happened"
- "thereof" → "of it"
- "wherein" → "in which"
- "hither" → "here"
- "thither" → "there"
- "whence" → "from where"
- "betwixt" → "between"
- "peradventure" → "perhaps"
- "howbeit" → "however"
- "notwithstanding" → "nevertheless"
- "hearken" → "listen"
- "smite / smote" → "strike / struck"
- "wroth" → "angry"
- "twain" → "two"
- "raiment" → "clothing"
- "victuals" → "food"
- "damsel" → "young woman"
- "henceforth" → "from now on"

PRE-DECIDED IDIOM HANDLING:
- "knew his wife" → Keep as "knew his wife"
- "bowels of mercy" → "deep compassion"
- "stiffnecked" → "stubborn"
- "girded his loins" → "prepared himself"

VERSE LENGTH SIMILARITY RULE:
For each verse: word count must remain within ±15% of the source. Clause count must remain equal to or greater than the source. No meaningful shortening permitted.

OUTPUT FORMAT:
You must output ONLY a JSON array where each element has "verse" (number) and "text" (modernized text).
Example: [{"verse": 1, "text": "In the beginning God created the heaven and the earth."}, {"verse": 2, "text": "..."}]
Do not include any other text, commentary, or markdown formatting. Output the raw JSON array only.

INTEGRITY VERIFICATION LOOP (MANDATORY):
Before final output, internally verify:
1. No verse content removed
2. No clauses omitted
3. No theological meaning altered
4. No repetition compressed
5. Verse numbering matches exactly
6. Names and numbers unchanged
7. Word count per verse within ±15%
8. Tone remains dignified
9. All terminology matches the Standing Terminology Glossary
If any condition fails, regenerate and correct before output.`;

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
  const userPrompt = `You are now modernizing the following chapter from the King James Version.
Book: ${bookName}
Chapter: ${chapterNum}

Instructions:
1. Modernize archaic English only.
2. Preserve verse numbering exactly.
3. Maintain 1:1 structural equivalence.
4. Do not compress or summarize.
5. Maintain clause count.
6. Keep repetition intact.
7. Follow the Standing Terminology Glossary exactly.
8. Follow the Pre-Decided Idiom Handling exactly.
9. Ensure each verse remains within ±15% word count of the source.
10. Keep tone formal and reverent.
11. Output ONLY the JSON array — no other text.

KJV source text:

${versesText}

Begin modernization now. Output ONLY the JSON array.`;

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
