# KJV Modern English Rendering — Automation Scripts

This system uses Claude's API to create a modern English rendering of the
entire King James Version Bible, verse by verse. The original KJV text stays
untouched — the modern version lives in a separate `modern_text` column.

## How It Works

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Supabase   │────▶│  Claude API  │────▶│  JSON Files  │────▶│   Supabase   │
│  (KJV text)  │     │  (Sonnet 4.5)│     │  (output/)   │     │ (modern_text)│
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
     Step 1               Step 2              Step 3              Step 4
  Read verses        Modernize each       Save results        Upload to DB
                       chapter             locally
```

The script reads KJV verses from your Supabase database, sends each chapter
to Claude with a detailed modernization prompt, saves the results as JSON
files, and then a second script uploads the modernized text back to Supabase.

## Cost Estimate

- **Model:** Claude Sonnet 4.5 ($3 input / $15 output per million tokens)
- **Prompt caching:** The system prompt (~2,000 tokens) is cached, saving ~90%
  on input costs for all 1,189 chapters after the first call
- **Estimated total cost: $5–15 for the entire Bible**

## Setup (One Time)

### 1. Get a Claude API Key

Go to [console.anthropic.com](https://console.anthropic.com/settings/keys),
create an API key, and add it to your `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

You'll also need to add credits to your account (start with $10-20).

### 2. Run the Database Migration

In Supabase SQL Editor, run:

```sql
ALTER TABLE verses ADD COLUMN IF NOT EXISTS modern_text TEXT;
```

Or apply the migration file: `supabase/migrations/20260216_add_modern_text.sql`

## Usage

### Step 1: Run the Modernization Script

```bash
# Modernize the entire Bible (takes several hours)
npm run modernize

# Or start with just one book to test
npm run modernize -- --book genesis

# Resume from where you left off (skips completed chapters)
npm run modernize -- --resume
```

The script will:
- Pull each chapter's verses from Supabase
- Send them to Claude's API one chapter at a time
- Save the modernized verses as JSON in `scripts/modern-output/`
- Log token usage so you can track costs
- Auto-retry once if rate-limited

### Step 2: Review the Output (Optional but Recommended)

Check `scripts/modern-output/` — each book has a folder with one JSON file
per chapter. You can review the results before uploading.

Check `scripts/modern-output/_flagged.txt` for any chapters where the verse
count didn't match (these need manual review).

### Step 3: Upload to Supabase

```bash
# Preview what would be uploaded (no DB writes)
npm run seed:modern -- --dry-run

# Upload everything
npm run seed:modern

# Upload a single book
npm run seed:modern -- --book genesis
```

## Recommended Workflow

1. **Test with one small book first:** `npm run modernize -- --book ruth`
   (Ruth has only 4 chapters — cheap and fast to test)
2. **Review the output** in `scripts/modern-output/ruth/`
3. **If it looks good**, run the full Bible: `npm run modernize`
4. **If you get errors or rate limits**, just run: `npm run modernize -- --resume`
   It will skip chapters already completed and only process the remaining ones.
5. **Upload when done:** `npm run seed:modern`

## File Structure

```
scripts/
├── modernize-kjv.ts          # Main script — calls Claude API
├── seed-modern-text.ts       # Upload script — writes to Supabase
├── modern-output/             # Generated output (gitignored)
│   ├── genesis/
│   │   ├── chapter_1.json
│   │   ├── chapter_2.json
│   │   └── ...
│   ├── exodus/
│   │   └── ...
│   ├── _flagged.txt          # Chapters with verse count mismatches
│   └── _completion_log.json  # Run stats
supabase/
└── migrations/
    └── 20260216_add_modern_text.sql  # Database migration
```

## Troubleshooting

**"Missing ANTHROPIC_API_KEY"**
Add your API key to `.env.local`. Get one at console.anthropic.com.

**Rate limit errors (429)**
The script automatically waits 60 seconds and retries once. If it keeps
happening, you may need to upgrade your API tier or add longer delays.

**Verse count mismatch**
Sometimes the AI outputs slightly more or fewer verses than the source.
These are flagged in `_flagged.txt`. Re-run those chapters individually
or manually fix the JSON files.

**JSON parse errors**
If Claude returns badly formatted output, the raw response is saved in
`scripts/modern-output/_debug/` for manual review.

**Resume after interruption**
Just run `npm run modernize -- --resume` — it picks up where it left off.
