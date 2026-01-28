-- ============================================================================
-- BibleSummary.ai Database Schema - Part 1: Bible Content
-- ============================================================================
-- This migration creates the core tables for storing Bible text (KJV)
-- Tables: books, verses
-- ============================================================================

-- Create books table
-- Stores metadata for all 66 books of the Bible
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- e.g., "Genesis", "Matthew"
  slug TEXT NOT NULL UNIQUE, -- e.g., "genesis", "matthew" (for URLs)
  order_index INTEGER NOT NULL UNIQUE, -- 1-66 for canonical ordering
  testament TEXT NOT NULL CHECK (testament IN ('Old', 'New')),
  total_chapters INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create verses table
-- Stores every verse of the KJV Bible (~31,000 verses)
CREATE TABLE IF NOT EXISTS verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter INTEGER NOT NULL CHECK (chapter > 0),
  verse INTEGER NOT NULL CHECK (verse > 0),
  text TEXT NOT NULL, -- The actual KJV verse text
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure no duplicate verses
  UNIQUE(book_id, chapter, verse)
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================

-- Index for fetching all verses in a chapter (most common query)
CREATE INDEX IF NOT EXISTS idx_verses_book_chapter
  ON verses(book_id, chapter);

-- Index for book lookups by slug (URL routing)
CREATE INDEX IF NOT EXISTS idx_books_slug
  ON books(slug);

-- Index for book ordering
CREATE INDEX IF NOT EXISTS idx_books_order
  ON books(order_index);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE verses ENABLE ROW LEVEL SECURITY;

-- Allow public read access to Bible text (always free per Universal Truth)
CREATE POLICY "Bible books are publicly readable"
  ON books FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Bible verses are publicly readable"
  ON verses FOR SELECT
  TO public
  USING (true);

-- Only service role can insert/update/delete Bible content
CREATE POLICY "Only service role can modify books"
  ON books FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only service role can modify verses"
  ON verses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE books IS 'Stores metadata for all 66 books of the Bible';
COMMENT ON TABLE verses IS 'Stores every verse of the KJV Bible text';
COMMENT ON COLUMN books.slug IS 'URL-friendly book name for routing (e.g., /bible/genesis/1)';
COMMENT ON COLUMN books.order_index IS 'Canonical ordering (Genesis=1, Revelation=66)';
