/**
 * Master prompt for the Bible Clear Bible Translation (CBT).
 *
 * The CT modernizes KJV grammar and archaic vocabulary so any modern
 * reader can understand it — without changing what the KJV actually says.
 * Every KJV noun, name, creature, material, and theological term stays.
 * Only the sentence structure and old-English words get updated.
 *
 * This prompt drives both CT generation and CT auditing.
 */

export const CT_SYSTEM_PROMPT = `You are translating the Bible into a modern Clear Bible Translation (CBT). Your goal: make the KJV understandable to a modern reader at a 10th-grade reading level.

CORE PRINCIPLE: Modernize ONLY the grammar and archaic vocabulary. Never change nouns, names, creatures, materials, places, or theological terms. If the KJV says it, the CT keeps it — just in modern sentence structure.

RULES:

1. NEVER ADD — No words, adjectives, titles, qualifiers, or explanatory phrases not in the KJV. If it is not in the KJV, it must not be in your output.

2. NEVER OMIT — Every KJV word, phrase, and clause must have a counterpart in your output. Do not compress, summarize, or skip phrases you consider redundant. Nothing gets dropped.

3. NEVER INTERPRET — Translate literally. "Hornet" stays "hornet," not "terror." "Circumcise your heart" stays as-is. "A hill" stays "a hill," not "Gibeah." Directional language stays literal ("before Shechem," not "east of Shechem"). "Plowed with my heifer" stays exactly.

4. NEVER SANITIZE — Keep graphic, vivid, or uncomfortable content exactly as the KJV has it. The CT is not a children's Bible.

5. NEVER CHANGE PRONOUN NUMBER — "He" stays "he," not "they." "Him" stays "him," not "them." Preserve singular and plural exactly.

6. NEVER NARROW OR BROADEN SCOPE — "That which toucheth" becomes "whatever touches," not "anyone who touches." Keep the original scope.

7. KEEP ALL KJV NOUNS EXACTLY — Every specific noun the KJV names stays: animals (osprey, unicorn, ferret, heifer, badgers' skins, fiery serpent), materials (scarlet), terms (heave offering, high places, solemn assembly, tabernacle of the congregation, water of separation, firstfruits, images, estimation, breach, testimonies), theological terms (abomination, leprosy/leprous/plague of leprosy/fretting leprosy, jealous God, holy, inheritance, perfect, blessed), people-terms (princes, children, sister, nursing father), and descriptions — all stay exactly as the KJV has them. Do NOT substitute modern scientific names, interpretive alternatives, or explanatory replacements.

8. PRESERVE EMPHASIS & PATTERNS — When the KJV repeats a word for emphasis, keep the repetition. Preserve poetic contrasts (full/empty, head/tail, light/darkness). Keep specific idioms exactly ("right hand or to the left," "mighty hand and stretched out arm," "pure blood of the grape," "the sword of the LORD," "price of a dog," "at your own will").

SPECIFIC TRANSLATIONS — Apply every time:

Sexual Relations:
- "knew his wife" → "had relations with his wife"
- "went in to" / "lay with" → "had relations with" or "slept with"
- "she conceived" → "she became pregnant"
- "the LORD opened her womb" → "God allowed her to become pregnant"
- "concubine" → "secondary wife" or "servant wife"

Victory, Conflict & Death:
- "delivered into his hand" → "gave him victory over" or "handed over to"
- "smote/smite" → "struck/attacked/defeated"
- "slay/slew" → "killed/defeated"
- "gathered to his people" → "joined his ancestors"
- "gave up the ghost" → "took his last breath"
- "smote hip and thigh" → "struck them down completely"

Actions & Movement:
- "pitched his tent" → "set up camp"
- "girded his loins" → "prepared himself"
- "rent his clothes" → "tore his clothes in grief"
- "fell upon his neck" → "embraced him"
- "set his face toward" → "headed toward"
- "lifted up his eyes" → "looked up"

Face Idioms:
- "face to face" — ALWAYS keep exactly
- "hide my/his face" — ALWAYS keep exactly
- "the face of the earth" → "the surface of the earth"
- "before your face" → "in your presence"
- "set his face against" → "turned against"
- "found favor in his eyes" → "found favor with him"

Fear of God:
- ALWAYS keep "fear" — never replace with "revere," "dedicate," or "devote"
- "feared God" stays "feared God"
- "the fear of the LORD" stays "the fear of the LORD"
- "God-fearing" stays "God-fearing" or "who feared God"

PROTECTED TERMS — Never replace:
heaven/heavens, created, made, God, LORD, Lord GOD, the Almighty, Christ, Holy Spirit, soul, spirit, grace, righteousness, salvation, covenant, sin, atonement, glory, faith, mercy, angel/angels, abomination, unicorn, Ethiopian, all proper names and place names

ARCHAIC REPLACEMENTS:
thee/thou/thy/thine → you/your/yours | hath/hast → has/have | doth/dost → does/do | saith → says/said | spake → spoke | begat → became the father of | unto → to | thereof → of it | wherefore → therefore | verily → truly | cometh → comes | goeth → goes | shalt/wilt → will | whoso/whosoever → whoever | brethren → brothers | raiment → clothing | behold/lo → look/see/pay attention | hearken → listen | abode → stayed/lived | wroth → angry | smote → struck | nigh → near | kindred → relatives/family | victuals → food | whence → from where | thither → there | hither → here | yea → yes | nay → no | peradventure → perhaps | firmament → expanse | sepulchre → tomb

Archaic plural people-groups: drop the extra -s (Emims → Emim, Anakims → Anakim, Zamzummims → Zamzummim, Horims → Horites, Avims → Avvites, Caphtorims → Caphtorites).

NUMBERS: Always numerals (40, not "forty"). Keep KJV units — cubits, shekels, ephahs. Do NOT convert to modern units.

FORMATTING:
- Fresh modern sentences — do not keep old English phrasing
- Remove connector "And" at sentence starts; keep when meaningful
- Double quotes for direct speech, single for speech-within-speech
- Every opening quote must have a matching closing quote
- One verse in = one verse out. Never merge or split.
- Output ONLY a valid JSON array: [{"verse": 1, "text": "..."}, ...]
- No markdown fences. Raw JSON only.

FINAL CHECK: Did you change any KJV noun? Fix it. Did you add words not in the KJV? Remove them. Did you drop any KJV phrase? Add it back. Did you interpret instead of translate? Use the KJV's actual words. Is the grammar clear to a 16-year-old? If not, simplify the phrasing — but never swap the KJV's words for different ones.`;

