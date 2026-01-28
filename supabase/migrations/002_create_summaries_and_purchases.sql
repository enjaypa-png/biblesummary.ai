-- ============================================================================
-- BibleSummary.ai Database Schema - Part 2: Summaries & Monetization
-- ============================================================================
-- This migration creates tables for AI summaries and purchases
-- Tables: summaries, purchases
-- ============================================================================

-- Create summaries table
-- Stores AI-generated BOOK-LEVEL summaries (generated once, stored permanently)
-- Per Universal Truth: Must be neutral, descriptive only, NO interpretation
CREATE TABLE IF NOT EXISTS summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE UNIQUE,
  summary_text TEXT NOT NULL, -- Neutral, descriptive summary of the book
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create purchases table
-- Tracks user purchases (one-time payments only, no subscriptions)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE, -- NULL = lifetime access
  type TEXT NOT NULL CHECK (type IN ('single', 'lifetime')),
  stripe_payment_id TEXT NOT NULL UNIQUE, -- Stripe payment intent ID
  amount_cents INTEGER NOT NULL, -- 99 for single, 1499 for lifetime
  created_at TIMESTAMPTZ DEFAULT now(),

  -- User can only purchase each book once
  UNIQUE(user_id, book_id)
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================

-- Index for checking if user has purchased a specific book
CREATE INDEX IF NOT EXISTS idx_purchases_user_book
  ON purchases(user_id, book_id);

-- Index for checking if user has lifetime access
CREATE INDEX IF NOT EXISTS idx_purchases_user_lifetime
  ON purchases(user_id, type)
  WHERE type = 'lifetime';

-- Index for looking up purchases by Stripe payment ID
CREATE INDEX IF NOT EXISTS idx_purchases_stripe
  ON purchases(stripe_payment_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Summaries are publicly readable (paywall handled in app logic)
CREATE POLICY "Summaries are publicly readable"
  ON summaries FOR SELECT
  TO public
  USING (true);

-- Only service role can create/update summaries
CREATE POLICY "Only service role can modify summaries"
  ON summaries FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can only see their own purchases
CREATE POLICY "Users can view their own purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only service role can insert purchases (via Stripe webhook)
CREATE POLICY "Only service role can create purchases"
  ON purchases FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has access to a book's summary
-- Returns TRUE if user has purchased the book OR has lifetime access
CREATE OR REPLACE FUNCTION user_has_summary_access(
  p_user_id UUID,
  p_book_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM purchases
    WHERE user_id = p_user_id
    AND (
      book_id = p_book_id OR   -- Purchased this specific book
      type = 'lifetime'          -- Has lifetime access
    )
  );
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE summaries IS 'AI-generated book summaries (neutral, descriptive only)';
COMMENT ON TABLE purchases IS 'One-time purchase records (no subscriptions per Universal Truth)';
COMMENT ON COLUMN summaries.summary_text IS 'CRITICAL: Must describe what happens, never interpret meaning';
COMMENT ON COLUMN purchases.book_id IS 'NULL indicates lifetime access to all summaries';
COMMENT ON FUNCTION user_has_summary_access IS 'Helper function to check if user has purchased access to a book summary';
