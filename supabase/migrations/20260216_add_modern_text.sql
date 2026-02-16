-- Add modern_text column to verses table for modernized KJV rendering
-- This column stores the AI-generated modern English version of each verse
-- The original KJV text remains in the "text" column untouched

ALTER TABLE verses ADD COLUMN IF NOT EXISTS modern_text TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN verses.modern_text IS 'Modern English rendering of the KJV verse text. Original KJV remains in the text column.';
