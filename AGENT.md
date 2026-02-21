# AGENT.md -- Contributor and AI Agent Guidelines

This file defines how to work in this codebase without breaking things. Read it before making changes.

## Project Philosophy

- **Accuracy over speed.** A correct, clean change is better than a fast, sloppy one.
- **Reading is the primary experience.** Every decision should serve someone reading the Bible on their phone. If a change makes reading worse, it is wrong.
- **No speculative features.** Do not add features, toggles, settings, or abstractions that were not explicitly requested. Do not build for hypothetical future requirements.
- **Minimal intervention.** Fix what was asked. Do not refactor surrounding code, add comments to code you did not change, or "improve" things that are not broken.

## UX Rules

### The reading flow is sacred

The Bible text on `/bible/[book]/[chapter]` is the core of the app. Do not change:

- Verse text rendering or formatting
- Verse number positioning or font
- Line height, letter spacing, or word spacing
- The flow of inline text (verses render as continuous inline text, not as block elements)
- Page layout or max-width constraints

The app supports two translations: **Clear Text (CT)** and **King James Version (KJV)**. CT is the default. The CT is currently **under audit** to ensure it accurately tells the same story as the KJV. The user's translation preference is stored in localStorage via `ReadingSettingsContext`. When the user toggles translations, `ChapterReaderClient` re-fetches verses from Supabase filtered by the `translation` column. CT shows CT. KJV shows KJV. There is no fallback or mixing between translations.

Changes to `ChapterReaderClient.tsx` require extra care. This file handles translation switching, notes, explanations, audio sync, sharing, verse highlighting, and the action bar. Test all of these flows after any edit.

### Notes interaction model

- Notes are created and first edited **from within the verse context** (inside the chapter reader).
- The Notes page (`/notes`) supports two interactions:
  - **Tap note body** -- expands the note in place for reading and editing (textarea, save, cancel, delete).
  - **Tap "Go to verse"** -- navigates to the Bible reader at that verse. This is the only navigation trigger.
- Expanded notes take ~1/4 to 1/5 of the viewport.

### Visual consistency

- The accent color is `var(--accent)` (defined in `app/globals.css` as `#7c5cfc` light / `#9b82fc` dark). Use this for all accent UI -- buttons, active states, links, verse numbers. Additional accent variables: `--accent-hover` (`#5b3fd4`), `--accent-light` (`#f0edff`), `--accent-border` (`#d9d0ff`).
- The app uses warm neutrals: off-white background (`#faf9f7`), warm text (`#2a2520`), warm gray secondary (`#8a8580`), warm borders (`#e8e5e0`). Do not introduce harsh blacks or cool grays.
- Verse numbers use the `.verse-number` CSS class. Their color comes from `var(--verse-num)` in globals.css. Do not override this with inline styles.
- Theme support covers four modes: light, sepia, gray, dark. Changes must work across all four.

## Feature Rules

### Notes

- Notes are stored per user in the `notes` table (Supabase, RLS enforced).
- A user sees a purple "Note" pill indicator inline with any verse that has a note.
- Tapping the indicator opens the note editor in verse context.
- Notes can be created from the chapter reader and edited from both the chapter reader and the Notes list.
- The Notes list supports expand-in-place editing and "Go to verse" navigation (see interaction model above).

### Explanations

- AI explanations come from `POST /api/explain-verse`.
- The API checks the `explanations` table cache first, then calls OpenAI GPT-4o-mini.
- Explanations are also cached client-side in a Zustand store (`verseStore.ts`).
- The system prompt enforces: 2-4 sentences, plain English, no theology, no preaching.
- Do not change the system prompt without explicit approval.

### Clear Text (CT)

- The CT modernizes the KJV's grammar and archaic vocabulary so modern readers can understand it. It does NOT change what the KJV says — every KJV noun, name, creature, material, and theological term stays exactly as-is. Only the sentence structure and old-English words get updated.
- **Audit status:** The CT is currently being audited book-by-book against the KJV. User-facing labels call it "Clear Text" and note "Under Review."
- The master prompt and style rules live in `scripts/ct-translation/prompt.ts` and `scripts/ct-translation/STYLE-GUIDE.md`. Do not change these without explicit approval.
- **Core audit rule:** Modernize ONLY grammar and archaic vocabulary. Never change nouns, names, creatures, materials, places, or theological terms.
- CT verses are stored in the `verses` table with `translation='ct'`. KJV verses have `translation='kjv'`.
- The `ct:audit` script (`scripts/ct-audit.ts`) runs an automated audit of any book — fetches CT and KJV from Supabase, sends them to Claude for comparison, and outputs a Markdown table of failures with corrected text. Use `--apply` to write fixes directly to Supabase.
- The `ct:edit` script (`scripts/ct-edit.ts`) is for manual verse fixes. Add corrections to the `FIXES` array and run the script.
- The `ct:review` script (`scripts/ct-review.ts`) generates a side-by-side HTML report of ~100 key verses for quality review.

