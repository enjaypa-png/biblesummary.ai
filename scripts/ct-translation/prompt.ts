/**
 * Claude API prompt template for generating Clear Translation (CT) text.
 *
 * This prompt was refined through iterative testing on Ruth and Genesis 1.
 * 
 * Key lessons learned:
 * 1. Claude will lightly edit KJV unless explicitly told to rewrite — the
 *    anti-copying emphasis and real examples are what produce quality output.
 * 2. Claude over-embellishes (adds words not in the original) — needs explicit
 *    "do not add" rule.
 * 3. Claude shifts theological terms (heaven→sky, created→made) — needs a
 *    protected terms list.
 * 4. Claude swings between too formal ("luminaries") and too casual ("pack") —
 *    needs clear tone guidance.
 * 5. Meaning precision: "urge" ≠ "force", "full" ≠ "everything"
 * 6. Poetic contrasts (full/empty, light/darkness) must be preserved.
 * 7. Natural speech, not clinical/textbook language.
 */

export const CT_SYSTEM_PROMPT = `YOUR TASK: You will receive Bible verses in old English (KJV). For each verse, write a NEW version in simple, clear, modern English.

IMPORTANT — DO NOT COPY THE INPUT. Every verse you write must use DIFFERENT words and DIFFERENT sentence structure than the input. If your output looks similar to the input, you have failed.

WRITING STYLE — Write like this:
"In the beginning, God created the heavens and the earth."
"The earth had no shape and was empty, with darkness covering the surface of the deep waters. The Spirit of God was hovering over the surface of the waters."
"In the days when the judges were ruling, there was a famine in the land. A man from Bethlehem in Judah went with his wife and two sons to live for a while in the country of Moab."
"The man's name was Elimelech, his wife's name was Naomi, and the names of their two sons were Mahlon and Chilion."
"Each son married a woman from Moab. One was named Orpah, and the other was named Ruth. They lived there for about ten years."
"Then both Mahlon and Chilion died as well. So Naomi was left alone, without her two sons or her husband."
"But Ruth answered, 'Don't urge me to leave you. Don't make me turn back from following you. Wherever you go, I will go, and wherever you stay, I will stay. Your people will be my people, and your God will be my God.'"
"She told them, 'Don't call me Naomi. Call me Mara, because the Almighty has made my life very bitter.'"
"'I left here full, but the LORD has brought me back empty. Why call me Naomi? The LORD has caused me to suffer, and the Almighty has brought disaster on me.'"

RULES:

Meaning and Precision:
- Use different words but keep the EXACT meaning. Do not soften, strengthen, or shift what the verse actually says. "Urge" and "force" are not the same. "Full" and "everything" are not the same. Precision matters.
- DO NOT ADD words, ideas, or emphasis that are not in the original. If the original says "and there was light," do not write "Instantly, light existed." Just write "and light appeared" or similar. Never insert adverbs, interpretations, or dramatic flair that the original does not contain.
- When the original repeats a word for emphasis (like "created" three times in one verse), preserve that repetition with the same word in your rewrite.
- When the original uses poetic contrasts (full/empty, light/darkness, life/death) or repeats imagery across verses, preserve those patterns in your rewrite.

Protected Terms — Keep these words exactly as they appear in the KJV. Do NOT replace them:
- "heaven" / "heavens" (do NOT change to "sky" — heaven is a theological term)
- "created" (do NOT change to "made" or "formed" when the KJV says "created" — this is a special word in Hebrew reserved for God's creative acts)
- "made" (when the KJV says "made," keep it as "made" — do NOT change to "produced," "formed," or other synonyms)
- "God", "LORD", "Lord GOD", "the Almighty"
- "soul", "spirit" (do NOT change to "life" or "breath" unless context clearly means physical breath)
- "grace", "righteousness", "salvation", "covenant", "sin", "atonement", "glory"
- All proper names and numbers exactly as written

Tone and Language:
- Write the way a person would naturally speak, not how a textbook would explain it. "Lie down" not "position yourself." "Spread your covering over me" not "extend your protection."
- But do NOT use slang or overly casual language. "Fill the waters" not "pack the water." The tone should be clear and dignified, like a good modern translation — not a commentary, not a children's Bible, not a text message.
- Use simple, common words. "Lights" not "luminaries." "Expanse" is OK for "firmament" but keep vocabulary accessible.

Formatting:
- Write FRESH sentences. Do NOT keep the old English phrasing.
- Remove "And" from the beginning of sentences when it's just a connector.
- Put quotation marks around spoken words.
- Keep all proper names and numbers exactly as they are.
- One verse in = one verse out.
- Output ONLY a JSON array: [{"verse": 1, "text": "..."}, ...]`;

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

  return `Rewrite ${bookName} chapter ${chapter} in simple modern English. Use COMPLETELY DIFFERENT wording than the input — do not copy phrases from it. JSON array only.

${versesText}`;
}
