# BibleSummary.ai

A modern Bible reading companion with AI-powered summaries, verse explanations, and two built-in translations. Built with Next.js 14, Supabase, and deployed on Vercel.

## What This App Does

- **Read the Bible** — Browse 66 books with two translations:
  - **Clear Text (CT)** — A modern English rendering created specifically for this app using Claude Opus 4.6. Designed to read like the NIV in quality and clarity while being fully owned and license-free. Currently under review — audited through Genesis–Judges so far.
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

## Clear Text (CT)

The Clear Text is a modern English rendering of the entire Bible (31,000+ verses across 1,189 chapters). It was generated using Claude Opus 4.6 with a carefully engineered prompt system, then systematically audited book-by-book against the KJV. The master prompt has been refined through audits of Genesis, Exodus, Leviticus, Numbers, Deuteronomy, Joshua, and Judges.

Key principles:

- **KJV fidelity** — Modernize grammar and archaic vocabulary, but preserve every KJV noun, creature name, and specific term. If the KJV says "osprey," the CT says "osprey"
- **No additions or omissions** — Every phrase in the KJV has a counterpart in the CT. Nothing is added, dropped, softened, or strengthened
- **Protected terms** — Theological terms (heaven, created, soul, spirit, grace, righteousness, salvation, covenant, sin, atonement, glory, faith, mercy, abomination, etc.) and KJV-specific nouns (unicorn, Ethiopian, leprosy, heave offering, high places, badgers' skins, fiery serpent, etc.) are preserved exactly
- **Literal translation** — No interpretation. "Hornet" stays "hornet," "jealous God" stays "jealous God," "circumcise the foreskin of your heart" stays intact
- **Repetition and contrast preservation** — When the original repeats a word for emphasis (like "created" 3x in Genesis 1:27), the CT preserves it. Poetic contrasts (full/empty, light/darkness) are kept
- **Calibrated tone** — Clear and dignified at a 10th grade reading level. Not formal ("luminaries") and not casual ("pack the water")

### CT Audit Status

| Books | Status |
|-------|--------|
| Genesis–Judges (7 books) | Audited, corrections applied, prompt strengthened |
| Ruth–Malachi (32 books) | Generated, not yet audited |
| Matthew–Revelation (27 books) | Generated, not yet audited |

### CT Tooling

| Script | Purpose |
|--------|---------|
| `npm run ct:generate` | Real-time generation (one chapter at a time via Claude API) |
| `npm run ct:batch:submit` | Submit chapters to Anthropic Batch API (50% cost savings) |
| `npm run ct:batch:status` | Check batch processing status |
| `npm run ct:batch:download` | Download completed batch results |
| `npm run ct:seed` | Seed CT verses into Supabase |
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

CT source files: `scripts/ct-translation/prompt.ts` (system prompt), `scripts/ct-translation/STYLE-GUIDE.md` (style rules and protected terms).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Database + Auth | Supabase (PostgreSQL, Row Level Security, Auth) |
| State | Zustand (explanation cache), React Context (audio, reading settings) |
| AI Explanations | OpenAI GPT-4o-mini |
| Clear Text Generation | Anthropic Claude Opus 4.6 |
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
npm run ct:seed         # Seed Clear Text verses
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
| `npm run ct:generate` | Generate CT chapters (real-time) |
| `npm run ct:batch:submit` | Submit CT batch (50% off) |
| `npm run ct:batch:status` | Check batch status |
| `npm run ct:batch:download` | Download batch results |
| `npm run ct:seed` | Seed CT verses into Supabase |
| `npm run ct:progress` | CT generation progress |
| `npm run ct:review` | Review 100 key verses |
| `npm run ct:edit` | Edit individual CT verses |

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
  generate-ct-translation.ts      Real-time CT generation (one chapter at a time)
  ct-batch-submit.ts              Batch API submission (50% cost savings)
  ct-batch-status.ts              Batch status polling
  ct-batch-download.ts            Batch result download and JSON conversion
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
| `verses` | ~62,000 verses (KJV + Clear Text, with `translation` column) | Public read |
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
