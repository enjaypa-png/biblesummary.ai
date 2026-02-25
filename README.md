# BibleSummary.ai

A modern Bible reading companion with AI-powered summaries, verse explanations, and two built-in translations. Built with Next.js 14, Supabase, and deployed on Vercel.

## What This App Does

- **Read the Bible** — Browse 66 books with two translations:
  - **Clear Translation (CT)** — A modern English rendering created specifically for this app using Claude Opus 4.6. Designed to read like the NIV in quality and clarity while being fully owned and license-free.
  - **King James Version (KJV)** — The classic public domain text.
  - Users toggle between translations in the reading settings panel (Aa button). CT is the default.
- **Listen** — Verse-by-verse text-to-speech audio powered by ElevenLabs, with playback controls and verse tracking
- **Explain** — Tap any verse to get a plain-English AI explanation (OpenAI GPT-4o-mini), cached in the database
- **Take Notes** — Add, edit, and delete personal notes on any verse; stored per user in Supabase
- **Highlights** — Color-code verses with 5 highlight colors; browse all highlights organized by book
- **Bookmarks** — Manually bookmark a specific verse; one bookmark per user
- **Share Verses** — Share verse text via native Web Share API or clipboard (shows current translation name)
- **Reading Settings** — Font family, font size, line height, color theme (light/sepia/gray/dark), narrator voice, and translation toggle
- **Book Summaries** — Paid feature. Pre-written summaries for each book of the Bible stored in `content/summaries/`
- **Authentication** — Email/password signup and login with OTP email verification via Supabase Auth
- **Reading Position** — Automatic tracking via localStorage with "Continue Reading" card on the index

## Clear Translation (CT)

The Clear Translation is a modern English rendering of the entire Bible (31,000+ verses across 1,189 chapters) at a **10th-grade reading level**, designed for younger and modern readers who find the KJV difficult to follow. It was generated using Claude Opus 4.6 with a carefully engineered prompt system that ensures:

- **Theological precision** — Protected terms like "heaven," "created," "soul," "spirit," "grace," "righteousness," "salvation," "covenant," "sin," and "atonement" are preserved exactly
- **Anti-embellishment** — No words, ideas, or emphasis are added that aren't in the original
- **Repetition preservation** — When the original repeats a word for emphasis (like "created" 3x in Genesis 1:27), the CT preserves it
- **Calibrated tone** — Clear and dignified, like a trusted friend explaining Scripture. Not formal ("luminaries") and not casual ("pack the water")
- **Genre-aware** — Tested across narrative (Genesis), poetry (Psalms), law (Leviticus), prophecy (Isaiah), and epistles (Romans)
- **No archaic language** — No "thee / thou / thine / hath / doth / begat / behold / lo / verily / yea" etc.
- **Numbers as numerals** — "40 days and 40 nights", "70 years"

**Note:** "Clear Text" is a temporary working name. The CT will be rebranded with its own domain and identity as a standalone product.

### CT Pipeline Overview

The CT is produced through a multi-stage pipeline:

1. **Generation** — KJV source text from Supabase is sent to Claude Opus 4.6 chapter-by-chapter, producing per-chapter JSON files at `data/translations/ct/{book}/{chapter}.json`
2. **3-Phase Audit** (Old Testament) — Automated rewrite, independent verification, and auto-correction cycle per book
3. **Manual Fixes** — Surgical verse-level corrections via `ct:edit`
4. **Seeding** — JSON files are upserted into Supabase `verses` table with `translation='ct'`
5. **Runtime** — App reads from Supabase; CT is the default translation

### CT Generation

The system prompt (`CT_SYSTEM_PROMPT` in `scripts/ct-translation/prompt.ts`) and user prompt builder (`buildUserPrompt`) control generation. Key rules:

- 10th-grade reading level, natural modern English
- No copying of KJV wording; must use different words and sentence structures
- Detailed idiom mappings (relations, conflict, movement, face/favor, fear of God)
- "Fear of the LORD" → "wholehearted devotion to the LORD" or "deep reverence for the LORD"

Output format per chapter:
```
data/translations/ct/{book-slug}/{chapter}.json
```
```json
{
  "book": "genesis",
  "book_name": "Genesis",
  "chapter": 1,
  "translation": "ct",
  "generated_at": "2026-02-01T00:00:00.000Z",
  "model": "claude-opus-4-6",
  "verses": [
    { "verse": 1, "kjv": "In the beginning...", "ct": "..." }
  ]
}
```

### CT Old Testament Audit (3-Phase)

The OT is audited book-by-book using `scripts/ct-audit-full-run.ts`:

| Phase | Script | Purpose |
|-------|--------|---------|
| Phase 1 — Rewrite | `npm run ct:audit:batch:submit` | Sends KJV + current CT through stricter audit rules, produces corrected CT |
| Phase 2 — Verify | `npm run ct:audit:batch:phase2:submit` | Independent agent checks Phase 1 output against KJV, marks PASS/FAIL |
| Phase 3 — Auto-correct | `npm run ct:audit:full:run` | Orchestrates all phases, applies corrections, logs results |

