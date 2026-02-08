# BibleSummary.ai

A Bible reading web app with verse-level notes, AI-powered explanations, and audio playback. Built with Next.js 14, Supabase, and deployed on Vercel.

## What This App Does Today

- **Read the Bible (KJV)** -- Browse 66 books, navigate by chapter, read verse text with customizable typography
- **Listen** -- Verse-by-verse text-to-speech audio powered by ElevenLabs, with playback controls and verse tracking
- **Explain** -- Tap any verse to get a plain-English AI explanation (OpenAI GPT-4o-mini), cached in the database
- **Take Notes** -- Add, edit, and delete personal notes on any verse; notes are stored in Supabase per user
- **Share Verses** -- Share verse text via native Web Share API or clipboard
- **Reading Settings** -- Choose font family, font size, line height, and color theme (light, sepia, gray, dark)
- **Authentication** -- Email/password signup and login with OTP email verification via Supabase Auth

## What Is Not Built Yet

These are defined in the database schema or visible as disabled UI placeholders, but have no working logic:

- **Search** -- Page exists as a "Coming Soon" placeholder
- **Highlights** -- Database table exists; button is visible but disabled in the verse action bar
- **Bookmarks** -- Manually bookmark a specific verse; one bookmark per user, replaces previous
- **Reading Position** -- Automatic reading position tracking (localStorage); "Continue Reading" card on the Bible index
- **Book Summaries** -- Paid feature. Pre-written summaries for each book of the Bible. Content stored in `content/summaries/`. See `content/summaries/SUMMARY-GUIDE.md` for the generation plan covering all 66 books across 5 format categories (narrative, prophetic, poetry/wisdom, law, epistles). Genesis and Revelation are complete.
- **Reading Progress Tracking** -- Database table exists; not wired to the UI
- **Payments / Purchases** -- Database table and helper function exist; no Stripe integration or UI

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Database + Auth | Supabase (PostgreSQL, Row Level Security, Auth) |
| State | Zustand (explanation cache), React Context (audio, reading settings) |
| AI Explanations | OpenAI GPT-4o-mini |
| Text-to-Speech | ElevenLabs (eleven_turbo_v2, "Daniel" voice) |
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
ELEVENLABS_API_KEY=your-elevenlabs-key
OPENAI_API_KEY=your-openai-key
```

`ELEVENLABS_VOICE_ID` is optional (defaults to Daniel narrator).

### 3. Seed the database

Run the Supabase migrations first (see `supabase/migrations/`), then:

```bash
npm run seed:books
npm run seed:verses
```

`seed:books` loads 66 book records from `data/books.json`. `seed:verses` fetches ~31,000 KJV verses from the public [aruljohn/Bible-kjv](https://github.com/aruljohn/Bible-kjv) repository.

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
| `npm run seed:verses` | Populate verses table |

## Project Structure

```
app/
  page.tsx                        Redirects to /bible
  layout.tsx                      Root layout (providers, tab bar, settings panel)
  bible/
    page.tsx                      Book index (server component, fetches books)
    BibleIndex.tsx                Three-tab navigator: Books > Chapters > Verses
    [book]/page.tsx               Chapter grid for a book
    [book]/[chapter]/page.tsx     Fetches verses (server component)
    [book]/[chapter]/ChapterReaderClient.tsx
                                  Main reading experience (notes, explain, audio, share)
  listen/page.tsx                 Dedicated audio playback interface
  search/page.tsx                 Placeholder (coming soon)
  notes/page.tsx                  Notes list with search, sort, navigation to verse
  login/page.tsx                  Email/password + OTP verification
  signup/page.tsx                 Account creation + OTP verification
  more/page.tsx                   Account menu and about section
  api/
    explain-verse/route.ts        AI verse explanation (POST, caches in DB)
    tts/route.ts                  Text-to-speech streaming (POST, ElevenLabs)

components/
  AuthGate.tsx                    Route protection (redirects unauthenticated users)
  BottomTabBar.tsx                5-tab mobile navigation (Read, Listen, Search, Notes, More)
  InlineAudioPlayer.tsx           In-chapter audio controls
  MiniPlayer.tsx                  Floating player for background audio
  VerseActionBar.tsx              Pill-shaped action bar (Explain, Note, Share + 3 disabled)
  ReadingSettingsPanel.tsx        Bottom sheet for font/theme settings

contexts/
  AudioPlayerContext.tsx           Audio playback state and verse-by-verse TTS
  ReadingSettingsContext.tsx        Font, size, line height, theme preferences

lib/
  supabase.ts                     Supabase client, getCurrentUser(), signOut()
  verseStore.ts                   Zustand store for explanation caching
  audio-utils.ts                  Audio helper functions (preload, fade, error messages)

content/
  summaries/
    SUMMARY-GUIDE.md              Generation plan for all 66 books (categories, voice rules, prompt template)
    01-genesis.md                 Genesis summary (chapter-by-chapter, needs Ch 2 fix)
    66-revelation.md              Revelation summary (section-by-section)

data/
  books.json                      66 Bible books metadata

supabase/
  migrations/                     3 migration files (schema for all tables)
  seeds/                          Sample data SQL

scripts/
  seed-books.ts                   Loads books.json into database
  seed-verses.ts                  Fetches KJV text from GitHub into database
```

## Deployment

This project deploys to Vercel automatically on merge to `main`.

1. Push code to a feature branch
2. Open a pull request on GitHub
3. Merge the PR into `main`
4. Vercel builds and deploys automatically

Environment variables must be configured in the Vercel project settings.

## Database

Supabase PostgreSQL with Row Level Security. Key tables:

| Table | Purpose | RLS |
|-------|---------|-----|
| `books` | 66 Bible books metadata | Public read |
| `verses` | ~31,000 KJV verses | Public read |
| `explanations` | Cached AI verse explanations | Public read, service write |
| `notes` | User private verse notes | User's own data only |
| `summaries` | Book summaries (paid feature, content in progress) | Public read |
| `highlights` | User verse highlights (not wired) | User's own data only |
| `reading_progress` | Reading tracking (not wired) | User's own data only |
| `purchases` | Payment records (not wired) | User's own data only |

## License

MIT
