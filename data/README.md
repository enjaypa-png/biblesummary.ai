# Bible Data

This folder contains data files for seeding the ClearBible.ai database.

## Files

- **`books.json`** - Metadata for all 66 books of the Bible

## Loading Books Data (Step 2a)

Follow these steps to load the books into your database.

### Prerequisites

✅ Database migrations completed (Step 1)
✅ Supabase project created

### Step 1: Get Your Service Role Key

The seed script needs a **Service Role Key** to bypass Row Level Security and insert data.

**⚠️ IMPORTANT:** The Service Role Key is SECRET and bypasses all security. Never commit it or expose it publicly.

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Settings** (gear icon) in the left sidebar
4. Click **API**
5. Scroll to **Project API keys**
6. Find **`service_role` secret** (NOT the anon key!)
7. Click the eye icon to reveal it
8. Copy the key

### Step 2: Add Service Role Key to .env.local

Open your `.env.local` file and add:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Your `.env.local` should now have 3 variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ytviivazbgbrdywoibwy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### Step 3: Install Dependencies

I'll handle this for you - just confirming tsx is installed.

### Step 4: Run the Seed Script

I'll run this for you with a single command:

```bash
npm run seed:books
```

This will:
- Read `data/books.json`
- Insert all 66 books into your `books` table
- Show you a summary

### Expected Output

```
📖 Seeding Bible books...

Found 66 books to insert

✅ Successfully inserted books:

   Old Testament: 39 books
   New Testament: 27 books
   Total: 66 books

📊 Database now contains 66 books

🎉 Books seeding complete!
```

### Verify in Supabase

After running:
1. Go to Supabase **Table Editor**
2. Click **books** table
3. You should see all 66 books listed

## What's Next?

After books are loaded:
- **Step 2b:** Load KJV verse data (~31,000 verses)
- **Step 3:** Update app to fetch real Bible text

## Troubleshooting

**Error: "Missing environment variables"**
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is in your `.env.local`
- Make sure you copied the service_role key, not the anon key

**Error: "Books table already has data"**
- The script will ask if you want to continue
- To start fresh, run this in Supabase SQL Editor:
  ```sql
  DELETE FROM books;
  ```

**Error: "Insert failed"**
- Check that migrations were run successfully
- Verify the books table exists in Supabase Table Editor

## Data Structure

Each book entry contains:
```json
{
  "name": "Genesis",           // Display name
  "slug": "genesis",            // URL-friendly (for /bible/genesis/1)
  "order_index": 1,             // Canonical ordering (1-66)
  "testament": "Old",           // "Old" or "New"
  "total_chapters": 50          // Number of chapters
}
```

## Books List

### Old Testament (39 books)
Genesis, Exodus, Leviticus, Numbers, Deuteronomy, Joshua, Judges, Ruth, 1 Samuel, 2 Samuel, 1 Kings, 2 Kings, 1 Chronicles, 2 Chronicles, Ezra, Nehemiah, Esther, Job, Psalms, Proverbs, Ecclesiastes, Song of Solomon, Isaiah, Jeremiah, Lamentations, Ezekiel, Daniel, Hosea, Joel, Amos, Obadiah, Jonah, Micah, Nahum, Habakkuk, Zephaniah, Haggai, Zechariah, Malachi

### New Testament (27 books)
Matthew, Mark, Luke, John, Acts, Romans, 1 Corinthians, 2 Corinthians, Galatians, Ephesians, Philippians, Colossians, 1 Thessalonians, 2 Thessalonians, 1 Timothy, 2 Timothy, Titus, Philemon, Hebrews, James, 1 Peter, 2 Peter, 1 John, 2 John, 3 John, Jude, Revelation

---

**Total: 1,189 chapters** across all 66 books.