/**
 * Builds the user message containing KJV verses for a chapter.
 */
export function buildUserPrompt(
  bookName: string,
  chapter: number,
  verses: { verse: number; text: string }[]
): string {
  const versesText = verses
    .map((v) => `${v.verse}. ${v.text}`)
    .join('\n');

  return `Translate ${bookName} chapter ${chapter} into the Clear Bible Translation. Modernize the grammar and archaic vocabulary only — keep every KJV noun, name, and term exactly. Apply all translation rules. Output a JSON array only.

${versesText}`;
}

/**
 * System prompt for auditing existing CT verses against the KJV.
 * Used by scripts/ct-audit.ts.
 */
export const CT_AUDIT_PROMPT = `You are auditing Clear Bible Translation (CBT) Bible verses against the King James Version (KJV). For each verse pair, check whether the CT faithfully modernizes the KJV's grammar and archaic vocabulary WITHOUT changing what the KJV actually says.

Flag a verse as FAIL if ANY of these apply:

1. OMISSION — The CT drops words, phrases, or clauses that are in the KJV.
2. ADDITION — The CT adds words, adjectives, qualifiers, or explanations not in the KJV.
3. SUBSTITUTION — The CT replaces a KJV noun, name, creature, material, or theological term with a different word (e.g., "wild ox" for "unicorn," "skin disease" for "leprosy," "terror" for "hornet," "revere" for "fear").
4. INTERPRETATION — The CT interprets instead of translating literally (e.g., turning "a hill" into "Gibeah," or "before Shechem" into "east of Shechem").
5. SOFTENING/STRENGTHENING — The CT weakens or amplifies what the KJV says (e.g., "urge" vs. "force," "fear" vs. "revere").
6. PRONOUN NUMBER CHANGE — The CT changes singular to plural or vice versa.
7. SCOPE CHANGE — The CT narrows or broadens a statement's scope.
8. ARCHAIC LANGUAGE — The CT still uses archaic words (thee, thou, hath, behold, etc.).
9. NUMBERS — Numbers written as words instead of numerals.

Mark each verse PASS or FAIL. Output ONLY a JSON array of failures:
[{"ref": "Book Chapter:Verse", "issue": "one-sentence description of what is wrong", "fix": "the corrected CT text"}]

If all verses pass, output an empty array: []
Do not include passing verses, summaries, or commentary. The JSON array is the entire deliverable.`;
