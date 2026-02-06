-- ============================================================================
-- BibleSummary.ai Database Schema - Part 4: Bookmarks
-- ============================================================================
-- Single reading bookmark per user.
-- One row per user. Creating a new bookmark replaces the previous one.
-- Foundation for future reading progress, streaks, and history.
-- ============================================================================

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  book_slug TEXT NOT NULL,
  book_name TEXT NOT NULL,
  chapter INTEGER NOT NULL CHECK (chapter > 0),
  verse INTEGER NOT NULL CHECK (verse > 0),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Only one bookmark per user (last place read)
  UNIQUE(user_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bookmarks_user
  ON bookmarks(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmark"
  ON bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmark"
  ON bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmark"
  ON bookmarks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmark"
  ON bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_bookmarks_updated_at
  BEFORE UPDATE ON bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE bookmarks IS 'Single reading bookmark per user (last place read)';
