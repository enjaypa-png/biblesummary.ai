# Database Schema Reference

Complete database schema for BibleSummary.ai. **This document reflects the live Supabase production database** as of February 2025.

## Important: Migration Files vs. Live Database

The migration files in `supabase/migrations/` do NOT fully match what is deployed. Several migrations were never run against the live database. **Always verify against the live Supabase dashboard** before making assumptions. See the "Migration Status" section at the bottom of this document.

---

## Tables Overview (11 tables in production)

| Table | Purpose | RLS Status |
|-------|---------|------------|
| books | Bible book metadata (66 books) | Enabled - Public read |
| verses | KJV Bible text (~31,000 verses) | Enabled - Public read |
| explanations | Legacy AI verse explanations cache | Enabled - **Overly permissive** |
| verse_explanations | Newer AI explanation cache (by book/chapter/verse range) | Enabled - Public read, service write |
| summaries | AI book summaries (1 per book) | Enabled - Public read |
| notes | User private verse notes | Enabled - User's own only |
| highlights | User verse highlights | Enabled - User's own only |
| bookmarks | User bookmarks (multiple per user, unique per chapter) | Enabled - User's own only |
| reading_progress | Reading tracking per chapter | Enabled - User's own only |
| purchases | One-time payment records (Stripe) | Enabled - User's own only |
| subscriptions | Recurring Stripe subscriptions | **NOT ENABLED (security issue)** |

---

## Table Schemas

### books
Stores metadata for all 66 books of the Bible.

```sql
id              UUID PRIMARY KEY
name            TEXT UNIQUE          -- "Genesis", "Matthew"
slug            TEXT UNIQUE          -- "genesis", "matthew"
order_index     INTEGER UNIQUE       -- 1-66
testament       TEXT                 -- "Old" or "New"
total_chapters  INTEGER
created_at      TIMESTAMPTZ
```

**RLS Policies:** Public read access (Bible metadata is always free).

---

### verses
Stores every verse of the KJV Bible (~31,000 verses).

```sql
id              UUID PRIMARY KEY
book_id         UUID -> books(id)
chapter         INTEGER
verse           INTEGER
text            TEXT                 -- The actual verse text
verse_id        TEXT                 -- Composite key like "Genesis 1:1" (added post-migration)
created_at      TIMESTAMPTZ

UNIQUE(book_id, chapter, verse)
```

**RLS Policies:** Public read access (Bible text is always free).

---

### explanations
Legacy table for cached AI verse explanations. **This is the older table** -- `verse_explanations` is the newer, preferred cache table.

```sql
id              UUID PRIMARY KEY
-- (schema details may vary from migrations; verify in Supabase dashboard)
```

**RLS Policies:** Public read with `USING (true)` -- this is flagged as overly permissive by the Supabase security advisor.

**Note:** The app code may reference both `explanations` and `verse_explanations`. When building new features, prefer `verse_explanations`.

---

### verse_explanations
Newer AI verse explanation cache. Supports single verses and verse ranges.

```sql
id                UUID PRIMARY KEY
book              TEXT NOT NULL
chapter           INTEGER NOT NULL CHECK (chapter > 0)
verse_start       INTEGER NOT NULL CHECK (verse_start > 0)
verse_end         INTEGER CHECK (verse_end IS NULL OR verse_end >= verse_start)
explanation_text  TEXT NOT NULL
created_at        TIMESTAMPTZ
```

**Unique indexes:**
- Single verses: `(book, chapter, verse_start) WHERE verse_end IS NULL`
- Verse ranges: `(book, chapter, verse_start, verse_end) WHERE verse_end IS NOT NULL`

**RLS Policies:** Public read, service role full access.

---

### summaries
Stores AI-generated book-level summaries (one per book).

```sql
id              UUID PRIMARY KEY
book_id         UUID UNIQUE -> books(id)
summary_text    TEXT                 -- Neutral, descriptive only
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

**CRITICAL:** Summaries must ONLY describe events, topics, and structure. NEVER interpret meaning or teach lessons.

**RLS Policies:** Public read. Service role for insert/update/delete.

---

### notes
User's private notes on verses (never sent to AI).

```sql
id              UUID PRIMARY KEY
user_id         UUID -> auth.users(id)
book_id         UUID -> books(id)
chapter         INTEGER
verse           INTEGER
note_text       TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

**Privacy Guarantee:** Notes are NEVER analyzed, summarized, or sent to AI APIs.

**RLS Policies:** Authenticated users can CRUD their own notes only.

---

### highlights
User's verse highlights.

