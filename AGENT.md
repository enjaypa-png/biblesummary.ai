# AGENT.md -- Contributor and AI Agent Guidelines

This file defines how to work in this codebase without breaking things. Read it before making changes.

## Project Overview

BibleSummary.ai is a Bible reading companion built with Next.js 14 (App Router). It serves two translations (Clear Text and KJV), verse-by-verse text-to-speech audio, AI explanations, notes, highlights, bookmarks, and paid book summaries. The app is mobile-first, deployed on Vercel, backed by Supabase.

### What the app does

- **Read the Bible** — 66 books, two translations (Clear Text default, KJV toggle). Users switch via the Aa settings panel.
- **Listen** — Verse-by-verse TTS audio (ElevenLabs) with playback controls and verse tracking
- **Explain** — Tap any verse for a plain-English AI explanation (OpenAI GPT-4o-mini), cached in DB
- **Take Notes** — Personal notes on any verse, stored per user in Supabase
- **Highlights** — Color-code verses with 5 colors; browse all highlights organized by book
- **Bookmarks** — One manual bookmark per user (creating a new one replaces the old)
- **Share Verses** — Via Web Share API or clipboard (includes current translation name)
- **Reading Settings** — Font family, font size, line height, color theme (light/sepia/gray/dark), narrator voice, translation toggle
- **Book Summaries** — Paid feature. Pre-written summaries for each book stored in `content/summaries/`
- **Authentication** — Email/password with OTP email verification via Supabase Auth
- **Reading Position** — Automatic tracking via localStorage with "Continue Reading" card

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router), React 18 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 3, PostCSS, CSS variables for theming |
| Database + Auth | Supabase (PostgreSQL + Auth + Row Level Security) |
| State | Zustand (explanation cache), React Context (audio, reading settings), localStorage (reading position) |
| AI Explanations | OpenAI GPT-4o-mini |
| CT Generation | Anthropic Claude Opus 4.6 |
| Text-to-Speech | ElevenLabs (verse-by-verse) |
| Payments | Stripe (subscriptions + one-time purchases) |
| Deployment | Vercel |

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (run before pushing)
npm run lint         # ESLint (next/core-web-vitals)
npm run start        # Start production server
```

### Data/Content Scripts (require SUPABASE_SERVICE_ROLE_KEY)

```bash
npm run seed:books       # Seed 66 books into Supabase
npm run seed:verses      # Fetch KJV from GitHub, load ~31k verses
npm run seed:summaries   # Load book summaries from content/summaries/
npm run ct:seed          # Load Clear Translation verses from data/translations/
npm run ct:generate      # Generate CT chapters via Claude API (one at a time)
npm run ct:batch:submit  # Submit CT chapters to Anthropic Batch API
npm run ct:batch:status  # Check batch processing status
npm run ct:batch:download # Download completed batches
npm run ct:progress      # Dashboard of CT generation progress
npm run ct:review        # Side-by-side HTML report of ~100 key verses
npm run ct:edit          # Fix individual CT verses (uses FIXES array in script)
```

### CT Audit Scripts (Old Testament 3-phase audit)

```bash
npm run ct:audit:batch:submit            # Phase 1 — Rewrite CT under stricter rules
npm run ct:audit:batch:status            # Check Phase 1 batch status
npm run ct:audit:batch:download          # Download Phase 1 results
npm run ct:audit:batch:phase2:submit     # Phase 2 — Independent verification
npm run ct:audit:batch:phase2:status     # Check Phase 2 status
npm run ct:audit:batch:phase2:download   # Download Phase 2 results (--json-summary)
npm run ct:audit:full:run                # Full 3-phase orchestrator (--from-book to resume)
```

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

- The CT is a modern English rendering of the entire Bible generated by Claude Opus 4.6, targeting a **10th-grade reading level** for younger and modern readers.
- **"Clear Text" is a temporary working name.** The CT will be rebranded with its own domain and identity as a standalone product.
- **Audit status:** The CT is currently being edited and audited to ensure it accurately tells the same story as the King James Version. User-facing labels call it "Clear Text" and note "Under Review."
- The system prompt and style rules live in `scripts/ct-translation/prompt.ts` and `scripts/ct-translation/STYLE-GUIDE.md`. Do not change these without explicit approval.
- **Protected terms** must be preserved exactly: heaven/heavens, created, made, soul, spirit, grace, righteousness, salvation, covenant, sin, atonement, glory, God, LORD, Lord GOD, the Almighty.
- The CT does not add words, ideas, or emphasis not present in the original text.
- When the original repeats a word for emphasis, the CT preserves the repetition.
- No archaic language: no "thee / thou / thine / hath / doth / begat / behold / lo / verily / yea" etc.
- Numbers always as numerals: "40 days and 40 nights", "70 years".
- Tone target: clear and dignified. Not academic, not casual.
- CT verses are stored in the `verses` table with `translation='ct'`. KJV verses have `translation='kjv'`.
- The `ct:edit` script (`scripts/ct-edit.ts`) is the proper way to fix individual verses. Add corrections to the `FIXES` array and run the script.
- The `ct:review` script (`scripts/ct-review.ts`) generates a side-by-side HTML report of ~100 key verses for quality review.

### CT Pipeline Architecture

The CT is produced through a multi-stage offline pipeline. **None of this affects runtime behavior** — the app simply reads from Supabase.

#### Data flow

```
KJV in Supabase → Claude generation → local JSON files → 3-phase audit → manual fixes → seed to Supabase → app reads
```

#### Generation

- Claude Opus 4.6 generates CT chapter-by-chapter using `CT_SYSTEM_PROMPT` + `buildUserPrompt()` from `scripts/ct-translation/prompt.ts`.
- Output: per-chapter JSON at `data/translations/ct/{book-slug}/{chapter}.json` containing both KJV and CT text per verse.
- Batch scripts (`ct-batch-submit`, `ct-batch-status`, `ct-batch-download`) orchestrate API calls with 50% cost savings.

#### 3-Phase Old Testament Audit

The OT is audited book-by-book via `scripts/ct-audit-full-run.ts`:

1. **Phase 1 — Rewrite:** `ct:audit:batch:submit` sends KJV + current CT through stricter audit rules (from `AUDIT-RULES.md`), produces corrected CT. Metadata tracked in `data/translations/ct-audit-batch/latest.json`.
2. **Phase 2 — Verification:** An independent agent checks Phase 1 output against KJV, marks each verse PASS/FAIL. Stats tracked in `phase2_latest.json`.
3. **Phase 3 — Auto-correction:** The orchestrator applies corrections via `ct-audit-fix.ts`, logs results to `data/translations/ct-full-run-log.jsonl`.

**Safety:** If escalations for a book exceed 5% of verses, the script pauses for manual review.

**Current OT status:** Genesis through Obadiah complete (31 books). Remaining: Jonah through Malachi (8 books). Resume with:
```bash
npm run ct:audit:full:run -- --from-book "Jonah"
```

#### Manual correction tools

- **`npm run ct:review`** — Side-by-side KJV vs CT comparison of ~100 key verses. Outputs HTML at `data/translations/ct-review.html`.
- **`npm run ct:edit`** — Surgical verse-level fixes via a `FIXES` array in `scripts/ct-edit.ts`. Supports `--dry-run` and `--ref` for preview. Writes directly to Supabase.
- **Genesis 1–10 import** — One-off script (`scripts/import-ct-genesis-1-10.ts`) that replaces CT from a parsed text file while preserving KJV fields.

#### Seeding to Supabase

- `npm run ct:seed` reads local JSON files, maps book slugs to IDs via the `books` table, and upserts CT rows into `verses` with unique constraint `(book_id, chapter, verse, translation)`.
- Supports `--book genesis` for scoped runs and `--dry-run` for preview.

#### CT governance documents

| Document | Purpose |
|----------|---------|
| `scripts/ct-translation/prompt.ts` | Master system prompt (`CT_SYSTEM_PROMPT`) and user prompt builder |
| `scripts/ct-translation/STYLE-GUIDE.md` | Tone rules, idiom mappings, protected terms, review checklist |
| `scripts/ct-translation/AUDIT-RULES.md` | "Meaning lock" rules — may change form but never meaning |

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
- `scripts/ct-translation/AUDIT-RULES.md` -- CT audit "meaning lock" rules
- `scripts/ct-audit-full-run.ts` -- 3-phase audit orchestrator
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
| `scripts/ct-translation/AUDIT-RULES.md` | High | Correctness of all CT audit passes |
| `scripts/ct-audit-full-run.ts` | High | 3-phase audit orchestration, OT audit progress |
| `globals.css` | Medium | Theme colors, verse number styling, font definitions |
| `AuthGate.tsx` | Medium | Route protection, login redirect flow |
| `ReadingSettingsPanel.tsx` | Medium | Translation toggle UI, all reading settings |
| `BibleIndex.tsx` | Medium | Translation name display, book navigation |
| `VerseActionBar.tsx` | Low | Action bar appearance and click handlers |
| `notes/page.tsx` | Low | Notes list and navigation to verses |
| `highlights/page.tsx` | Low | Highlights list and navigation to verses |

## Project Structure

```
app/
├── api/                    # 10 API routes (see API Routes below)
├── auth/callback/          # OAuth callback
├── bible/                  # Core reading experience
│   ├── BibleIndex.tsx      # Book list with translation name
│   ├── [book]/page.tsx     # Book/chapter selection
│   └── [book]/[chapter]/   # Chapter reader (ChapterReaderClient.tsx)
│       └── summary/        # Book summary view
├── bookmarks/              # User bookmarks page
├── highlights/             # User highlights page
├── listen/                 # Audio listening interface
├── login/ signup/          # Authentication
├── notes/                  # User notes page
├── onboarding/             # Onboarding flow
├── pricing/                # Stripe checkout + success/cancel
├── search/                 # Placeholder (Coming Soon)
├── summaries/              # Summaries hub + [book] detail
├── privacy/ terms/ refunds/ # Legal pages
├── layout.tsx              # Root layout (providers, BottomTabBar, MiniPlayer)
├── page.tsx                # Landing page
└── globals.css             # CSS variables, theme definitions, verse styling

