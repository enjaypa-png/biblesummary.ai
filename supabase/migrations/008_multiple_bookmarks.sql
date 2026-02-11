-- ============================================================================
-- BibleSummary.ai Database Schema - Part 8: Multiple Bookmarks Per User
-- ============================================================================
-- Changes the bookmarks table from single-bookmark-per-user to allowing
-- multiple bookmarks. Each user can bookmark many chapters, but not the
-- same chapter twice.
-- ============================================================================

-- Drop the old UNIQUE constraint that limited users to one bookmark
ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_user_id_key;

-- Add a new UNIQUE constraint: one bookmark per user per book+chapter
ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_user_book_chapter_unique
  UNIQUE(user_id, book_id, chapter);

-- Add created_at column for sort order (if not already present)
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Update the table comment
COMMENT ON TABLE bookmarks IS 'User bookmarks — multiple bookmarks per user, one per chapter';
