# CLAUDE.md

Quick reference for AI assistants working on ClearBible.ai.

## Project Overview

ClearBible.ai is a Bible reading companion built with Next.js 14 (App Router). It serves two translations (Clear Bible Translation and KJV), verse-by-verse text-to-speech audio, AI explanations, notes, highlights, bookmarks, and paid book summaries.

## Tech Stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript (strict)
- **Styling:** Tailwind CSS 3, PostCSS, CSS variables for theming
- **Database & Auth:** Supabase (PostgreSQL + Auth + Row Level Security)
- **State:** Zustand (explanation cache), React Context (audio, reading settings), localStorage (reading position, intro state)
- **AI:** OpenAI GPT-4o-mini (verse explanations), Anthropic Claude (CT generation scripts)
- **Audio:** ElevenLabs (verse-by-verse TTS)
- **Payments:** Stripe (subscriptions + one-time purchases)
- **Deployment:** Vercel

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
npm run ct:seed          # Load Clear Bible Translation verses from data/translations/
npm run ct:generate      # Generate CT chapters via Claude API (one at a time)
npm run ct:batch:submit  # Submit CT chapters to Anthropic Batch API
npm run ct:batch:status  # Check batch processing status
npm run ct:batch:download # Download completed batches
npm run ct:progress      # Dashboard of CT generation progress
npm run ct:review        # Side-by-side HTML report of ~100 key verses
npm run ct:edit          # Fix individual CT verses (uses FIXES array in script)
```

## Project Structure

```
app/
├── api/                    # 10 API routes (see below)
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
└── translations/ct/        # Clear Bible Translation JSON files by book/chapter

content/summaries/          # 66 markdown book summaries + SUMMARY-GUIDE.md
scripts/                    # Seeding + CT generation tools (see Commands)
supabase/                   # Migrations, seeds, SCHEMA.md
```

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/explain-verse` | POST | AI explanation via OpenAI GPT-4o-mini (cached) |
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

- **Two translations:** KJV (public domain, ~31k verses) and Clear Bible Translation (Claude-generated, ~31k verses) stored in `verses` table distinguished by `translation` column (`'kjv'` or `'ct'`). CT is the default.
- **Persistent audio element:** Single reusable `<audio>` element across verses to avoid mobile garbage collection issues.
- **Two-layer theme system:** CSS variables in `globals.css` for general use + `themeStyles` object in `ReadingSettingsContext.tsx` for per-theme chapter reader control. Four modes: light, sepia, gray, dark.
- **Accent color:** `var(--accent)` = `#7c5cfc` light / `#9b82fc` dark. Use warm neutrals throughout — no harsh blacks or cool grays.
- **Zustand only for explanations:** Everything else uses React Context or localStorage.
- **Path alias:** `@/*` maps to project root.

## Do Not Change Without Approval

These files/areas require explicit approval before modification:

- **`app/bible/[book]/[chapter]/ChapterReaderClient.tsx`** — handles translation switching, notes, explanations, audio sync, sharing, verse highlighting, action bar. Test all flows after any edit.
- **`app/globals.css`** — CSS variables, verse-number styling, theme definitions
- **`contexts/ReadingSettingsContext.tsx`** — theme colors, translation types
- **`scripts/ct-translation/prompt.ts`** — CT generation system prompt and protected terms
- **`scripts/ct-translation/STYLE-GUIDE.md`** — CT tone rules and style examples
- **`supabase/migrations/`** — schema changes require migration planning
- **`app/api/explain-verse/route.ts`** — the system prompt (2-4 sentences, plain English, no theology, no preaching)
- **`AuthGate.tsx`**, **`login/page.tsx`**, **`signup/page.tsx`** — authentication flow

## Sensitive Areas (Regression Risk)

| File | Risk | What Can Break |
|------|------|----------------|
| `ChapterReaderClient.tsx` | High | Translation display, notes, explanations, audio sync, sharing, highlights, action bar |
| `AudioPlayerContext.tsx` | High | Audio playback, verse tracking, MiniPlayer state |
| `ReadingSettingsContext.tsx` | High | Translation toggle, theme mode, font/size across the app |
| `scripts/ct-translation/prompt.ts` | High | Quality of all future CT generation |
| `globals.css` | Medium | Theme colors, verse numbers, font definitions |
| `AuthGate.tsx` | Medium | Route protection, login redirect |
| `ReadingSettingsPanel.tsx` | Medium | Translation toggle UI, reading settings |

## Reading Flow Rules

The Bible text on `/bible/[book]/[chapter]` is sacred. Do not change:

- Verse text rendering or formatting
- Verse number positioning or font (uses `.verse-number` class, color from `var(--verse-num)`)
- Line height, letter spacing, or word spacing
- Inline text flow (verses render as continuous inline text, not block elements)
- Page layout or max-width constraints

## Database

### Live Tables (11)

`bookmarks`, `books`, `explanations`, `highlights`, `notes`, `purchases`, `reading_progress`, `subscriptions`, `summaries`, `verse_explanations`, `verses`

The `verses` table contains ~62,000 rows (~31k KJV + ~31k CT).

### Migration Files vs. Live Database

**Migration files do NOT fully match the live database.** Several migrations were never applied:

- **Tables in migrations but NOT live:** `stripe_customers` (006), `user_profiles` (005), `user_sessions` (007), `summary_access_log` (007), `account_deletions` (009)
- **Migration 012** (security fixes) has NOT been applied — Supabase still shows search_path warnings
- **Duplicate migration 009** — two files use the same number

Always verify against the live Supabase dashboard before making schema assumptions.

### Known Security Issues

1. `subscriptions` table — RLS is NOT enabled
2. 7 functions have mutable `search_path`
3. `explanations` table — overly permissive RLS policy (`USING (true)`)

See `supabase/SCHEMA.md` for details.

## Clear Bible Translation (CT) Translation

- Modern English rendering generated by Claude Opus 4.6
- Currently **under audit** — user-facing labels say "Under Review"
- **Protected terms** (must be preserved exactly): heaven/heavens, created, made, soul, spirit, grace, righteousness, salvation, covenant, sin, atonement, glory, God, LORD, Lord GOD, the Almighty
- CT does not add words, ideas, or emphasis not in the original
- Tone: clear and dignified — not academic, not casual
- Use `npm run ct:edit` to fix individual verses (add to FIXES array in script)
- Use `npm run ct:review` for quality review

## Environment Variables

Required (see `.env.example` for full list):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — scripts only, never expose publicly
- `OPENAI_API_KEY` — verse explanations
- `ANTHROPIC_API_KEY` — CT generation scripts
- `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` — TTS audio
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` — payments
- Stripe price IDs for each product tier

## Testing Checklist

Before pushing changes:

1. `npm run build` must pass
2. Test across all 4 theme modes (light, sepia, gray, dark) for UI changes
3. Test on mobile (especially iOS Safari for audio autoplay)
4. When editing `ChapterReaderClient.tsx`: test note creation, explanation loading, audio playback, translation toggle, sharing, highlights
5. One concern per PR — do not bundle unrelated changes

## Feature Summary

| Feature | Free | Paid |
|---------|------|------|
| Read KJV + Clear Bible Translation | Yes | — |
| Audio (ElevenLabs TTS) | Yes | — |
| Notes on verses | Yes | — |
| Highlights (5 colors) | Yes | — |
| Bookmarks | Yes | — |
| Reading progress tracking | Yes | — |
| Book summaries | — | Per-book ($0.99) or yearly pass ($14.99/yr) |
| Verse explanations | — | Monthly ($4.99/mo) |
| Premium yearly (all access) | — | $59/yr |
