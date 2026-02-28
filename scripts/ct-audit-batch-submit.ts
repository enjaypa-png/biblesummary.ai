/**
 * Phase 1: CT Audit Batch Submit — Rewrite (KJV + CT → corrected CT)
 *
 * Target: Ruth 1–4. REWRITE_SYSTEM only.
 *
 * Usage:
 *   npm run ct:audit:batch:submit
 *   npm run ct:audit:batch:submit -- --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

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
const MAX_TOKENS = 16384;
const TEMPERATURE = 0.2;
const BATCH_DIR = path.join(process.cwd(), 'data', 'translations', 'ct-audit-batch');

const REWRITE_SYSTEM = `You are the Clear Translation (CT) Rewrite Agent.

HARD RULE — ZERO SEMANTIC SHIFT:
The rewrite may ONLY modernize archaic grammar and archaic vocabulary.
It may NOT:
- add emphasis
- add clarification
- add implied causation
- intensify tone
- soften tone
- broaden meaning
- narrow meaning
- replace a word with a stronger synonym
- replace a word with a broader synonym
- replace a word with a more interpretive synonym
- add words not present in the KJV unless required for modern grammar

If a modern equivalent exists that preserves the same semantic force, use the closest surface-level synonym only.

Examples of forbidden shifts:
- subtil → cunning (too interpretive)
- I am full of → I have had enough of (tone shift)
- seek judgment → seek justice (semantic shift)
- aprons → coverings (broadening)
- till → work (category shift)
- keep → guard (intensity shift)
- lest ye die → or you will die (causal tightening)

Allowed:
- doth → does
- hath → has
- ye → you
- unto → to
- thereof → of it

The rewrite must feel restrained and literal.

Translate the given book and chapter from the King James Version (KJV) into clear, natural modern English.

Preserve:
- Meaning
- Events
- Logical connections
- Commands
- Warnings
- Theological claims

Modernize:
- Archaic grammar
- Obsolete vocabulary
- Outdated sentence structure

Do NOT:
- Add meaning
- Remove meaning
- Insert interpretation
- Add motives not explicitly stated
- Add symbolic commentary
- Add psychological explanations
- Soften strong language
- Intensify neutral language
- Summarize
- Combine verses

Lexical Discipline Requirements:
- Do not replace a general term with a more specific object (e.g., "ornament" must not become "wreath").
- Do not replace neutral emotional words with stronger synonyms (e.g., "fear" must not become "dread").
- Do not insert moral qualifiers not present (e.g., do not change "gain" to "unjust gain").
- Do not reinterpret ambiguous phrases (e.g., "seek me early" must not become "search earnestly").
- Do not change conceptual categories (e.g., "prosperity" must not become "complacency").
- Prefer direct modern equivalents over interpretive substitutions.

HARD LEXICAL CONSTRAINTS (NON-NEGOTIABLE)

If the KJV uses a general abstract noun (e.g., iniquity, soundness, prosperity, fear, ornament, days), the CT must preserve the same conceptual category.

Do NOT replace abstract terms with psychological, emotional, medical, or moral reinterpretations.

Do NOT narrow broad words into specific objects.

Preserve semantic range:
- "in the days of" must remain temporally broad (e.g., "in the days of" or "during the time of"), not narrowed to political reign structure.
- "soundness" must not become strictly medical language like "healthy."
- "prosperity" must not become "complacency."
- "fear" must not become "dread."

Do NOT upgrade or intensify language.

Avoid stronger emotional synonyms.
Avoid dramatic restructuring.
Avoid adding emphasis.

Prefer direct modern equivalents:
- saw → saw
- iniquity → wrongdoing / sin
- revolt more and more → continue to rebel
- seek early → seek me early / seek me from early on

If the KJV word has a direct modern English equivalent that preserves the same semantic range, you must use that word or the closest surface-level synonym. DO NOT reinterpret category.

Explicit mapping rules:
- law → law
- iniquity → iniquity or wrongdoing
- judgment → judgment
- gifts → gifts
- destruction → destruction
- confounded → put to shame or confounded
- tread → tread
- maker → maker
- converts → those who turn back (NOT those who repent, NOT those in her)

If unsure, choose the closest literal modern equivalent instead of a dynamic paraphrase.

Do not upgrade imagery.
Do not dramatize.
Do not clarify implied meaning.
Do not specify implied actions (e.g., "in prayer").
Do not switch subject perspective (e.g., "relieve the oppressed" must not become "correct the oppressor").

Do NOT change tone.
Do NOT make it more expressive.
Do NOT make it more vivid.
Do NOT clarify imagery beyond the text.

Rewrite must feel restrained, literal, and disciplined.

You may restructure sentences for clarity.

Write naturally at approximately a 10th-grade reading level.

Preserve proper names exactly as written.

Before finalizing each verse, internally verify:
- Every noun in the KJV still represents the same concept.
- Every verb preserves the same action and intensity.
- No logical connector affecting meaning was removed.
- No additional contrast or qualifier was introduced.

For each verse, rewrite the CT only if necessary.
If the current CT already complies, keep it unchanged.

Output ONLY a valid JSON array:
[{"verse": 1, "text": "..."}, {"verse": 2, "text": "..."}]

No markdown.
No commentary.
No extra text.`;

function buildUserPrompt(
  bookName: string,
  chapter: number,
  kjvVerses: { verse: number; text: string }[],
  ctVerses: { verse: number; text: string }[]
): string {
  const lines: string[] = [
    `Translate ${bookName} chapter ${chapter} from the King James Version (KJV) into clear, natural modern English.`,
    '',
    ''
  ];
  for (let i = 0; i < kjvVerses.length; i++) {
    const kv = kjvVerses[i];
    const cv = ctVerses.find((c) => c.verse === kv.verse);
    lines.push(`--- Verse ${kv.verse} ---`);
    lines.push(`KJV: ${kv.text}`);
    lines.push(`Current CT: ${cv?.text ?? '[MISSING]'}`);
    lines.push('');
  }
  lines.push('Output must remain a JSON array of: [{"verse": N, "text": "..."}]');
  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────

function normalizeBookSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') // spaces (including multiple) → single hyphen
    .replace(/[^a-z0-9-]/g, ''); // remove everything except letters, digits, hyphen
}

function parseArgs(): { book: string | null; dryRun: boolean } {
  const args = process.argv.slice(2);
  let book: string | null = null;
  let dryRun = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--book' && args[i + 1]) {
      book = args[i + 1].trim();
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }
  return { book, dryRun };
}

async function resolveChapters(bookName: string): Promise<{ book: string; chapter: number }[]> {
  const slug = normalizeBookSlug(bookName);
  const { data: book, error } = await supabase
    .from('books')
    .select('name, total_chapters')
    .eq('slug', slug)
    .single();
  if (error || !book) throw new Error(`Book "${bookName}" not found`);
  const out: { book: string; chapter: number }[] = [];
  for (let c = 1; c <= (book.total_chapters as number); c++) {
    out.push({ book: book.name as string, chapter: c });
  }
  return out;
}

const DEFAULT_CHAPTERS = [{ book: 'Leviticus', chapter: 1 }];

async function main() {
  const { book: bookArg, dryRun } = parseArgs();
  const systemPrompt = REWRITE_SYSTEM;

  const TEST_CHAPTERS = bookArg ? await resolveChapters(bookArg) : DEFAULT_CHAPTERS;
  const label = bookArg ? `${TEST_CHAPTERS[0]?.book ?? bookArg} (${TEST_CHAPTERS.length} ch)` : TEST_CHAPTERS.map((t) => `${t.book} ${t.chapter}`).join(', ');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  CT Audit Batch Submit — ${label}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Model: ${MODEL}`);
  console.log(`  Chapters: ${TEST_CHAPTERS.length}`);
  if (dryRun) console.log('  🏜️  DRY RUN — will NOT submit');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const requests: { custom_id: string; params: { model: string; max_tokens: number; temperature: number; system: string; messages: { role: 'user'; content: string }[] } }[] = [];
  const chapterMap: { custom_id: string; book_id: string; book_slug: string; book_name: string; chapter: number }[] = [];

  for (const { book: bookName, chapter } of TEST_CHAPTERS) {
    const slug = normalizeBookSlug(bookName);
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, slug, name')
      .eq('slug', slug)
      .single();

    if (bookError || !book) {
      console.error(`❌ Book "${bookName}" not found.`);
      process.exit(1);
    }

    const { data: kjvVerses, error: kjvError } = await supabase
      .from('verses')
      .select('verse, text')
      .eq('book_id', book.id)
      .eq('chapter', chapter)
      .eq('translation', 'kjv')
      .order('verse');

    const { data: ctVerses, error: ctError } = await supabase
      .from('verses')
      .select('verse, text')
      .eq('book_id', book.id)
      .eq('chapter', chapter)
      .eq('translation', 'ct')
      .order('verse');

    if (kjvError || !kjvVerses?.length || ctError || !ctVerses?.length) {
      console.error(`❌ ${bookName} ${chapter} verses not found (need both KJV and CT).`);
      process.exit(1);
    }

    const customId = `${book.slug}_${chapter}`;
    const userPrompt = buildUserPrompt(book.name, chapter, kjvVerses, ctVerses);

    requests.push({
      custom_id: customId,
      params: {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      }
    });

    chapterMap.push({
      custom_id: customId,
      book_id: book.id,
      book_slug: book.slug,
      book_name: book.name,
      chapter
    });

    console.log(`   📖 ${book.name} chapter ${chapter}: queued`);
  }

  console.log(`\n   Total: ${requests.length} chapters`);

  if (requests.length === 0) {
    console.log('\n   Nothing to submit. Ensure books have both KJV and CT verses.');
    return;
  }

  const estimatedCost = (requests.length * 2500 * 37.5) / 1_000_000;
  console.log(`   Estimated cost: ~$${estimatedCost.toFixed(1)}-${(estimatedCost * 1.5).toFixed(1)} (50% batch discount)`);

  if (dryRun) {
    console.log('\n   🏜️  DRY RUN complete. Remove --dry-run to submit.');
    return;
  }

  const batch = await anthropic.messages.batches.create({ requests });

  if (!fs.existsSync(BATCH_DIR)) fs.mkdirSync(BATCH_DIR, { recursive: true });

  const batchInfo = {
    batch_id: batch.id,
    submitted_at: new Date().toISOString(),
    total_requests: requests.length,
    chapter_map: chapterMap
  };

  fs.writeFileSync(path.join(BATCH_DIR, `batch_${batch.id}.json`), JSON.stringify(batchInfo, null, 2));
  fs.writeFileSync(path.join(BATCH_DIR, 'latest.json'), JSON.stringify(batchInfo, null, 2));

  console.log(`\n   ✅ Phase 1 batch submitted! ID: ${batch.id}`);
  console.log(`\n   Next: npm run ct:audit:batch:status`);
  console.log(`   Then: npm run ct:audit:batch:download (saves for Phase 2)`);
  console.log(`   Then: npm run ct:audit:batch:phase2:submit`);
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
