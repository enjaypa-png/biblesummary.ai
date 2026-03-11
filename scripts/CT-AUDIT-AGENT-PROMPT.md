# AI Agent Prompt: Clear Bible Translation (CT) Modernization Audit Script

## Your Task

Create a script (TypeScript/Node or Python) that audits the existing Clear Bible Translation (CT) against the King James Version (KJV). The script will identify verses that still contain archaic language, obscure measurements, or other wording that could confuse modern readers — and propose fixes. **Meaning must never change.** If the AI is unsure whether a proposed change alters meaning, it must flag the verse for human review instead of applying it.

---

## Data Model

- **KJV verses** and **CT verses** are available in one of two ways (adapt to what you can access):
  1. **Supabase database**: `verses` table with columns `book_id`, `chapter`, `verse`, `translation` ('kjv' | 'ct'), `text`
  2. **Local JSON files**: `data/translations/ct/{book-slug}/{chapter}.json` with structure `{ verses: [{ verse, kjv, ct }], book_name }`

- The script should process book-by-book, chapter-by-chapter. Support CLI args: `--book <slug>`, `--chapter <n>`, optional `--apply` to write fixes.

---

## Output Categories

Each verse must be classified into exactly one of three categories:

| Category | Meaning | Action |
|----------|---------|--------|
| **PASS** | CT is acceptable; no change needed | Skip |
| **FAIL** | CT has a problem; AI proposes a fix that preserves meaning | Output the fix; with `--apply`, write it |
| **FLAG** | AI is unsure whether a change would preserve meaning | Write to escalation file for human review. Do NOT apply. |

**FLAG is mandatory when:** The AI is not confident that a suggested modernization preserves the exact meaning of the KJV. The agent must say: *"I'm not sure here; something might not look right"* (or equivalent) and escalate.

---

## Escalation File

All FLAG verses must be written to a separate file, e.g. `data/translations/ct-audit-escalated-human.jsonl`, with one JSON object per line:

```json
{"ref": "Genesis 1:1", "kjv": "...", "ct": "...", "issue": "I'm not sure here; something might not look right. Possible archaic phrasing but unclear if modernization would change meaning.", "suggested_fix": "optional suggestion or null"}
```

The human reviewer will decide whether to apply, modify, or reject.

---

## Audit Rules (What to Look For)

### 1. MEANING LOCK (ABSOLUTE)

- **No meaning may change.** Not even slightly.
- Preserve intent, emotional weight, theological force, and covenant meaning.
- If the AI cannot propose a fix without risking a meaning shift → **FLAG**, do not FAIL with a fix.

### 2. Archaic or Obscure Language

Identify and propose fixes for:

- Remaining archaic words: thee/thou/thy, hath/hast, doth/dost, saith, spake, begat, behold/lo, verily, whosoever, brethren, raiment, wroth, nigh, kindred, victuals, peradventure, sepulchre, etc.
- Outdated idioms that a 10th-grade reader would not understand on first read
- Stilted or unnatural sentence structure

### 3. Measurements and Units

- The current CT often keeps KJV units (cubits, shekels, talents, ephahs). Options:
  - **Option A:** Keep the unit but add a brief parenthetical, e.g. "five cubits (about 7½ feet)" — only if the conversion is unambiguous and does not alter meaning.
  - **Option B:** Keep units as-is if conversion might imply precision the text does not support.
- **If the AI is unsure** whether adding a conversion changes meaning or emphasis → **FLAG**.

### 4. Protected Terms (Never Replace)

These must remain exactly as written: LORD, God, Lord GOD, the Almighty, Christ, Holy Spirit, heaven/heavens, soul, spirit, sin, atonement, glory, salvation, covenant, faith, mercy, repent/repentance, angel/angels. "Fear of the LORD" / "fear God" must keep the word "fear" — never "revere" or "respect." All proper names and place names stay as in the KJV.

### 5. Never Add, Omit, or Interpret

- Do not add explanations, comparisons, or interpretive content not in the KJV.
- Do not omit phrases or clauses.
- Do not sanitize graphic or vivid content.
- Do not neuter strong metaphors (e.g. "thorn in the flesh" must not become "recurring problem").

---

## System Prompt for the Audit Model

Use a system prompt along these lines (adapt tone and detail as needed):

```
You are auditing the Clear Bible Translation (CT) against the King James Version (KJV).

Your job: identify verses where the CT still uses archaic language, obscure measurements, or confusing wording that a modern 10th-grade reader would struggle with. Propose fixes that preserve meaning exactly.

RULES:
1. MEANING MUST NEVER CHANGE. If you cannot confidently propose a fix without risking a meaning shift, mark the verse as FLAG and write "I'm not sure here; something might not look right" — do NOT propose a fix.
2. Protected terms (LORD, God, soul, spirit, sin, atonement, glory, salvation, covenant, fear of the LORD, etc.) must stay exactly as written.
3. Do not add, omit, or interpret. Only reword for clarity.
4. Output a JSON array with entries for FAIL (with proposed fix) and FLAG (with reason). Omit PASS verses.
5. When in doubt about meaning, choose FLAG over FAIL.
```

---

## Output Format

### Per-Chapter Response

The audit model should return a JSON array. Suggested schema:

```json
[
  {"status": "FAIL", "ref": "Genesis 1:1", "issue": "archaic 'firmament'", "kjv": "...", "ct": "...", "fix": "..."},
  {"status": "FLAG", "ref": "Genesis 2:5", "issue": "I'm not sure here; something might not look right. Possible unit conversion.", "kjv": "...", "ct": "..."}
]
```

- `status`: "FAIL" or "FLAG"
- `ref`: "Book Chapter:Verse"
- `issue`: one-sentence description
- `kjv`, `ct`: original texts
- `fix`: proposed CT text (only for FAIL; omit or null for FLAG)

### Logging

- Print a summary per chapter: `PASS: n, FAIL: n, FLAG: n`
- At end of run: total verses, total FAIL, total FLAG, path to escalation file

---

## Technical Structure (Reference Implementation)

A reference script (`ct-audit-openai.ts`) does the following:

1. Parse CLI: `--book`, `--chapter`, `--apply`
2. Load KJV + CT for each chapter (from Supabase or local JSON)
3. Build a prompt: for each verse, `Book Chapter:Verse`, `KJV: ...`, `CT: ...`
4. Call OpenAI API (`gpt-4o`) with temperature 0, system prompt + user prompt
5. Parse JSON array from response (handle markdown code blocks if present)
6. For each FAIL: optionally apply fix to JSON/DB with `--apply`
7. For each FLAG: append to escalation file

**Cross-provider note:** The CT was originally generated by Claude (Anthropic). Using a different provider (e.g. OpenAI GPT-4o) for audit ensures no model grades its own work. Prefer that pattern.

---

## Summary Checklist for the Script

- [ ] Processes KJV + CT verse-by-verse (or in small batches)
- [ ] Outputs PASS / FAIL (with fix) / FLAG
- [ ] FLAG when AI is unsure about meaning preservation
- [ ] Writes FLAG verses to `ct-audit-escalated-human.jsonl` (or equivalent)
- [ ] Supports `--book`, `--chapter`, `--apply`
- [ ] Uses a model from a different provider than the one that generated the CT (e.g. GPT-4o if CT was Claude-generated)
- [ ] Enforces: no meaning change, protected terms preserved, no add/omit/interpret
- [ ] Targets: archaic language, measurements, obscure phrasing — 10th-grade readability
