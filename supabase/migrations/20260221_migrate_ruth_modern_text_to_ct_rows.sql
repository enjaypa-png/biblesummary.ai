-- ============================================================================
-- BibleSummary.ai - Migrate Ruth modern_text to proper CT rows
-- ============================================================================
-- The Ruth Clear Translation was written into the modern_text column on KJV
-- rows by an external agent. This migration copies that data into proper
-- separate CT rows (translation='ct') to match the app's architecture.
--
-- The app queries verses by the translation column, so CT text must exist
-- as its own row with translation='ct' to appear in the translation toggle.
--
-- This migration is idempotent — safe to run multiple times.
-- ============================================================================

DO $$
DECLARE
  v_ruth_id UUID;
  v_count INTEGER;
BEGIN
  -- Look up Ruth's book ID
  SELECT id INTO v_ruth_id FROM books WHERE slug = 'ruth';

  IF v_ruth_id IS NULL THEN
    RAISE EXCEPTION 'Book with slug "ruth" not found in books table';
  END IF;

  -- Count how many KJV Ruth verses have modern_text populated
  SELECT COUNT(*) INTO v_count
  FROM verses
  WHERE book_id = v_ruth_id
    AND translation = 'kjv'
    AND modern_text IS NOT NULL;

  RAISE NOTICE 'Found % Ruth KJV verses with modern_text to migrate', v_count;

  -- Insert CT rows from the modern_text column on KJV rows
  -- Uses ON CONFLICT to upsert, so re-running is safe
  INSERT INTO verses (book_id, chapter, verse, text, translation)
  SELECT
    book_id,
    chapter,
    verse,
    modern_text,    -- Copy the modern_text value into the CT row's text column
    'ct'            -- Mark as Clear Translation
  FROM verses
  WHERE book_id = v_ruth_id
    AND translation = 'kjv'
    AND modern_text IS NOT NULL
  ON CONFLICT (book_id, chapter, verse, translation)
  DO UPDATE SET text = EXCLUDED.text;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % Ruth verses to CT rows', v_count;
END $$;
