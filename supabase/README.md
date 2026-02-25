# Supabase Database Setup

This folder contains SQL migration files for ClearBible.ai's database schema.

## Important: Not All Migrations Have Been Applied

**The live Supabase database does NOT match all migration files.** Several migrations were never run against production. See `SCHEMA.md` in this folder for the complete truth about what is actually deployed, including a migration status table.

## Overview

The database consists of these parts:

1. **Bible Content** (books, verses) -- Stores KJV Bible text
2. **AI Cache** (explanations, verse_explanations) -- Cached AI-generated verse explanations
3. **Monetization** (summaries, purchases, subscriptions) -- AI summaries and payment tracking
4. **User Features** (notes, highlights, bookmarks, reading_progress) -- User data features

## Live Database (11 tables)

| Table | Status |
|-------|--------|
| books | Active |
| verses | Active |
| explanations | Active (legacy, overly permissive RLS) |
| verse_explanations | Active (newer cache) |
| summaries | Active |
| notes | Active |
| highlights | Active |
| bookmarks | Active |
| reading_progress | Active |
| purchases | Active |
| subscriptions | Active (**RLS not enabled -- security issue**) |

## Migration Files

| # | File | Live Status |
|---|------|-------------|
| 001 | `001_create_books_and_verses.sql` | Applied |
| 002 | `002_create_summaries_and_purchases.sql` | Applied |
| 003 | `003_create_user_features.sql` | Applied |
| 004 | `004_create_bookmarks.sql` | Applied |
| 005 | `005_create_user_profiles.sql` | **NOT applied** |
| 006 | `006_add_subscriptions_and_entitlements.sql` | **Partially applied** |
| 007 | `007_session_tracking_and_abuse_prevention.sql` | **NOT applied** |
| 008 | `008_multiple_bookmarks.sql` | Applied |
| 009 | `009_premium_yearly_access.sql` | Applied |
| 009 | `009_account_deletions_audit.sql` | **NOT applied** |
| 010 | `010_add_premium_yearly_support.sql` | Applied |
| 011 | `011_create_verse_explanations.sql` | Applied |
| 012 | `012_security_and_performance_fixes.sql` | **NOT applied** |

**Note:** Two files share the number 009. This needs to be resolved.

## How to Run Migrations

### Step 1: Open Supabase SQL Editor

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your `clearbible.ai` project
3. Click on **SQL Editor** in the left sidebar
4. Click **New query** button

### Step 2: Run Migration Files in Order

For each file:

1. Open the migration file in your code editor
2. **Copy ALL the SQL code** (Ctrl+A, Ctrl+C / Cmd+A, Cmd+C)
3. **Paste into Supabase SQL Editor**
4. Click **Run** button (or press Ctrl+Enter / Cmd+Enter)
5. Wait for "Success. No rows returned" message
6. Move to next file

### Step 3: Verify

After running migrations, check the **Table Editor** in the left sidebar to confirm tables were created.

## Row Level Security (RLS)

All tables have RLS enabled **except `subscriptions`** (known issue).

- **Bible text (books, verses)**: Public read access (always free)
- **Explanations**: Public read (overly permissive -- needs tightening)
- **Verse Explanations**: Public read, service role write
- **Summaries**: Public read (paywall handled in app)
- **Purchases**: Users can only see their own
- **Notes, Highlights, Bookmarks, Progress**: Users can only CRUD their own
- **Subscriptions**: **RLS NOT ENABLED** -- needs `ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;`

## Security Issues

The Supabase Dashboard flags 10 security issues. See `SCHEMA.md` for the full list with remediation SQL. Key issues:

1. `subscriptions` table has RLS disabled
2. 7 functions have mutable `search_path` (migration 012 fixes this but hasn't been run)
3. `explanations` table has overly permissive RLS policy
4. Leaked password protection is disabled in Auth settings

## Database Schema Diagram

```
books (66 books)
  +-- verses (31,000+ verses)
  +-- explanations (legacy AI cache)
  +-- verse_explanations (newer AI cache)
  +-- summaries (1 per book, AI-generated)
  +-- purchases (links to users)
  +-- bookmarks (user bookmarks)
  +-- notes (user notes)
  +-- highlights (user highlights)
  +-- reading_progress (user tracking)

users (Supabase Auth)
  +-- purchases (what they bought)
  +-- subscriptions (recurring payments)
  +-- notes (private verse notes)
  +-- highlights (verse highlights)
  +-- bookmarks (saved positions)
  +-- reading_progress (tracking)
```

## Troubleshooting

**Error: "relation already exists"**
- Tables were already created. You can skip that migration.

**Error: "permission denied"**
- Make sure you're using your project's SQL Editor (not a different project).

**Migration 012 partially fails**
- Migration 012 references tables that don't exist in the live database (`user_sessions`, `summary_access_log`, `user_profiles`). Extract and run only the sections that apply to existing tables (function fixes 1a-1d, and RLS policy optimizations for existing tables).

---

**For the complete schema reference, see `SCHEMA.md` in this folder.**