```sql
id              UUID PRIMARY KEY
user_id         UUID -> auth.users(id)
book_id         UUID -> books(id)
chapter         INTEGER
verse           INTEGER
color           TEXT DEFAULT 'yellow'
created_at      TIMESTAMPTZ

UNIQUE(user_id, book_id, chapter, verse)
```

**Colors:** yellow, orange, green, pink, blue (defined in `lib/highlightColors.ts`).

**RLS Policies:** Authenticated users can CRUD their own highlights only.

---

### bookmarks
User bookmarks. Multiple bookmarks per user allowed, one per chapter.

```sql
id              UUID PRIMARY KEY
user_id         UUID NOT NULL -> auth.users(id) ON DELETE CASCADE
book_id         UUID NOT NULL -> books(id) ON DELETE CASCADE
book_slug       TEXT NOT NULL
book_name       TEXT NOT NULL
chapter         INTEGER NOT NULL CHECK (chapter > 0)
verse           INTEGER NOT NULL CHECK (verse > 0)
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

UNIQUE(user_id, book_id, chapter)
```

**Note:** Originally single-bookmark-per-user (migration 004), changed to multiple (migration 008).

**RLS Policies:** Authenticated users can CRUD their own bookmarks only.

---

### reading_progress
Tracks user's reading progress per chapter.

```sql
id              UUID PRIMARY KEY
user_id         UUID -> auth.users(id)
book_id         UUID -> books(id)
chapter         INTEGER
last_verse_read INTEGER
completed       BOOLEAN DEFAULT false
updated_at      TIMESTAMPTZ

UNIQUE(user_id, book_id, chapter)
```

**RLS Policies:** Authenticated users can CRUD their own progress only.

---

### purchases
One-time payments via Stripe.

```sql
id                  UUID PRIMARY KEY
user_id             UUID -> auth.users(id)
book_id             UUID -> books(id)     -- NULL = lifetime access
type                TEXT                   -- 'single' or 'lifetime'
stripe_payment_id   TEXT UNIQUE
amount_cents        INTEGER                -- 99 or 1499
created_at          TIMESTAMPTZ

UNIQUE(user_id, book_id)
```

**RLS Policies:** Authenticated users can view their own. Service role for insert.

---

### subscriptions
Recurring Stripe subscriptions. **RLS is NOT enabled on this table (known security issue).**

```sql
id                      UUID PRIMARY KEY
user_id                 UUID NOT NULL -> auth.users(id) ON DELETE CASCADE
type                    TEXT NOT NULL CHECK (type IN ('summary_annual', 'explain_monthly', 'premium_yearly'))
stripe_subscription_id  TEXT NOT NULL UNIQUE
stripe_customer_id      TEXT NOT NULL
status                  TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'expired', 'trialing'))
current_period_start    TIMESTAMPTZ
current_period_end      TIMESTAMPTZ NOT NULL
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ

UNIQUE(user_id, type)
```

**Subscription types:**
- `summary_annual` -- $14.99/yr, unlocks all 66 book summaries
- `explain_monthly` -- $4.99/mo, unlimited AI verse explanations
- `premium_yearly` -- $59/yr, all features (summaries + explanations)

---

## Functions (9 in production)

### user_has_summary_access(user_id UUID, book_id UUID) -> BOOLEAN
Returns TRUE if user has purchased or subscribed to summary access for a book.

Checks:
- Single book purchase ($0.99) in `purchases`
- Lifetime purchase ($14.99) in `purchases`
- Active `summary_annual` or `premium_yearly` subscription

### user_has_explain_access(user_id UUID) -> BOOLEAN
Returns TRUE if user has an active subscription for AI explanations.

Checks:
- Active `explain_monthly` or `premium_yearly` subscription

### insert_verse_explanation(book, chapter, verse_start, verse_end, explanation_text) -> VOID
Safely inserts a cached verse explanation. Uses `ON CONFLICT DO NOTHING` to prevent overwriting existing explanations on race conditions.

### is_subscription_active(...)
Checks if a specific subscription is currently active. (Not in migration files -- created directly in database.)

### lookup_book_ids(...)
Resolves book references to UUIDs. (Not in migration files -- created directly in database.)

### update_updated_at_column() -> TRIGGER
Trigger function that sets `updated_at = now()` on row updates. Used by bookmarks and other tables.

### set_updated_at() -> TRIGGER
Variant trigger function for `updated_at` timestamps.

### rls_auto_enable()
Utility function for auto-enabling RLS on tables.

---

## Relationships

```
+----------+
|  books   |
+----+-----+
     |
     |---> verses (many)
     |---> summaries (one)
     |---> verse_explanations (many, by book name)
     |---> purchases (many)
     |---> notes (many)
     |---> highlights (many)
     |---> bookmarks (many)
     +---> reading_progress (many)

+--------------+
| auth.users   |
+------+-------+
       |
       |---> purchases (many)
       |---> subscriptions (many)
       |---> notes (many)
       |---> highlights (many)
       |---> bookmarks (many)
       +---> reading_progress (many)
```

