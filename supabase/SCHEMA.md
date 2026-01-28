# Database Schema Reference

Complete database schema for BibleSummary.ai

## Tables Overview

| Table | Purpose | Access Level |
|-------|---------|--------------|
| books | Bible book metadata | Public (free) |
| verses | KJV Bible text | Public (free) |
| summaries | AI book summaries | Public read, paid access in app |
| purchases | Payment records | User's own only |
| notes | User verse notes | User's own only |
| highlights | User verse highlights | User's own only |
| reading_progress | Reading tracking | User's own only |

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

**Example Row:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Genesis",
  "slug": "genesis",
  "order_index": 1,
  "testament": "Old",
  "total_chapters": 50
}
```

---

### verses
Stores every verse of the KJV Bible (~31,000 verses).

```sql
id              UUID PRIMARY KEY
book_id         UUID → books(id)
chapter         INTEGER
verse           INTEGER
text            TEXT                 -- The actual verse text
created_at      TIMESTAMPTZ

UNIQUE(book_id, chapter, verse)
```

**Example Row:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "book_id": "550e8400-e29b-41d4-a716-446655440000",
  "chapter": 1,
  "verse": 1,
  "text": "In the beginning God created the heaven and the earth."
}
```

**Query Example:**
```sql
-- Get all verses for Genesis chapter 1
SELECT verse, text FROM verses
WHERE book_id = (SELECT id FROM books WHERE slug = 'genesis')
AND chapter = 1
ORDER BY verse;
```

---

### summaries
Stores AI-generated book-level summaries (one per book).

```sql
id              UUID PRIMARY KEY
book_id         UUID UNIQUE → books(id)
summary_text    TEXT                 -- Neutral, descriptive only
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

**Example Row:**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "book_id": "550e8400-e29b-41d4-a716-446655440000",
  "summary_text": "Genesis contains 50 chapters covering creation, the flood, Abraham's journey, Isaac and Jacob's stories, and Joseph's time in Egypt. The book traces the lineage from Adam through Noah to Abraham and his descendants."
}
```

**CRITICAL:** Summaries must ONLY describe events, topics, and structure. NEVER interpret meaning or teach lessons.

---

### purchases
Tracks one-time purchases (no subscriptions per Universal Truth).

```sql
id                  UUID PRIMARY KEY
user_id             UUID → auth.users(id)
book_id             UUID → books(id)     -- NULL = lifetime access
type                TEXT                 -- 'single' or 'lifetime'
stripe_payment_id   TEXT UNIQUE
amount_cents        INTEGER              -- 99 or 1499
created_at          TIMESTAMPTZ

UNIQUE(user_id, book_id)
```

**Example Rows:**
```json
// Single book purchase
{
  "user_id": "auth-user-123",
  "book_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "single",
  "stripe_payment_id": "pi_1234567890",
  "amount_cents": 99
}

// Lifetime access
{
  "user_id": "auth-user-456",
  "book_id": null,
  "type": "lifetime",
  "stripe_payment_id": "pi_0987654321",
  "amount_cents": 1499
}
```

**Check Access:**
```sql
-- Check if user has access to a book's summary
SELECT user_has_summary_access(
  'auth-user-123'::UUID,
  '550e8400-e29b-41d4-a716-446655440000'::UUID
);
```

---

### notes
User's private notes on verses (never sent to AI).

```sql
id              UUID PRIMARY KEY
user_id         UUID → auth.users(id)
book_id         UUID → books(id)
chapter         INTEGER
verse           INTEGER
note_text       TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

**Example Row:**
```json
{
  "user_id": "auth-user-123",
  "book_id": "550e8400-e29b-41d4-a716-446655440000",
  "chapter": 1,
  "verse": 1,
  "note_text": "This verse reminds me of..."
}
```

**Privacy Guarantee:** Notes are NEVER analyzed, summarized, or sent to AI APIs per Universal Truth.

---

### highlights
User's verse highlights (free feature).

```sql
id              UUID PRIMARY KEY
user_id         UUID → auth.users(id)
book_id         UUID → books(id)
chapter         INTEGER
verse           INTEGER
color           TEXT DEFAULT 'yellow'
created_at      TIMESTAMPTZ

UNIQUE(user_id, book_id, chapter, verse)
```

**Example Row:**
```json
{
  "user_id": "auth-user-123",
  "book_id": "550e8400-e29b-41d4-a716-446655440000",
  "chapter": 1,
  "verse": 1,
  "color": "yellow"
}
```

---

### reading_progress
Tracks user's reading progress (free feature).

```sql
id              UUID PRIMARY KEY
user_id         UUID → auth.users(id)
book_id         UUID → books(id)
chapter         INTEGER
last_verse_read INTEGER
completed       BOOLEAN DEFAULT false
updated_at      TIMESTAMPTZ

UNIQUE(user_id, book_id, chapter)
```

**Example Row:**
```json
{
  "user_id": "auth-user-123",
  "book_id": "550e8400-e29b-41d4-a716-446655440000",
  "chapter": 1,
  "last_verse_read": 15,
  "completed": false
}
```

---

## Relationships

```
┌─────────┐
│  books  │
└────┬────┘
     │
     ├──→ verses (many)
     ├──→ summaries (one)
     ├──→ purchases (many)
     ├──→ notes (many)
     ├──→ highlights (many)
     └──→ reading_progress (many)

┌──────────────┐
│ auth.users   │
└──────┬───────┘
       │
       ├──→ purchases (many)
       ├──→ notes (many)
       ├──→ highlights (many)
       └──→ reading_progress (many)
```

---

## Helper Functions

### user_has_summary_access(user_id, book_id)
Returns TRUE if user has purchased access to a book's summary.

**Usage:**
```sql
SELECT user_has_summary_access(
  auth.uid(),
  '550e8400-e29b-41d4-a716-446655440000'::UUID
);
```

Returns TRUE if:
- User purchased this specific book ($0.99), OR
- User has lifetime access ($14.99)

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
SELECT
  b.name,
  user_has_summary_access(auth.uid(), b.id) as has_access
FROM books b
WHERE b.slug = 'genesis';
```

### Get all user highlights in a chapter
```sql
SELECT verse, color FROM highlights
WHERE user_id = auth.uid()
AND book_id = (SELECT id FROM books WHERE slug = 'psalms')
AND chapter = 23
ORDER BY verse;
```

---

## Security (RLS)

All tables have Row Level Security enabled:

✅ **Public (no auth required)**
- books (read)
- verses (read)
- summaries (read)

🔒 **User-scoped (auth required)**
- purchases (own only)
- notes (own only)
- highlights (own only)
- reading_progress (own only)

🛡️ **Service role only**
- All insert/update/delete on books, verses, summaries
- Insert on purchases (via Stripe webhook)

---

## Indexes

All tables have optimized indexes:
- `books`: slug, order_index
- `verses`: (book_id, chapter)
- `purchases`: (user_id, book_id), (user_id, type)
- `notes`: user_id, (book_id, chapter, verse)
- `highlights`: user_id, (book_id, chapter, verse)
- `reading_progress`: user_id, (book_id, chapter)

These ensure fast queries even with 31,000+ verses and many users.
