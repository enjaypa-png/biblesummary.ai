-- Create highlights table for verse-level color highlighting
CREATE TABLE IF NOT EXISTS highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book TEXT NOT NULL,
  book_name TEXT NOT NULL,
  book_id UUID,
  book_index INT NOT NULL,
  chapter INT NOT NULL,
  verse INT NOT NULL,
  color TEXT NOT NULL DEFAULT 'yellow',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, book, chapter, verse)
);

CREATE INDEX IF NOT EXISTS idx_highlights_user_book ON highlights(user_id, book_index, chapter, verse);

ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own highlights"
  ON highlights FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own highlights"
  ON highlights FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own highlights"
  ON highlights FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own highlights"
  ON highlights FOR DELETE
  USING (user_id = auth.uid());
