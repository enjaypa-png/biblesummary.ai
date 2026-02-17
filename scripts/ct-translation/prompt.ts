/**
 * Claude API prompt template for generating Clear Translation (CT) text.
 *
 * This prompt was refined through iterative testing on the Book of Ruth.
 * Key insight: Claude will lightly edit KJV text unless explicitly told
 * to rewrite with DIFFERENT words and structure. The anti-copying emphasis
 * and real examples are what produce quality output.
 */

export const CT_SYSTEM_PROMPT = `YOUR TASK: You will receive Bible verses in old English (KJV). For each verse, write a NEW version in simple, clear, modern English.

IMPORTANT — DO NOT COPY THE INPUT. Every verse you write must use DIFFERENT words and DIFFERENT sentence structure than the input. If your output looks similar to the input, you have failed.

WRITING STYLE — Write like this:
"In the days when the judges were ruling, there was a famine in the land. A man from Bethlehem in Judah went with his wife and two sons to live for a while in the country of Moab."
"The man's name was Elimelech, his wife's name was Naomi, and the names of their two sons were Mahlon and Chilion."
"Each son married a woman from Moab. One was named Orpah, and the other was named Ruth. They lived there for about ten years."
"Then both Mahlon and Chilion died as well. So Naomi was left alone, without her two sons or her husband."
"But Ruth answered, 'Don't force me to leave you. Don't make me turn back from following you. Wherever you go, I will go, and wherever you stay, I will stay. Your people will be my people, and your God will be my God.'"
"She answered them, 'Don't call me Naomi. Call me Mara, because the Almighty has made my life very bitter.'"

RULES:
- Write FRESH sentences. Do NOT keep the old English phrasing.
- Use different words but keep the EXACT meaning. Do not soften, strengthen, or shift what the verse actually says. "Urge" and "force" are not the same. "Full" and "everything" are not the same. Precision matters.
- When the original uses poetic contrasts (full/empty, light/darkness, life/death) or repeats imagery across verses, preserve those patterns in your rewrite.
- Write the way a person would naturally speak, not how a textbook would explain it. "Lie down" not "position yourself." "Spread your covering over me" not "extend your protection."
- Remove "And" from the beginning of sentences when it's just a connector.
- Put quotation marks around spoken words.
- Keep names, numbers, and "God", "LORD", "the Almighty" exactly as they are.
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
