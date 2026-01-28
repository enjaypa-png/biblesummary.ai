-- ============================================================================
-- BibleSummary.ai Database Schema - Part 3: User Features (FREE)
-- ============================================================================
-- This migration creates tables for free user features
-- Tables: notes, highlights, reading_progress
-- Per Universal Truth: All these features are FREE forever
-- ============================================================================

-- Create notes table
-- Users can create private notes on any verse
-- Notes are NEVER analyzed, summarized, or sent to AI APIs
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter INTEGER NOT NULL CHECK (chapter > 0),
  verse INTEGER NOT NULL CHECK (verse > 0),
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create highlights table
-- Users can highlight verses (free feature)
CREATE TABLE IF NOT EXISTS highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter INTEGER NOT NULL CHECK (chapter > 0),
  verse INTEGER NOT NULL CHECK (verse > 0),
  color TEXT DEFAULT 'yellow', -- Optional highlight color
  created_at TIMESTAMPTZ DEFAULT now(),

  -- One highlight per verse per user
  UNIQUE(user_id, book_id, chapter, verse)
);

-- Create reading_progress table
-- Tracks what chapters/verses users have read (free feature)
CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter INTEGER NOT NULL CHECK (chapter > 0),
  last_verse_read INTEGER NOT NULL CHECK (last_verse_read > 0),
  completed BOOLEAN DEFAULT false, -- Chapter fully read
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One progress record per chapter per user
  UNIQUE(user_id, book_id, chapter)
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_user
  ON notes(user_id);

CREATE INDEX IF NOT EXISTS idx_notes_verse
  ON notes(book_id, chapter, verse);

-- Highlights indexes
CREATE INDEX IF NOT EXISTS idx_highlights_user
  ON highlights(user_id);

CREATE INDEX IF NOT EXISTS idx_highlights_verse
  ON highlights(book_id, chapter, verse);

-- Reading progress indexes
CREATE INDEX IF NOT EXISTS idx_reading_progress_user
  ON reading_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_reading_progress_chapter
  ON reading_progress(book_id, chapter);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

-- NOTES POLICIES
-- Users can only CRUD their own notes
CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- HIGHLIGHTS POLICIES
-- Users can only CRUD their own highlights
CREATE POLICY "Users can view their own highlights"
  ON highlights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own highlights"
  ON highlights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights"
  ON highlights FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights"
  ON highlights FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- READING PROGRESS POLICIES
-- Users can only CRUD their own progress
CREATE POLICY "Users can view their own progress"
  ON reading_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress"
  ON reading_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON reading_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON reading_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS for updated_at timestamps
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to notes
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to reading_progress
CREATE TRIGGER update_reading_progress_updated_at
  BEFORE UPDATE ON reading_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE notes IS 'User notes on verses (PRIVATE, never sent to AI)';
COMMENT ON TABLE highlights IS 'User verse highlights (free feature)';
COMMENT ON TABLE reading_progress IS 'Tracks user reading progress (free feature)';
COMMENT ON COLUMN notes.note_text IS 'CRITICAL: Notes are never analyzed or sent to AI APIs per Universal Truth';
