-- ============================================================================
-- BibleSummary.ai Database Schema - Part 13: Translation Support
-- ============================================================================
-- Adds support for multiple Bible translations (KJV + Clear Translation)
-- by adding a 'translation' column to the verses table.
-- ============================================================================

-- Step 1: Add translation column to verses table
-- Default 'kjv' so all existing rows are automatically tagged
ALTER TABLE verses
  ADD COLUMN IF NOT EXISTS translation TEXT NOT NULL DEFAULT 'kjv';

-- Step 2: Drop the old unique constraint (book_id, chapter, verse)
-- and replace it with one that includes translation
ALTER TABLE verses
  DROP CONSTRAINT IF EXISTS verses_book_id_chapter_verse_key;

ALTER TABLE verses
  ADD CONSTRAINT verses_book_id_chapter_verse_translation_key
  UNIQUE (book_id, chapter, verse, translation);

-- Step 3: Update the index for fetching verses in a chapter
-- Now includes translation for efficient filtered queries
DROP INDEX IF EXISTS idx_verses_book_chapter;

CREATE INDEX IF NOT EXISTS idx_verses_book_chapter_translation
  ON verses(book_id, chapter, translation);

-- Step 4: Add a check constraint for valid translation values
ALTER TABLE verses
  ADD CONSTRAINT verses_translation_check
  CHECK (translation IN ('kjv', 'ct'));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN verses.translation IS 'Bible translation identifier: kjv (King James Version) or ct (Clear Translation)';
