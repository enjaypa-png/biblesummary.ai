# Seed Scripts

Scripts for loading Bible data into the Supabase database.

## Prerequisites

✅ Database migrations completed (`supabase/migrations/`)
✅ Environment variables set in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Seed Books (Step 1)

**Alternative: Use SQL file instead** (recommended, simpler):
- See `supabase/seeds/001_seed_books.sql`
- Copy/paste into Supabase SQL Editor

**Or run the script:**
```bash
npm run seed:books
```

Loads 66 books metadata into the `books` table.

## Seed Verses (Step 2)

```bash
npm run seed:verses
```

Fetches complete KJV Bible text from GitHub and loads ~31,000 verses into the `verses` table.

**Source:** https://github.com/aruljohn/Bible-kjv (Public Domain)

**Process:**
1. Fetches JSON files for all 66 books from GitHub
2. Parses chapters and verses
3. Inserts into database in batches of 1000
4. Shows progress for each book

**Time:** ~2-5 minutes (depends on network speed)

**Output:**
```
📖 Seeding KJV Bible verses...

Found 66 books in database

   Fetching Genesis...
   ✅ genesis: 1,533 verses
   Fetching Exodus...
   ✅ exodus: 1,213 verses
   ...
   ✅ revelation: 404 verses

✅ Successfully inserted 31,102 verses from 66 books

📊 Database now contains 31,102 verses

🎉 Verse seeding complete!
```

## Verify in Supabase

After seeding:
1. Go to Supabase **Table Editor**
2. Click **verses** table
3. You should see ~31,000+ rows
4. Try a query:
   ```sql
   SELECT * FROM verses
   WHERE book_id = (SELECT id FROM books WHERE slug = 'john')
   AND chapter = 3
   AND verse = 16;
   ```

## Troubleshooting

**"No books found in database"**
- Run `seed:books` first or use the SQL seed file

**"Database already has verses"**
- To re-seed, run in Supabase SQL Editor:
  ```sql
  DELETE FROM verses;
  ```

**Network errors**
- The script retries failed fetches
- Check your internet connection
- GitHub may rate limit - wait a minute and try again

**"Missing environment variables"**
- Make sure `.env.local` has all 3 required variables
- Check for typos in variable names

## What's Next?

After seeding:
- ✅ Books table populated (66 books)
- ✅ Verses table populated (~31,000 verses)
- 🎯 Update Next.js app to fetch real Bible text
- 🎯 Build Bible reading interface

---

**Note:** These scripts use the service role key to bypass Row Level Security (RLS) for data insertion. Never expose this key publicly or commit it to git.
