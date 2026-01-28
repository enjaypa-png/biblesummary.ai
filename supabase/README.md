# Supabase Database Setup

This folder contains SQL migration files for BibleSummary.ai's database schema.

## Overview

The database consists of 3 main parts:

1. **Bible Content** (books, verses) - Stores KJV Bible text
2. **Monetization** (summaries, purchases) - AI summaries and payment tracking
3. **User Features** (notes, highlights, reading_progress) - Free user features

## How to Run Migrations (No Terminal Needed!)

### Step 1: Open Supabase SQL Editor

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your `biblesummary.ai` project
3. Click on **SQL Editor** in the left sidebar (database icon)
4. Click **New query** button

### Step 2: Run Migration Files in Order

You must run these in order. For each file:

1. Open the migration file in your code editor
2. **Copy ALL the SQL code** (Ctrl+A, Ctrl+C / Cmd+A, Cmd+C)
3. **Paste into Supabase SQL Editor**
4. Click **Run** button (or press Ctrl+Enter / Cmd+Enter)
5. Wait for "Success. No rows returned" message
6. Move to next file

**Run in this order:**
```
1. 001_create_books_and_verses.sql
2. 002_create_summaries_and_purchases.sql
3. 003_create_user_features.sql
```

### Step 3: Verify Tables Were Created

After running all migrations:

1. Click **Table Editor** in the left sidebar
2. You should see these tables:
   - ✅ books
   - ✅ verses
   - ✅ summaries
   - ✅ purchases
   - ✅ notes
   - ✅ highlights
   - ✅ reading_progress

If you see all 7 tables, you're done! 🎉

## What Each Migration Does

### Migration 001: Bible Content
- Creates `books` table (66 books metadata)
- Creates `verses` table (~31,000 verses)
- Sets up indexes for fast queries
- Configures RLS (Bible text is always free/public)

### Migration 002: Summaries & Monetization
- Creates `summaries` table (AI-generated book summaries)
- Creates `purchases` table (one-time payments only)
- Creates helper function `user_has_summary_access()`
- Enforces Universal Truth: no subscriptions, no recurring billing

### Migration 003: User Features (FREE)
- Creates `notes` table (private user notes, never sent to AI)
- Creates `highlights` table (verse highlighting)
- Creates `reading_progress` table (tracks reading progress)
- All features are FREE per Universal Truth

## Row Level Security (RLS)

All tables have RLS enabled for security:

- **Bible text (books, verses)**: Public read access (always free)
- **Summaries**: Public read (paywall handled in app)
- **Purchases**: Users can only see their own
- **Notes, Highlights, Progress**: Users can only CRUD their own

## Indexes

All tables have optimized indexes for:
- Fast chapter/verse lookups
- User feature queries
- Purchase verification

## Next Steps

After running migrations:
1. ✅ Load KJV Bible data (Step 2 of Phase 1)
2. ✅ Update app to fetch real verses from database
3. ✅ Build features on top of this foundation

## Troubleshooting

**Error: "relation already exists"**
- Tables were already created. You can skip that migration.

**Error: "permission denied"**
- Make sure you're using your project's SQL Editor (not a different project)

**Error: RLS policy issues**
- RLS is strict by design. If you need to test, you can temporarily disable RLS:
  ```sql
  ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
  ```
  (Don't do this in production!)

## Database Schema Diagram

```
books (66 books)
  ├── verses (31,000+ verses)
  ├── summaries (1 per book, AI-generated)
  └── purchases (links to users)

users (Supabase Auth)
  ├── purchases (what they bought)
  ├── notes (private verse notes)
  ├── highlights (verse highlights)
  └── reading_progress (tracking)
```

---

**Need help?** All SQL files have extensive comments explaining what each part does.