**Safety:** If escalations for a book exceed 5% of verses, the script pauses for manual review.

Results are logged to `data/translations/ct-full-run-log.jsonl`:
```json
{
  "book": "Genesis",
  "totalVerses": 1533,
  "phase2Pass": 1413,
  "phase3Corrected": 122,
  "escalations": 0
}
```

**Current OT status:** Genesis through Obadiah complete (31 books). Remaining: Jonah through Malachi (8 books). Resume with:
```bash
npm run ct:audit:full:run -- --from-book "Jonah"
```

### CT Governance Documents

| Document | Purpose |
|----------|---------|
| `scripts/ct-translation/prompt.ts` | Master system prompt (`CT_SYSTEM_PROMPT`) and user prompt builder |
| `scripts/ct-translation/STYLE-GUIDE.md` | Tone rules, idiom mappings, protected terms, review checklist |
| `scripts/ct-translation/AUDIT-RULES.md` | "Meaning lock" rules — may change form but never meaning |

### CT Tooling

| Script | Purpose |
|--------|---------|
| `npm run ct:generate` | Real-time generation (one chapter at a time via Claude API) |
| `npm run ct:batch:submit` | Submit chapters to Anthropic Batch API (50% cost savings) |
| `npm run ct:batch:status` | Check batch processing status |
| `npm run ct:batch:download` | Download completed batch results |
| `npm run ct:audit:batch:submit` | Phase 1 — Rewrite CT under stricter audit rules |
| `npm run ct:audit:batch:status` | Check Phase 1 batch status |
| `npm run ct:audit:batch:download` | Download Phase 1 results |
| `npm run ct:audit:batch:phase2:submit` | Phase 2 — Independent verification |
| `npm run ct:audit:batch:phase2:status` | Check Phase 2 batch status |
| `npm run ct:audit:batch:phase2:download` | Download Phase 2 results (use `--json-summary`) |
| `npm run ct:audit:full:run` | Full 3-phase audit orchestrator (use `--from-book` to resume) |
| `npm run ct:seed` | Seed CT verses into Supabase (`--book`, `--dry-run`) |
| `npm run ct:progress` | Dashboard showing generation progress |
| `npm run ct:review` | Quality review — 100 key verses side-by-side (KJV vs CT) with HTML output |
| `npm run ct:edit` | Fix individual verses directly in Supabase |

The batch submit script supports targeted testing:
```bash
npm run ct:batch:submit -- --books genesis,psalms,romans --chapter 2 --dry-run
```

The verse editor allows surgical corrections:
```bash
npm run ct:edit -- --ref "Romans 8:28"    # Look up a verse
npm run ct:edit -- --dry-run              # Preview fixes
npm run ct:edit                           # Apply fixes
```

The seeding script supports scoped runs:
```bash
npm run ct:seed                           # Seed all CT chapters
npm run ct:seed -- --book genesis         # Seed only Genesis
npm run ct:seed -- --dry-run              # Preview without writing
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Database + Auth | Supabase (PostgreSQL, Row Level Security, Auth) |
| State | Zustand (explanation cache), React Context (audio, reading settings) |
| AI Explanations | OpenAI GPT-4o-mini |
| CT Generation | Anthropic Claude Opus 4.6 |
| Text-to-Speech | ElevenLabs |
| Deployment | Vercel |

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ELEVENLABS_API_KEY=your-elevenlabs-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

### 3. Seed the database

Run the Supabase migrations first (see `supabase/migrations/`), then:

```bash
npm run seed:books      # Load 66 book records
npm run seed:verses     # Fetch ~31,000 KJV verses
npm run ct:seed         # Seed Clear Translation verses
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Production server |
| `npm run lint` | ESLint |
| `npm run seed:books` | Populate books table |
| `npm run seed:verses` | Populate KJV verses |
| `npm run seed:summaries` | Load book summaries |
| `npm run ct:generate` | Generate CT chapters (real-time) |
| `npm run ct:batch:submit` | Submit CT batch (50% off) |
| `npm run ct:batch:status` | Check batch status |
| `npm run ct:batch:download` | Download batch results |
| `npm run ct:seed` | Seed CT verses into Supabase |
| `npm run ct:progress` | CT generation progress |
| `npm run ct:review` | Review 100 key verses |
| `npm run ct:edit` | Edit individual CT verses |
| `npm run ct:audit:batch:submit` | Phase 1 — Rewrite CT under stricter rules |
| `npm run ct:audit:batch:status` | Check Phase 1 batch status |
| `npm run ct:audit:batch:download` | Download Phase 1 results |
| `npm run ct:audit:batch:phase2:submit` | Phase 2 — Independent verification |
| `npm run ct:audit:batch:phase2:status` | Check Phase 2 status |
| `npm run ct:audit:batch:phase2:download` | Download Phase 2 results |
| `npm run ct:audit:full:run` | Full 3-phase audit orchestrator |

## Project Structure