---

## Security Issues (Supabase Dashboard, February 2025)

### ERRORS (must fix)

| Issue | Table/Function | Remediation |
|-------|---------------|-------------|
| RLS Disabled | `subscriptions` | Run: `ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;` then add appropriate policies |

### WARNINGS

| Issue | Target | Remediation |
|-------|--------|-------------|
| Mutable search_path | `set_updated_at` | Recreate with `SET search_path = ''` |
| Mutable search_path | `update_updated_at_column` | Recreate with `SET search_path = ''` |
| Mutable search_path | `insert_verse_explanation` | Recreate with `SET search_path = ''` |
| Mutable search_path | `user_has_summary_access` | Recreate with `SET search_path = ''` |
| Mutable search_path | `user_has_explain_access` | Recreate with `SET search_path = ''` |
| Mutable search_path | `lookup_book_ids` | Recreate with `SET search_path = ''` |
| Mutable search_path | `is_subscription_active` | Recreate with `SET search_path = ''` |
| RLS Always True | `explanations` | Review and tighten the `USING (true)` policy |
| Leaked Password Protection | Auth settings | Enable in Supabase Dashboard > Auth > Settings |

**Migration 012 (`012_security_and_performance_fixes.sql`) addresses the search_path issues** but has NOT been run against the live database. Before running it, note that it also references tables that don't exist (`user_sessions`, `summary_access_log`, `user_profiles`), so it will partially fail. The function fixes (sections 1a-1d) and RLS policy optimizations (section 4) for existing tables can be extracted and run separately.

### Performance Issues (19 from dashboard)

The Supabase dashboard reports 19 performance advisories, mostly slow queries:
- `SELECT name FROM pg_timezone_names` -- 0.32s avg, 79 calls
- Verse lookup queries -- 0.35s avg
- Verse update queries (one-time migrations) -- 0.90-0.95s

The cache hit rate is 99.97% which is excellent. Most slow queries are infrequent or were one-time data migrations.

---

## Migration Status

| Migration | File | Status in Live DB |
|-----------|------|-------------------|
| 001 | `001_create_books_and_verses.sql` | Applied |
| 002 | `002_create_summaries_and_purchases.sql` | Applied |
| 003 | `003_create_user_features.sql` | Applied |
| 004 | `004_create_bookmarks.sql` | Applied |
| 005 | `005_create_user_profiles.sql` | **NOT applied** (no `user_profiles` table) |
| 006 | `006_add_subscriptions_and_entitlements.sql` | **Partially applied** (subscriptions exists but RLS not enabled; stripe_customers not created) |
| 007 | `007_session_tracking_and_abuse_prevention.sql` | **NOT applied** (no `user_sessions` or `summary_access_log` tables) |
| 008 | `008_multiple_bookmarks.sql` | Applied (bookmarks allows multiple per user) |
| 009 | `009_premium_yearly_access.sql` | Applied (premium_yearly type exists) |
| 009 | `009_account_deletions_audit.sql` | **NOT applied** (no `account_deletions` table) |
| 010 | `010_add_premium_yearly_support.sql` | Applied (type column exists on subscriptions) |
| 011 | `011_create_verse_explanations.sql` | Applied |
| 012 | `012_security_and_performance_fixes.sql` | **NOT applied** (search_path warnings still present) |

**Note:** There are two files numbered 009. This should be resolved by renaming one.

---

## Common Queries

### Get a chapter's verses
```sql
SELECT verse, text FROM verses
WHERE book_id = (SELECT id FROM books WHERE slug = 'john')
AND chapter = 3
ORDER BY verse;
```

### Get user's notes for a chapter
```sql
SELECT verse, note_text FROM notes
WHERE user_id = auth.uid()
AND book_id = (SELECT id FROM books WHERE slug = 'genesis')
AND chapter = 1
ORDER BY verse;
```

### Check if user has summary access
```sql
SELECT user_has_summary_access(auth.uid(), b.id) as has_access
FROM books b WHERE b.slug = 'genesis';
```

### Get all user highlights in a chapter
```sql
SELECT verse, color FROM highlights
WHERE user_id = auth.uid()
AND book_id = (SELECT id FROM books WHERE slug = 'psalms')
AND chapter = 23
ORDER BY verse;
```

### Get user's bookmarks
```sql
SELECT book_name, chapter, verse FROM bookmarks
WHERE user_id = auth.uid()
ORDER BY updated_at DESC;
```
