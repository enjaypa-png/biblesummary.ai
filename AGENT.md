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

Changes to `ChapterReaderClient.tsx` require extra care. This file handles notes, explanations, audio sync, sharing, verse highlighting, and the action bar. Test all of these flows after any edit.

### Context-based editing

- Notes are edited **from within the verse context** (inside the chapter reader), not from a standalone notes list.
- The Notes page (`/notes`) is a navigation tool: clicking a note takes the user to that verse, where they can then edit.
- Do not add inline editing to the Notes list page.

### Visual consistency

- The accent color is `var(--accent)` (defined in `app/globals.css` as `#2563eb` light / `#3b82f6` dark). Use this for all accent UI -- buttons, active states, links, verse numbers.
- There is no cream, brown, or gold color in the app. Do not introduce one.
- Verse numbers use the `.verse-number` CSS class. Their color comes from `var(--verse-num)` in globals.css. Do not override this with inline styles.
- Theme support covers four modes: light, sepia, gray, dark. Changes must work across all four.

## Feature Rules

### Notes

- Notes are stored per user in the `notes` table (Supabase, RLS enforced).
- A user sees a blue "Note" pill indicator inline with any verse that has a note.
- Tapping the indicator opens the note editor in verse context.
- Notes are created/edited/deleted from the chapter reader only.
- The Notes tab shows a read-only list; tapping navigates to the verse.

### Explanations

- AI explanations come from `POST /api/explain-verse`.
- The API checks the `explanations` table cache first, then calls OpenAI GPT-4o-mini.
- Explanations are also cached client-side in a Zustand store (`verseStore.ts`).
- The system prompt enforces: 2-4 sentences, plain English, no theology, no preaching.
- Do not change the system prompt without explicit approval.

### Audio

- Audio is verse-by-verse TTS via ElevenLabs (`POST /api/tts`).
- `AudioPlayerContext` manages playback state and sequential verse fetching.
- `InlineAudioPlayer` shows controls inside the chapter reader.
- `MiniPlayer` shows a floating bar when audio plays outside the chapter page.
- Audio state must remain consistent across page navigations.

### Disabled / Placeholder Features

The `VerseActionBar` contains three disabled buttons: **Highlight**, **Bookmark**, **Summary**. These are intentionally present as visual placeholders. Do not:

- Remove them
- Enable them without full implementation behind them
- Wire them to partial or stub logic

Similarly, the Search page (`/search/page.tsx`) is a "Coming Soon" placeholder. Do not add partial search functionality.

### Database tables that exist but are not wired

These tables exist in Supabase migrations but have no UI or app logic:

- `highlights` -- for verse highlighting
- `reading_progress` -- for tracking what the user has read
- `purchases` -- for one-time payments (Stripe integration planned but not built)
- `summaries` -- for AI-generated book summaries (table empty)

Do not create UI for these without an explicit request and full implementation plan.

## Code Discipline

### What not to change without approval

- `app/globals.css` -- CSS variables, verse-number styling, theme definitions
- `contexts/ReadingSettingsContext.tsx` -- theme color definitions
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

## Sensitive Areas

These areas are the most likely to cause regressions if edited carelessly:

| File | Risk | What can break |
|------|------|----------------|
| `ChapterReaderClient.tsx` | High | Notes, explanations, audio sync, sharing, verse highlighting, action bar |
| `AudioPlayerContext.tsx` | High | Audio playback, verse tracking, MiniPlayer state |
| `globals.css` | Medium | Theme colors, verse number styling, font definitions |
| `ReadingSettingsContext.tsx` | Medium | Theme mode behavior across the app |
| `AuthGate.tsx` | Medium | Route protection, login redirect flow |
| `VerseActionBar.tsx` | Low | Action bar appearance and click handlers |
| `notes/page.tsx` | Low | Notes list and navigation to verses |
