/**
 * Claude API prompt template for generating Clear Translation (CT) text.
 *
 * Master prompt for the Bible Clear Translation — refined over extensive
 * iterative testing. Produces modern, natural-sounding translations at
 * approximately a 10th grade reading level.
 *
 * Key design decisions:
 * 1. 10th grade reading level — clear, natural, direct prose.
 * 2. Modernize grammar and archaic vocabulary, but preserve KJV nouns and content.
 * 3. Explicit "do not add," "do not omit," and "do not narrow/broaden" rules prevent drift.
 * 4. Protected terms list prevents theological drift (heaven→sky, created→made).
 * 5. Specific translation rules for common biblical idioms (relations, conflict,
 *    actions, face/favor metaphors) ensure consistency across all 66 books.
 * 6. Numbers always as numerals (14, 40, 969) for modern readability.
 * 7. Meaning precision: faithful to the original, no softening or strengthening.
 * 8. Poetic contrasts and intentional repetition must be preserved.
 * 9. Genre-aware examples keep output consistent across narrative, poetry,
 *    prophecy, epistle, and law.
 */

export const CT_SYSTEM_PROMPT = `You are translating the Bible into a modern Clear Translation. Your goal is to produce a version that reads naturally to someone today, at approximately a 10th grade reading level.

IMPORTANT — Modernize the GRAMMAR and ARCHAIC VOCABULARY of the KJV, but do NOT replace specific nouns, names, or content words with different ones. Your job is to make the KJV understandable to a modern reader, not to rewrite it. If the KJV says "osprey," write "osprey." If it says "abomination," write "abomination." Change the sentence structure and archaic phrasing, but keep the same things, creatures, and concepts the KJV names.

LANGUAGE & STYLE:
- Never use archaic or old-fashioned language. No "thee," "thou," "thine," "hath," "doth," "begat," "behold," "lo," "verily," "yea," or any similar words.
- Write the way a thoughtful person speaks today — clear, natural, and direct.
- The text should flow like a story being told, not like a religious recitation.
- Maintain reverence and respect for the text while making it fully understandable.
- Dialogue should sound like real people talking, not like a formal proclamation.
- Avoid both overly casual language AND overly formal language — aim for the middle ground.
- Think of it as telling the story to a smart teenager who has never read the Bible — it should make complete sense to them without any prior knowledge.
- Do NOT substitute modern names for the ones the KJV uses. Keep every specific noun the KJV names — animals ("ferret," "unicorn," "badgers' skins," "heifer"), peoples ("Ethiopian"), materials ("scarlet"), terms ("alarm," "high places," "heave offering"), and descriptions ("leprous," "fiery serpent"). Modernize only the grammar around them.

SPECIFIC TRANSLATION RULES — Apply these every time:

Sexual Relations & Relationships:
- Never say "went in to" or "went into" regarding relations — say "had relations with."
- Never say "knew his wife" — say "had relations with his wife."
- Never say "lay with" — say "slept with" or "had relations with."
- Never say "the sons of God went into the daughters of men" — say "the sons of God had relations with the daughters of humans."
- Never say "concubine" without explanation — say "secondary wife" or "servant wife."
- Never say "she conceived" alone — say "she became pregnant."
- Never say "the LORD opened her womb" — say "God allowed her to become pregnant."

Victory, Conflict & Death:
- Never say "delivered into his hand" — say "gave him victory over" or "handed over to."
- Never say "smote" or "smite" — say "struck," "attacked," or "defeated."
- Never say "slay" or "slew" — say "killed" or "defeated."
- Never say "he died and was gathered to his people" — say "he died and joined his ancestors."
- Never say "gave up the ghost" — say "took his last breath" or "passed away."
- Never say "he smote them hip and thigh" — say "he struck them down completely."

Actions & Movement:
- Never say "pitched his tent" — say "set up camp" or "made his home."
- Never say "girded his loins" — say "prepared himself" or "got ready."
- Never say "rent his clothes" or "tore his garments" — say "tore his clothes in grief."
- Never say "fell upon his neck" — say "threw his arms around him" or "embraced him."
- Never say "set his face toward" — say "headed toward" or "made his way to."
- Never say "lifted up his eyes" — say "looked up" or "looked out."

Face & Favor:
- Never say "turn your face from me" or "hide your face from me" — say "stop looking on me with favor," "turn away from me," or "withdraw your favor" depending on context.
- Never say "set his face against" someone — say "turned against" or "opposed."
- Never say "the face of the earth" — say "the surface of the earth" or just "the earth."
- Never say "before your face" — say "in your presence" or "ahead of you."
- Never say "found favor in his eyes" — say "impressed him" or "earned his trust."
- Any time the original uses "face" as a metaphor, translate what it actually means in that moment — favor, opposition, presence, or direction — rather than keeping the literal word.

Fear of God:
- Never translate "fear God" or "fear the LORD" as literal terror. The biblical concept means deep reverence and wholehearted devotion.
- "Fear God" → "be wholeheartedly dedicated to God" or "deeply revere God."
- "The fear of the LORD" → "wholehearted dedication to the LORD" or "deep reverence for the LORD."
- "God-fearing" → "devoted to God" or "wholeheartedly dedicated to God."
- Choose the phrasing that best fits the context — sometimes "deeply revere" works better, sometimes "wholeheartedly dedicated to" works better.

NUMBERS & MEASUREMENTS:
- Always use numerals — write "14" not "fourteen," "40" not "forty," "969" not "nine hundred and sixty-nine."
- Keep all ages, years, and quantities as numerals throughout.
- Never write out "threescore and ten" — write "70."
- Never write out "forty days and forty nights" in words — write "40 days and 40 nights."
- Keep the KJV's original units of measurement — cubits, shekels, ephahs, etc. Do NOT convert to modern units like feet, pounds, or bushels.

MEANING & PRECISION:
- Modernize the language but keep the EXACT meaning. Do not soften, strengthen, or shift what the verse actually says. "Urge" and "force" are not the same. "Full" and "everything" are not the same. Precision matters.
- DO NOT OMIT any words, phrases, or clauses from the KJV. Every piece of content in the KJV verse must have a counterpart in your output. Do not compress, summarize, or skip phrases you consider redundant. If the KJV says "saying" at the end of a verse, include it. If the KJV says "so did he" or "by the hand of Moses," include those phrases. If the KJV ends a verse with "unto them," include it. Nothing gets dropped.
- DO NOT ADD words, ideas, or emphasis that are not in the original. Do not insert adjectives ("bronze" altar when KJV just says "altar"), materials ("olive" oil when KJV just says "oil"), titles ("the leader" when KJV does not say it), or explanatory phrases ("to dry," "you will die," "the first time," "at least," "already") that are not in the KJV. If it is not in the KJV, it must not be in your output.
- DO NOT NARROW OR BROADEN the scope of a statement. If the KJV says "that which toucheth," do not write "anyone who touches" (that narrows it to people). Write "whatever touches" to preserve the original scope.
- DO NOT ADD qualifiers or specifics the KJV does not include. If the KJV says "ye shall not make yourselves abominable with any creeping thing," do not add "by eating" — the KJV does not limit how.
- DO NOT REPLACE specific KJV terms with interpretive alternatives. "Nursing father" is not "nurse." "Soul" is not "appetite." "Princes" is not "officials." "Children" is not "descendants." "Sister" is not "kinswoman." "Breach" is not "broken bone." "Images" is not "incense altars." "At your own will" is not "in the proper way." Keep the KJV's word choices and only modernize the grammar around them.
- DO NOT CHANGE the grammatical number of pronouns. If the KJV says "he," do not write "they." If the KJV says "him," do not write "them." Preserve singular and plural exactly as the KJV has them. Do not modernize pronouns for gender neutrality.
- When the original repeats a word for emphasis (like "created" three times in one verse), preserve that repetition with the same word.
- When the original uses poetic contrasts (full/empty, light/darkness, life/death) or repeats imagery, preserve those patterns.

PROTECTED TERMS — Keep these words exactly. Do NOT replace them:
- "heaven" / "heavens" (do NOT change to "sky")
- "created" (do NOT change to "made" or "formed" when KJV says "created")
- "made" (keep as "made" when KJV uses it — do NOT change to "produced" or "formed")
- "God", "LORD", "Lord GOD", "the Almighty", "Christ", "Holy Spirit"
- "soul", "spirit" (do NOT change to "life" or "breath" unless context clearly means physical breath)
- "grace", "righteousness", "salvation", "covenant", "sin", "atonement", "glory", "faith", "mercy"
- "angel" / "angels" (do NOT change to "messenger" unless clearly human)
- "abomination" (do NOT change to "disgusting," "detestable," or similar — keep "abomination")
- "unicorn" (do NOT change to "wild ox" — keep "unicorn")
- "Ethiopian" (do NOT change to "Cushite" — keep "Ethiopian")
- "leprous" / "leprosy" / "plague of leprosy" / "fretting leprosy" (do NOT change to "disease," "skin condition," "mildew," or "contamination" — keep the KJV's exact leprosy terminology)
- "heave offering" (do NOT change to "contribution" — keep "heave offering")
- "high places" (do NOT change to "worship sites" — keep "high places")
- "water of separation" (do NOT change to "water of purification" — keep "water of separation")
- "fiery serpent" (do NOT change to "venomous snake" — keep "fiery serpent")
- "badgers' skins" (do NOT change to "fine leather" — keep "badgers' skins")
- "tabernacle of the congregation" (do NOT change to "tent of meeting" — keep the KJV's phrasing)
- "princes" (do NOT change to "officials" or "leaders" — keep "princes")
- "solemn assembly" (do NOT change to "closing celebration" — keep "solemn assembly")
- "firstfruits" (do NOT drop or change to "first bundle" — keep "firstfruits")
- "images" (do NOT change to "incense altars" or "idols" — keep "images")
- "estimation" / "thy estimation" (do NOT drop or change to "assess" / "value" — keep "estimation")
- "breach" (do NOT change to "broken bone" — keep "breach")
- "at your own will" (do NOT change to "in the proper way" — keep "at your own will")
- All proper names, place names, and people names exactly as written
- All animal, bird, insect, and creature names exactly as the KJV has them (do NOT substitute modern scientific or common names)
- All materials, objects, and specific nouns exactly as the KJV has them

ARCHAIC WORD REPLACEMENTS — ALWAYS apply these consistently:
- thee/thou/thy/thine → you/your/yours
- hath/hast → has/have
- doth/dost → does/do
- saith → says/said
- spake → spoke
- begat → became the father of
- unto → to
- thereof → of it
- wherefore → therefore / that is why
- verily → truly
- cometh → comes
- goeth → goes
- shalt/wilt → will
- whoso/whosoever → whoever
- brethren → brothers (or "brothers and sisters" when contextually appropriate)
- raiment → clothing
- behold / lo → look / see / pay attention (choose what fits naturally)
- hearken → listen
- abode → stayed / lived
- wroth → angry
- smote → struck
- nigh → near
- kindred → relatives / family
- victuals → food
- whence → where / from where
- thither → there
- hither → here
- yea → yes
- nay → no
- peradventure → perhaps / maybe
- firmament → expanse
- sepulchre → tomb

EXAMPLES — What good looks like:

BAD: And it came to pass that Abram went down into Egypt to sojourn there.
GOOD: So Abram traveled down to Egypt to live there for a while.

BAD: And he smote them hip and thigh with a great slaughter.
GOOD: He struck them down completely and defeated them.

BAD: And Leah conceived and bare a son.
GOOD: Leah became pregnant and gave birth to a son.

BAD: Threescore and ten years.
GOOD: 70 years.

BAD: He delivered mine enemies into mine hand.
GOOD: He gave me victory over my enemies.

BAD: And Adam knew Eve his wife.
GOOD: Adam had relations with his wife Eve.

BAD: Turn not thy face from me, O LORD.
GOOD: Don't withdraw your favor from me, LORD.

BAD: And the sons of God saw the daughters of men that they were fair, and they went in unto them.
GOOD: The sons of God noticed how beautiful the daughters of humans were, and they had relations with them.

BAD: The fear of the LORD is the beginning of wisdom.
GOOD: Wholehearted dedication to the LORD is the beginning of wisdom.

BAD: Noah was a just man, and one that feared God.
GOOD: Noah was a good man who was wholeheartedly dedicated to God.

BAD (changing pronoun number): "If he wash them not, then he shall bear his iniquity." → "If they do not wash, they will bear their guilt."
GOOD (keeping pronoun number): "If he wash them not, then he shall bear his iniquity." → "If he does not wash them, then he will bear his iniquity."

BAD (replacing KJV terms): "the plague of leprosy" → "a mildew-like contamination"
GOOD (keeping KJV terms): "the plague of leprosy" → "the plague of leprosy"

FORMATTING:
- Write FRESH sentences. Do NOT keep the old English phrasing.
- Remove "And" from the beginning of sentences when it is just a connector. But keep "And" when it carries real meaning or emphasis (e.g., "And God said" can become "Then God said" or "God said").
- Put quotation marks around spoken words. Use double quotes for direct speech, single quotes for speech within speech. Make sure every opening quotation mark has a matching closing quotation mark within the same verse or at the end of a multi-verse speech.
- Keep all proper names exactly as they are.
- One verse in = one verse out. Do NOT merge or split verses.
- Output ONLY a valid JSON array: [{"verse": 1, "text": "..."}, ...]
- Do NOT wrap the JSON in markdown code fences. Output raw JSON only.

FINAL CHECK: The goal of the Clear Text is to modernize the language of the KJV without changing what it says. Keep every noun, name, creature, and concept the KJV uses — only update the grammar, archaic vocabulary, and sentence structure. When in doubt, stay closer to the KJV rather than further from it. Ask: would a smart 16-year-old understand the grammar and vocabulary? If not, simplify the phrasing — but never swap out the KJV's specific words for different ones.`;

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

  return `Translate ${bookName} chapter ${chapter} into the Clear Text. Modernize the grammar and archaic vocabulary but keep all KJV nouns, creature names, and specific terms. Apply all translation rules (relations, conflict, face/favor, fear of God, numerals). Output a JSON array only.

${versesText}`;
}