### Translation Toggle

- The user's translation preference is stored in `ReadingSettingsContext` as `settings.translation` (type: `"ct" | "kjv"`, default: `"ct"`).
- The toggle appears in `ReadingSettingsPanel.tsx` at the top of the Aa settings panel.
- `BibleIndex.tsx` displays the current translation name in the header (e.g., "Clear Text" or "King James Version").
- `ChapterReaderClient.tsx` re-fetches verses from Supabase when the translation changes. It uses `displayVerses` state (not the raw `verses` prop) for rendering.
- The server-side page (`page.tsx`) defaults to `translation='ct'` for initial load.
- Share text includes the current translation name.

### Audio

- Audio is verse-by-verse TTS via ElevenLabs (`POST /api/tts`).
- `AudioPlayerContext` manages playback state and sequential verse fetching.
- `InlineAudioPlayer` shows controls inside the chapter reader.
- `MiniPlayer` shows a floating bar when audio plays outside the chapter page.
- Audio state must remain consistent across page navigations.

### Bookmarks

- One bookmark per user. Creating a new bookmark replaces the old one.
- Bookmarks are manual and intentional — the user taps Bookmark in the action bar.
- Tapping Bookmark on an already-bookmarked verse removes it (toggle behavior).
- Bookmark indicator is a purple pill with icon + "Saved" text, matching the Note indicator style.
- Bookmarks are stored in Supabase (`bookmarks` table, `UNIQUE(user_id)`).
- The BibleIndex shows a "Your Bookmark" card separately from the automatic reading position.

### Reading Position (Automatic)

- Reading position is tracked automatically via localStorage — not a bookmark.
- Updates when a chapter loads (verse 1) and when the user taps any verse.
- The BibleIndex shows a "Continue Reading" card from this data.
- This is invisible to the user — no action required to save their position.

### Highlights

- Highlights are stored per user in the `highlights` table (Supabase, RLS enforced).
- Users select from 5 colors: yellow, orange, green, pink, blue (defined in `lib/highlightColors.ts`).
- Color picker appears inline in the chapter reader when the user taps Highlight in the action bar.
- Highlighted verses display with a theme-aware transparent background in the selected color.
- The Highlights page (`/highlights`) lists all highlights organized by book with color chips, verse text preview, and "Go to verse" navigation.

### Summaries (Paid Feature)

- Pre-written book-level summaries for each book of the Bible, stored in `content/summaries/` and seeded to Supabase.
- See `content/summaries/SUMMARY-GUIDE.md` for the full generation plan.
- 5 format categories: chapter-by-chapter (narrative), section-by-section (prophetic), thematic overview (poetry/wisdom), grouped by topic (law), section-by-section (epistles).
- "Book Summary" button in the verse action bar opens the summary for the current book. Access is gated by `user_has_summary_access` (purchases). Respectful paywall shown when user lacks access.
- Summaries tab in bottom navigation shows a library of books with available summaries. Tapping a book opens its summary view.

### Reading Progress

- Reading progress is tracked per user in the `reading_progress` table (Supabase, RLS enforced).
- Tracks last verse read and completion status per chapter.

### Purchases

- One-time payments via Stripe, stored in the `purchases` table (Supabase, RLS enforced).
- Supports two purchase types: `single` (one book) and `lifetime` (all content).
- Only the service role can insert purchase records; users can view their own.

### Placeholder Features

The Search page (`/search/page.tsx`) is a "Coming Soon" placeholder. Do not add partial search functionality.

## Code Discipline

### What not to change without approval

- `app/globals.css` -- CSS variables, verse-number styling, theme definitions
- `contexts/ReadingSettingsContext.tsx` -- theme color definitions, translation types
- `scripts/ct-translation/prompt.ts` -- CT generation system prompt and protected terms
- `scripts/ct-translation/STYLE-GUIDE.md` -- CT tone rules and style examples
- `supabase/migrations/` -- database schema (changes here require migration planning)
- The system prompt in `app/api/explain-verse/route.ts`
- Authentication flow in `AuthGate.tsx`, `login/page.tsx`, `signup/page.tsx`

