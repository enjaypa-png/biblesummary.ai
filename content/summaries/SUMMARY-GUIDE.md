# Bible Summary Generation Guide

This document defines how summaries are structured for all 66 books of the Bible. Summaries are a paid feature — they must be accurate, complete, and respectful of the source text.

## Voice Rules (All Books)

- Present tense throughout ("God creates..." not "God created...")
- Describe what happens or what is said — never interpret meaning
- No theology, devotional language, or application
- No "this chapter..." or "the author..." — just describe the content directly
- Name all major characters when they first appear
- Include key dialogue in paraphrase
- Comprehensive — nothing significant should be omitted from a sacred text
- Concise — every sentence should carry information
- KJV is the source text

## File Naming

Files are stored in `content/summaries/` with the format:

```
{order}-{slug}.md
```

Examples: `01-genesis.md`, `19-psalms.md`, `66-revelation.md`

## Five Summary Categories

### Category 1: CHAPTER-BY-CHAPTER (Narrative)

One summary per chapter. Where narrative flows across chapters, group them (e.g., "Chapters 18-19"). Each chapter/group gets a paragraph or two describing key events, characters, and dialogue in order.

| # | Book | Ch | Notes |
|---|------|----|-------|
| 1 | Genesis | 50 | DONE. Fix Ch 2 duplication. Groups work well (15-17, 18-19, etc.) |
| 2 | Exodus | 40 | Hybrid: Ch 1-24 narrative, Ch 25-31 tabernacle instructions (group by topic), Ch 32-34 narrative (golden calf), Ch 35-40 tabernacle construction (one section) |
| 6 | Joshua | 24 | Ch 13-21 are land allotments — group as one section |
| 7 | Judges | 21 | Each judge is a natural grouping. Group minor judges |
| 8 | Ruth | 4 | Short. Every chapter matters |
| 9 | 1 Samuel | 31 | Strong narrative throughout |
| 10 | 2 Samuel | 24 | David's reign |
| 11 | 1 Kings | 22 | Solomon through Elijah |
| 12 | 2 Kings | 25 | Elisha through exile |
| 13 | 1 Chronicles | 29 | Ch 1-9 are genealogies (group as one). Ch 10-29 narrative |
| 14 | 2 Chronicles | 36 | Temple and kings of Judah |
| 15 | Ezra | 10 | Return from exile |
| 16 | Nehemiah | 13 | Rebuilding the wall |
| 17 | Esther | 10 | Tight narrative. Every chapter matters |
| 27 | Daniel | 12 | Hybrid: Ch 1-6 narrative (lion's den, fiery furnace). Ch 7-12 visions — use section approach |
| 32 | Jonah | 4 | Short narrative |
| 40 | Matthew | 28 | Group where needed (Sermon on the Mount spans 5-7) |
| 41 | Mark | 16 | Chapter-by-chapter |
| 42 | Luke | 24 | Chapter-by-chapter |
| 43 | John | 21 | Chapter-by-chapter |
| 44 | Acts | 28 | Chapter-by-chapter |

### Category 2: SECTION-BY-SECTION (Prophetic)

Group chapters by oracle, audience, or theme. Prophetic chapter breaks are often arbitrary. Name sections descriptively. Within each section, summarize key messages, warnings, imagery, and promises.

| # | Book | Ch | Sections |
|---|------|----|----------|
| 23 | Isaiah | 66 | 1-12: Warnings to Judah. 13-23: Oracles against nations. 24-27: Judgment and restoration. 28-35: Woes and promises. 36-39: Historical narrative (chapter-by-chapter). 40-55: Comfort and the servant. 56-66: Future glory. |
| 24 | Jeremiah | 52 | 1-6: Call and early warnings. 7-20: Temple sermon and laments. 21-29: Messages to kings/prophets. 30-33: Book of consolation. 34-45: Narrative of Jerusalem's fall. 46-51: Oracles against nations. 52: Historical appendix. |
| 25 | Lamentations | 5 | 5 poems — one per chapter. Describe content and tone. |
| 26 | Ezekiel | 48 | 1-3: Call and vision. 4-24: Judgment on Jerusalem. 25-32: Oracles against nations. 33-39: Restoration. 40-48: New temple vision. |
| 28 | Hosea | 14 | 1-3: Hosea's marriage to Gomer. 4-10: Charges against Israel. 11-14: Judgment and restoration. |
| 29 | Joel | 3 | 1: Locust plague. 2: Call to repentance / Day of the Lord. 3: Judgment of nations. |
| 30 | Amos | 9 | 1-2: Oracles against nations. 3-6: Three sermons. 7-9: Five visions. |
| 31 | Obadiah | 1 | Single chapter. Judgment on Edom. |
| 33 | Micah | 7 | 1-3: Judgment. 4-5: Restoration. 6-7: God's case and hope. |
| 34 | Nahum | 3 | One section per chapter. Judgment on Nineveh. |
| 35 | Habakkuk | 3 | 1: Complaint. 2: God's answer. 3: Prayer. |
| 36 | Zephaniah | 3 | 1: Day of the Lord. 2: Judgment on nations. 3: Judgment and restoration. |
| 37 | Haggai | 2 | 1: Call to rebuild. 2: Promises about the temple. |
| 38 | Zechariah | 14 | 1-8: Night visions and messages. 9-14: Two oracles about the future. |
| 39 | Malachi | 4 | 1-2: Charges against priests/people. 3-4: Coming judgment and messenger. |
| 66 | Revelation | 22 | DONE. 1-3: Letters. 4-5: Throne room. 6-7: Seals. 8-11: Trumpets. 12-14: Dragon/beasts/Lamb. 15-16: Bowls. 17-18: Babylon. 19-20: Final battle. 21-22: New heaven/earth. |

### Category 3: THEMATIC OVERVIEW (Poetry & Wisdom)

No chapter-by-chapter summaries. Provide book-level overview: what the book is about, its structure, major themes, key passages, and tone. For longer books, break into thematic sections.

| # | Book | Ch | Approach |
|---|------|----|----------|
| 18 | Job | 42 | Hybrid. Ch 1-2: Narrative. Ch 3-31: Dialogue cycles by speaker. Ch 32-37: Elihu (one section). Ch 38-41: God's answer (one section). Ch 42: Narrative conclusion. |
| 19 | Psalms | 150 | Five traditional books: I (1-41), II (42-72), III (73-89), IV (90-106), V (107-150). Describe dominant themes per book. Name key psalms with one-line descriptions. |
| 20 | Proverbs | 31 | 1-9: Father's speeches on wisdom. 10-22:16: Solomon's proverbs (topics, not individual listing). 22:17-24:34: Sayings of the wise. 25-29: Hezekiah's collection. 30: Agur. 31: Lemuel + virtuous woman. |
| 21 | Ecclesiastes | 12 | Thematic overview. Cycles through futility, wisdom, pleasure, toil, death, time. Note the conclusion. |
| 22 | Song of Solomon | 8 | Thematic overview. Love poem/dialogue. Describe structure (bride, groom, chorus). |

### Category 4: LAW & INSTRUCTION (Grouped by Topic)

Group by topic, not chapter. Name what each section covers without exhaustively listing every rule. Specific enough to know what's there, but not a legal index.

| # | Book | Ch | Groupings |
|---|------|----|-----------|
| 3 | Leviticus | 27 | 1-7: Types of offerings. 8-10: Priest ordination + Nadab/Abihu (narrative). 11-15: Clean/unclean. 16: Day of Atonement. 17-20: Holiness code. 21-22: Priest rules. 23: Festivals. 24-25: Sabbath/Jubilee. 26-27: Blessings/curses/vows. |
| 4 | Numbers | 36 | 1-4: Census/camp. 5-6: Laws/Nazirite vow. 7-10: Tabernacle dedication/departure. 11-14: Complaints/spies/rebellion (narrative). 15-19: Laws/Korah (narrative). 20-21: Miriam/water/serpent (narrative). 22-24: Balaam (narrative). 25: Sin at Peor. 26: Second census. 27-30: Laws/Joshua. 31-36: Battles/borders/cities of refuge. |
| 5 | Deuteronomy | 34 | 1-4: Wilderness review. 5-11: Covenant/Ten Commandments restated. 12-26: Laws for the land (group by topic). 27-28: Blessings/curses. 29-30: Covenant renewal. 31-34: Moses' final words/song/death (narrative). |

### Category 5: EPISTLES (Section-by-Section)

Group by topic/argument, not chapter. Letters have flowing arguments where chapter breaks don't mean topic changes.

| # | Book | Ch | Sections |
|---|------|----|----------|
| 45 | Romans | 16 | 1-3: All have sinned. 3-5: Justification by faith. 6-8: Life in the Spirit. 9-11: God's plan for Israel. 12-15: Practical instructions. 16: Greetings. |
| 46 | 1 Corinthians | 16 | 1-4: Divisions. 5-6: Immorality/lawsuits. 7: Marriage. 8-10: Food/idols. 11: Worship. 12-14: Spiritual gifts. 15: Resurrection. 16: Final instructions. |
| 47 | 2 Corinthians | 13 | 1-7: Defense/reconciliation. 8-9: Collection for Jerusalem. 10-13: Authority defense. |
| 48 | Galatians | 6 | 1-2: Paul's authority. 3-4: Faith vs. law. 5-6: Life by the Spirit. |
| 49 | Ephesians | 6 | 1-3: God's plan/the church. 4-6: Living as God's people. |
| 50 | Philippians | 4 | One section per chapter. Joy, humility, pressing forward, contentment. |
| 51 | Colossians | 4 | 1-2: Supremacy of Christ. 3-4: Christian living. |
| 52 | 1 Thessalonians | 5 | 1-3: Thanksgiving/relationship. 4-5: Instructions/the Lord's coming. |
| 53 | 2 Thessalonians | 3 | 1: Encouragement. 2: Day of the Lord. 3: Warning against idleness. |
| 54 | 1 Timothy | 6 | 1: False teachers. 2-3: Worship/leaders. 4-6: Instructions for Timothy. |
| 55 | 2 Timothy | 4 | One section per chapter. Guard gospel, endure, last days, final charge. |
| 56 | Titus | 3 | 1: Elders. 2: Sound doctrine. 3: Doing good. |
| 57 | Philemon | 1 | Single chapter. Paul appeals for a runaway slave. |
| 58 | Hebrews | 13 | 1-2: Christ > angels. 3-4: Christ > Moses / God's rest. 5-7: Christ the high priest. 8-10: New covenant/sacrifice. 11: Faith hall of fame. 12-13: Endurance/final instructions. |
| 59 | James | 5 | One per chapter. Trials, favoritism, faith/works, tongue, patience. |
| 60 | 1 Peter | 5 | 1-2: God's people. 3-4: Suffering for good. 5: Elders. |
| 61 | 2 Peter | 3 | 1: Growing in faith. 2: False teachers. 3: Day of the Lord. |
| 62 | 1 John | 5 | 1-2: Walking in light. 3-4: Love/discernment. 5: Faith in the Son. |
| 63 | 2 John | 1 | Single chapter. Warning against deceivers. |
| 64 | 3 John | 1 | Single chapter. Encouragement to Gaius. |
| 65 | Jude | 1 | Single chapter. Warning against ungodly people. |

## Generation Status

| Status | Books |
|--------|-------|
| Done | Genesis (needs Ch 2 fix), Revelation |
| In Progress | — |
| Not Started | Remaining 64 books |

## Prompt Template

When generating summaries on an external AI platform, use this system prompt:

> You are summarizing books of the Bible (KJV) for a reading app. Your summaries will be read by people who want to understand what each book contains before or while reading it.
>
> Rules:
> - Write in present tense
> - Describe what happens or what is said — never interpret meaning
> - No theology, devotional language, or application
> - No "this chapter..." or "the author..." — just describe the content directly
> - Name all major characters when they first appear
> - Include key dialogue in paraphrase
> - Be comprehensive — this is a sacred text and nothing significant should be omitted
> - But be concise — every sentence should carry information
> - Use natural groupings where chapter breaks are arbitrary
>
> Format for this book: [insert the specific approach from the category above]
>
> Reference example: [paste a finished summary as the style guide]