components/
├── AuthGate.tsx            # Auth state wrapper
├── BottomTabBar.tsx        # Navigation tabs
├── Navigation.tsx          # Header nav
├── MiniPlayer.tsx          # Floating audio player
├── InlineAudioPlayer.tsx   # In-chapter audio controls
├── ReadingSettingsPanel.tsx # Font/size/theme/voice/translation panel
├── VerseActionBar.tsx      # Verse actions (explain, highlight, bookmark, share)
├── BookSummaryButton.tsx   # Summary access with paywall check
├── SessionTracker.tsx      # Reading activity tracker
├── SummaryPaywall.tsx      # Summary paywall
├── ExplainPaywall.tsx      # Explanation paywall
└── Footer.tsx

contexts/
├── AudioPlayerContext.tsx   # Audio playback state, verse-by-verse TTS
└── ReadingSettingsContext.tsx # Font, size, theme, voice, translation prefs

lib/
├── supabase.ts             # Browser client + auth helpers
├── audio-utils.ts          # Audio playback utilities
├── voiceIds.ts             # ElevenLabs voice constants
├── verseStore.ts           # Zustand store for explanation cache
├── entitlements.ts         # Purchase/subscription access checks (RPC)
├── stripe.ts               # Stripe integration
├── parseSummary.ts         # Markdown summary parser
├── highlightColors.ts      # 5 highlight color definitions
└── deviceFingerprint.ts    # Device ID for abuse prevention