### How the theme system works

There are two layered theme systems:

1. **CSS variables** in `globals.css` (`--accent`, `--background`, `--verse-num`, etc.) -- used by components that don't need per-theme awareness
2. **`themeStyles` object** in `ReadingSettingsContext.tsx` -- used by the chapter reader for fine-grained control over background, text, secondary, border, and card colors per theme mode

The user's selected theme is stored in localStorage and applied via the `ReadingSettingsContext`. It is independent of the OS dark mode setting.

### PR structure

- One concern per PR. Do not bundle unrelated changes.
- Commit messages should describe what changed and why.
- Run `npm run build` before pushing. The build must pass.
- Test across all four theme modes (light, sepia, gray, dark) when changing UI.
- Test note creation, explanation loading, and audio playback when changing `ChapterReaderClient.tsx`.

## Database Reality vs. Migration Files

**CRITICAL: The migration files do NOT fully match the live Supabase database.** Always verify against the live database before making assumptions.

### Live database (11 tables)

`bookmarks`, `books`, `explanations`, `highlights`, `notes`, `purchases`, `reading_progress`, `subscriptions`, `summaries`, `verse_explanations`, `verses`

The `verses` table contains ~62,000 rows: ~31,000 KJV and ~31,000 CT, distinguished by the `translation` column (`'kjv'` or `'ct'`).

### Live functions (9)

`insert_verse_explanation`, `is_subscription_active`, `lookup_book_ids`, `rls_auto_enable`, `set_updated_at`, `update_updated_at_column`, `user_has_explain_access`, `user_has_summary_access`

### Tables in migration files but NOT in live database

These were planned but never created in production:

| Table | Migration | Purpose |
|-------|-----------|---------|
| `stripe_customers` | 006 | Maps Supabase user IDs to Stripe customer IDs |
| `user_profiles` | 005 | Onboarding and segmentation data |
| `user_sessions` | 007 | Session tracking for abuse detection |
| `summary_access_log` | 007 | Rate limiting for summary views |
| `account_deletions` | 009 | Deletion audit trail |

### Functions in migration files but NOT in live database

| Function | Migration | Why missing |
|----------|-----------|-------------|
| `check_account_suspicious` | 007, 012 | Depends on `user_sessions` table which doesn't exist |
| `check_summary_rate_limit` | 007, 012 | Depends on `summary_access_log` table which doesn't exist |

### Migration 012 has NOT been run

Migration `012_security_and_performance_fixes.sql` fixes search_path vulnerabilities and optimizes RLS policies, but it has **not been applied** to the live database. Evidence: the Supabase dashboard still shows all 7 function search_path warnings. **Do not assume migration 012 changes are in effect.**

### Known security issues (from Supabase Dashboard, Feb 2025)

1. **ERROR:** `subscriptions` table — RLS is NOT enabled
2. **WARNING:** 7 functions have mutable `search_path` (`set_updated_at`, `update_updated_at_column`, `insert_verse_explanation`, `user_has_summary_access`, `user_has_explain_access`, `lookup_book_ids`, `is_subscription_active`)
3. **WARNING:** `explanations` table — overly permissive RLS policy `USING (true)`
4. **WARNING:** Leaked password protection disabled in Supabase Auth settings

See `supabase/SCHEMA.md` for full details and remediation SQL.

## Sensitive Areas

These areas are the most likely to cause regressions if edited carelessly:

| File | Risk | What can break |
|------|------|----------------|
| `ChapterReaderClient.tsx` | High | Translation display, notes, explanations, audio sync, sharing, verse highlighting, action bar |
| `AudioPlayerContext.tsx` | High | Audio playback, verse tracking, MiniPlayer state |
| `ReadingSettingsContext.tsx` | High | Translation toggle, theme mode, font/size preferences across the app |
| `scripts/ct-translation/prompt.ts` | High | Quality of all future CT generation |
| `globals.css` | Medium | Theme colors, verse number styling, font definitions |
| `AuthGate.tsx` | Medium | Route protection, login redirect flow |
| `ReadingSettingsPanel.tsx` | Medium | Translation toggle UI, all reading settings |
| `BibleIndex.tsx` | Medium | Translation name display, book navigation |
| `VerseActionBar.tsx` | Low | Action bar appearance and click handlers |
| `notes/page.tsx` | Low | Notes list and navigation to verses |
| `highlights/page.tsx` | Low | Highlights list and navigation to verses |
