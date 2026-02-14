-- ============================================================================
-- BibleSummary.ai Database Schema - Part 9: Verse Explanations Cache
-- ============================================================================
-- Caches AI-generated verse explanations to avoid calling OpenAI when
-- an explanation already exists. Never overwrite existing explanations.
-- ============================================================================

CREATE TABLE IF NOT EXISTS verse_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL CHECK (chapter > 0),
  verse_start INTEGER NOT NULL CHECK (verse_start > 0),
  verse_end INTEGER CHECK (verse_end IS NULL OR verse_end >= verse_start),
  explanation_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint for single verses (verse_end IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS verse_explanations_single_unique
  ON verse_explanations (book, chapter, verse_start)
  WHERE verse_end IS NULL;

-- Unique constraint for verse ranges (verse_end IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS verse_explanations_range_unique
  ON verse_explanations (book, chapter, verse_start, verse_end)
  WHERE verse_end IS NOT NULL;

-- Index for cache lookups
CREATE INDEX IF NOT EXISTS idx_verse_explanations_lookup
  ON verse_explanations (book, chapter, verse_start);

-- RLS: Allow service role to read and insert (API route uses service key)
ALTER TABLE verse_explanations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to verse_explanations"
  ON verse_explanations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Public read for cached explanations (API fetches before generating)
CREATE POLICY "Public read verse_explanations"
  ON verse_explanations FOR SELECT
  TO public
  USING (true);

COMMENT ON TABLE verse_explanations IS 'Cached AI verse explanations - never overwrite, check before calling OpenAI';

-- Helper: Insert explanation with ON CONFLICT DO NOTHING (prevents overwriting on race)
CREATE OR REPLACE FUNCTION insert_verse_explanation(
  p_book TEXT,
  p_chapter INTEGER,
  p_verse_start INTEGER,
  p_verse_end INTEGER,
  p_explanation_text TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_verse_end IS NULL THEN
    INSERT INTO verse_explanations (book, chapter, verse_start, verse_end, explanation_text)
    VALUES (p_book, p_chapter, p_verse_start, NULL, p_explanation_text)
    ON CONFLICT (book, chapter, verse_start) WHERE (verse_end IS NULL) DO NOTHING;
  ELSE
    INSERT INTO verse_explanations (book, chapter, verse_start, verse_end, explanation_text)
    VALUES (p_book, p_chapter, p_verse_start, p_verse_end, p_explanation_text)
    ON CONFLICT (book, chapter, verse_start, verse_end) WHERE (verse_end IS NOT NULL) DO NOTHING;
  END IF;
END;
$$;

COMMENT ON FUNCTION insert_verse_explanation IS 'Insert explanation, do nothing on conflict (prevents overwrite)';

GRANT EXECUTE ON FUNCTION insert_verse_explanation TO service_role;