data/
├── books.json              # 66 book metadata
└── translations/ct/        # Clear Translation JSON files by book/chapter

content/summaries/          # 66 markdown book summaries + SUMMARY-GUIDE.md
scripts/                    # Seeding + CT generation + audit tools (see Commands)
supabase/                   # Migrations, seeds, SCHEMA.md
```

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/explain-verse` | POST | AI explanation via OpenAI GPT-4o-mini (cached in DB) |
| `/api/tts` | POST | Text-to-speech via ElevenLabs |
| `/api/voices` | GET | List available TTS voices |
| `/api/checkout` | POST | Create Stripe checkout session |
| `/api/verify-purchase` | POST | Check purchase/subscription status |
| `/api/cancel-subscription` | POST | Cancel Stripe subscription |
| `/api/delete-account` | POST | Account deletion |
| `/api/track-session` | POST | Session analytics |
| `/api/record-summary-view` | POST | Summary view tracking |
| `/api/webhooks/stripe` | POST | Stripe webhook handler |

## Architecture Decisions

- **Two translations:** KJV (public domain, ~31k verses) and Clear Text (Claude-generated, ~31k verses) stored in `verses` table distinguished by `translation` column (`'kjv'` or `'ct'`). CT is the default.
- **Persistent audio element:** Single reusable `<audio>` element across verses to avoid mobile garbage collection issues.
- **Two-layer theme system:** CSS variables in `globals.css` for general use + `themeStyles` object in `ReadingSettingsContext.tsx` for per-theme chapter reader control. Four modes: light, sepia, gray, dark.
- **Accent color:** `var(--accent)` = `#7c5cfc` light / `#9b82fc` dark. Use warm neutrals throughout — no harsh blacks or cool grays.
- **Zustand only for explanations:** Everything else uses React Context or localStorage.
- **Path alias:** `@/*` maps to project root.

## Environment Variables

Required (see `.env.example` for full list):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — scripts only, never expose publicly
- `OPENAI_API_KEY` — verse explanations
- `ANTHROPIC_API_KEY` — CT generation scripts
- `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` — TTS audio
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` — payments
- Stripe price IDs for each product tier

## Deployment

This project deploys to Vercel automatically on push.

- `vercel.json` includes an `ignoreCommand` that skips builds when only `scripts/` or `data/` files change
- `tsconfig.json` excludes `scripts/` and `data/` from TypeScript compilation to prevent build failures from standalone tooling scripts
- Environment variables must be configured in the Vercel project settings

## Feature Summary

| Feature | Free | Paid |
|---------|------|------|
| Read KJV + Clear Text | Yes | — |
| Audio (ElevenLabs TTS) | Yes | — |
| Notes on verses | Yes | — |
| Highlights (5 colors) | Yes | — |
| Bookmarks | Yes | — |
| Reading progress tracking | Yes | — |
| Book summaries | — | Per-book ($0.99) or yearly pass ($14.99/yr) |
| Verse explanations | — | Monthly ($4.99/mo) |
| Premium yearly (all access) | — | $59/yr |
