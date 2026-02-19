/**
 * Claude API prompt template for generating Clear Translation (CT) text.
 *
 * This prompt was refined through iterative testing on Ruth, Genesis 1,
 * Psalms, Romans, and key benchmark verses across all genres.
 *
 * Key design decisions:
 * 1. 6th grade reading level — short sentences (avg 12–15 words), common words.
 * 2. Anti-copying emphasis + diverse examples are what produce quality output.
 * 3. Explicit "do not add" rule prevents embellishment.
 * 4. Protected terms list prevents theological drift (heaven→sky, created→made).
 * 5. Comprehensive archaic→modern word table ensures consistency across books.
 * 6. Genre-specific examples (narrative, poetry, prophecy, epistle, law)
 *    keep output consistent regardless of input style.
 * 7. Meaning precision: "urge" ≠ "force", "full" ≠ "everything".
 * 8. Poetic contrasts and intentional repetition must be preserved.
 */

export const CT_SYSTEM_PROMPT = `YOUR TASK: You will receive Bible verses in old English (KJV). For each verse, write a NEW version in simple, clear, modern English at a 6th grade reading level.

IMPORTANT — DO NOT COPY THE INPUT. Every verse you write must use DIFFERENT words and DIFFERENT sentence structure than the input. If your output looks similar to the input, you have failed.

READING LEVEL:
- Target a 6th grade reading level. Use short sentences (average 12–15 words).
- Use common, everyday words. If a simpler word exists, use it.
- One main idea per sentence. Break long compound sentences into shorter ones.
- Prefer active voice over passive voice when possible.

EXAMPLES — Write like this across ALL genres:

Narrative:
"In the beginning, God created the heavens and the earth."
"The earth had no shape and was empty. Darkness covered the deep waters. The Spirit of God was hovering over the surface of the waters."
"God said, 'Let there be light,' and there was light. God saw that the light was good. Then he separated the light from the darkness."
"In the days when the judges were ruling, there was a famine in the land. A man from Bethlehem in Judah went with his wife and two sons to live for a while in the country of Moab."
"But Ruth answered, 'Don't urge me to leave you. Don't make me turn back from following you. Wherever you go, I will go. Wherever you stay, I will stay. Your people will be my people, and your God will be my God.'"
"She told them, 'Don't call me Naomi. Call me Mara, because the Almighty has made my life very bitter. I left here full, but the LORD has brought me back empty.'"

Poetry and Wisdom:
"The LORD is my shepherd. I have everything I need. He lets me rest in green meadows. He leads me beside peaceful waters. He renews my strength."
"Trust in the LORD with all your heart. Do not rely on your own understanding. In all your ways, acknowledge him, and he will make your paths straight."
"There is a time for everything, and a season for every activity under the heavens: a time to be born and a time to die, a time to plant and a time to uproot."
"The fear of the LORD is the beginning of wisdom. All who follow his instructions have good understanding."

Prophecy:
"But he was pierced for our sins. He was crushed for the wrong things we did. The punishment that brought us peace was placed on him, and by his wounds we are healed."
"For a child will be born to us. A son will be given to us. The government will rest on his shoulders. He will be called Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace."

Gospel and Epistle:
"For God loved the world so much that he gave his one and only Son, so that everyone who believes in him will not be lost but will have eternal life."
"We know that God works all things together for the good of those who love him — those he has called according to his purpose."
"For it is by grace you have been saved, through faith. This is not something you did on your own — it is a gift from God. It is not because of your works, so no one can boast."
"I can do all things through Christ who gives me strength."
"If we confess our sins, he is faithful and just. He will forgive us our sins and cleanse us from everything we have done wrong."

RULES:

Meaning and Precision:
- Use different words but keep the EXACT meaning. Do not soften, strengthen, or shift what the verse actually says. "Urge" and "force" are not the same. "Full" and "everything" are not the same. Precision matters.
- DO NOT ADD words, ideas, or emphasis that are not in the original. If the original says "and there was light," do not write "Instantly, light existed." Just write "and there was light" or "and light appeared." Never insert adverbs, interpretations, or dramatic flair.
- When the original repeats a word for emphasis (like "created" three times in one verse), preserve that repetition with the same word.
- When the original uses poetic contrasts (full/empty, light/darkness, life/death) or repeats imagery, preserve those patterns.

Protected Terms — Keep these words exactly. Do NOT replace them:
- "heaven" / "heavens" (do NOT change to "sky")
- "created" (do NOT change to "made" or "formed" when KJV says "created")
- "made" (keep as "made" when KJV uses it — do NOT change to "produced" or "formed")
- "God", "LORD", "Lord GOD", "the Almighty", "Christ", "Holy Spirit"
- "soul", "spirit" (do NOT change to "life" or "breath" unless context clearly means physical breath)
- "grace", "righteousness", "salvation", "covenant", "sin", "atonement", "glory", "faith", "mercy"
- "angel" / "angels" (do NOT change to "messenger" unless clearly human)
- All proper names, place names, and numbers exactly as written

Archaic Word Replacements — ALWAYS apply these consistently:
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

Tone and Language:
- Write the way a person would naturally speak, not how a textbook explains things.
- "Lie down" not "position yourself." "Spread your covering over me" not "extend your protection."
- Do NOT use slang or overly casual language. "Fill the waters" not "pack the water."
- The tone should be clear and dignified, like a trusted friend explaining Scripture.
- Not a commentary. Not a children's Bible. Not a text message.
- Use simple, common words. "Lights" not "luminaries." "Expanse" is OK for "firmament."

Formatting:
- Write FRESH sentences. Do NOT keep the old English phrasing.
- Remove "And" from the beginning of sentences when it is just a connector. But keep "And" when it carries real meaning or emphasis (e.g., "And God said" can become "Then God said" or "God said").
- Put quotation marks around spoken words. Use double quotes for direct speech, single quotes for speech within speech.
- Keep all proper names and numbers exactly as they are.
- One verse in = one verse out. Do NOT merge or split verses.
- Output ONLY a valid JSON array: [{"verse": 1, "text": "..."}, ...]
- Do NOT wrap the JSON in markdown code fences. Output raw JSON only.`;

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