```
app/
  page.tsx                        Redirects to /bible
  layout.tsx                      Root layout (providers, tab bar, settings panel)
  bible/
    page.tsx                      Book index (server component, fetches books)
    BibleIndex.tsx                Three-tab navigator: Books > Chapters > Verses
    [book]/page.tsx               Chapter grid for a book
    [book]/[chapter]/page.tsx     Fetches verses filtered by translation (server)
    [book]/[chapter]/ChapterReaderClient.tsx
                                  Main reading experience (translation toggle, notes,
                                  explain, audio, share, highlights, bookmarks)
  listen/page.tsx                 Dedicated audio playback interface
  search/page.tsx                 Placeholder (coming soon)
  notes/page.tsx                  Notes list with search, sort, navigation to verse
  highlights/page.tsx             Highlights list organized by book with color chips
  bookmarks/page.tsx              Bookmarks management
  login/page.tsx                  Email/password + OTP verification
  signup/page.tsx                 Account creation + OTP verification
  more/page.tsx                   Account menu and about section
  api/
    explain-verse/route.ts        AI verse explanation (POST, caches in DB)
    tts/route.ts                  Text-to-speech streaming (POST, ElevenLabs)

components/
  ReadingSettingsPanel.tsx        Bottom sheet: translation toggle, font, theme, voice
  VerseActionBar.tsx              Pill-shaped action bar (Explain, Note, Share, etc.)
  BottomTabBar.tsx                Mobile tab navigation
  InlineAudioPlayer.tsx           In-chapter audio controls
  MiniPlayer.tsx                  Floating player for background audio
  AuthGate.tsx                    Route protection

contexts/
  AudioPlayerContext.tsx           Audio playback state and verse-by-verse TTS
  ReadingSettingsContext.tsx        Font, size, line height, theme, voice, translation

lib/
  supabase.ts                     Supabase client, getCurrentUser(), signOut()
  verseStore.ts                   Zustand store for explanation caching
  audio-utils.ts                  Audio helper functions
  highlightColors.ts              5 highlight color definitions

scripts/
  ct-translation/
    prompt.ts                     CT system prompt with protected terms and rules
    STYLE-GUIDE.md                Tone calibration, examples, review checklist
    AUDIT-RULES.md                "Meaning lock" rules for audit agents
  generate-ct-translation.ts      Real-time CT generation (one chapter at a time)
  ct-batch-submit.ts              Batch API submission (50% cost savings)
  ct-batch-status.ts              Batch status polling
  ct-batch-download.ts            Batch result download and JSON conversion
  ct-audit-batch-submit.ts        Phase 1 — Rewrite CT under stricter audit rules
  ct-audit-batch-status.ts        Phase 1 status polling
  ct-audit-batch-download.ts      Phase 1 result download
  ct-audit-batch-phase2-submit.ts Phase 2 — Independent verification
  ct-audit-batch-phase2-status.ts Phase 2 status polling
  ct-audit-batch-phase2-download.ts Phase 2 result download
  ct-audit-full-run.ts            Full 3-phase audit orchestrator
  ct-review.ts                    Quality review tool (100 key verses, HTML output)
  ct-edit.ts                      Verse editor (lookup, dry-run, apply fixes)
  ct-progress.ts                  Generation progress dashboard
  seed-ct-verses.ts               Seed CT into Supabase
  seed-books.ts                   Seed books table
  seed-verses.ts                  Seed KJV verses

data/
  books.json                      66 Bible books metadata
  translations/ct/                Generated CT JSON files (book/chapter.json)

content/
  summaries/                      Book summaries (paid feature)
```

## Deployment

This project deploys to Vercel automatically on push.

- `vercel.json` includes an `ignoreCommand` that skips builds when only `scripts/` or `data/` files change
- `tsconfig.json` excludes `scripts/` and `data/` from TypeScript compilation to prevent build failures from standalone tooling scripts
- Environment variables must be configured in the Vercel project settings

## Database

Supabase PostgreSQL with Row Level Security. The `verses` table stores both KJV and CT translations, distinguished by the `translation` column.

### Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `books` | 66 Bible books metadata | Public read |
| `verses` | ~62,000 verses (KJV + CT, with `translation` column) | Public read |
| `explanations` | Legacy cached AI verse explanations | Public read |
| `verse_explanations` | Newer AI explanation cache | Public read, service write |
| `notes` | User private verse notes | User's own data only |
| `summaries` | Book summaries (paid feature) | Public read |
| `highlights` | User verse highlights | User's own data only |
| `bookmarks` | User bookmarks | User's own data only |
| `reading_progress` | Reading tracking | User's own data only |
| `purchases` | One-time payment records | User's own data only |
| `subscriptions` | Recurring Stripe subscriptions | **RLS NOT ENABLED (known issue)** |

### Known Security Issues

See `supabase/SCHEMA.md` for full details and remediation SQL.

1. **ERROR:** `subscriptions` table — RLS is NOT enabled
2. **WARNING:** 7 functions have mutable `search_path`
3. **WARNING:** `explanations` table — overly permissive RLS policy
4. **WARNING:** Leaked password protection disabled in Supabase Auth settings

## License

MIT
