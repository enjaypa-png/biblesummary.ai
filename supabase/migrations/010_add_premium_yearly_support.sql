-- ============================================================================
-- BibleSummary.ai Database Schema - Part 10: Premium Yearly Support
-- ============================================================================
-- The live subscriptions table is missing columns the app code expects:
--   - 'type' column (code uses this; live DB has 'price_id' instead)
--   - 'current_period_start' column
-- This migration:
--   1. Adds the missing 'type' and 'current_period_start' columns
--   2. Backfills 'type' from 'price_id' for any existing rows
--   3. Adds CHECK constraint and UNIQUE constraint on (user_id, type)
--   4. Creates/updates access functions to support premium_yearly
-- ============================================================================

-- ============================================================================
-- 1. ADD MISSING COLUMNS
-- ============================================================================

-- Add 'type' column (nullable initially so we can backfill)
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS type TEXT;

-- Add 'current_period_start' column
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;

-- ============================================================================
-- 2. BACKFILL 'type' FROM 'price_id' FOR EXISTING ROWS
-- ============================================================================
-- If there are any existing rows with price_id set, try to map them.
-- Rows that can't be mapped get 'unknown' which we'll clean up.

UPDATE subscriptions
SET type = CASE
  WHEN price_id ILIKE '%summary_annual%' THEN 'summary_annual'
  WHEN price_id ILIKE '%explain%' THEN 'explain_monthly'
  WHEN price_id ILIKE '%premium%' THEN 'premium_yearly'
  ELSE 'explain_monthly'
END
WHERE type IS NULL AND price_id IS NOT NULL;

-- For any rows still without a type, set a default
UPDATE subscriptions
SET type = 'explain_monthly'
WHERE type IS NULL;

-- Backfill current_period_start from created_at where missing
UPDATE subscriptions
SET current_period_start = created_at
WHERE current_period_start IS NULL;

-- ============================================================================
-- 3. SET NOT NULL AND ADD CONSTRAINTS
-- ============================================================================

-- Make type NOT NULL now that all rows have a value
ALTER TABLE subscriptions
  ALTER COLUMN type SET NOT NULL;

-- Add CHECK constraint for allowed types
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_type_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_type_check
  CHECK (type IN ('summary_annual', 'explain_monthly', 'premium_yearly'));

-- Add UNIQUE constraint on (user_id, type) for upsert support
-- Drop first if it exists to avoid errors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_user_id_type_key'
  ) THEN
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_type_key UNIQUE (user_id, type);
  END IF;
END;
$$;

-- ============================================================================
-- 4. ADD INDEX for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_type
  ON subscriptions(user_id, type);

-- ============================================================================
-- 5. CREATE/UPDATE ACCESS FUNCTIONS
-- ============================================================================

-- Summary access: checks purchases (single book) OR subscriptions (annual/premium)
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
      book_id = p_book_id OR       -- Purchased this specific book
      type = 'lifetime'              -- Legacy lifetime purchase
    )
  )
  OR EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
    AND type IN ('summary_annual', 'premium_yearly')
    AND status IN ('active', 'canceled')
    AND current_period_end > now()
  );
END;
$$;

-- Explain access: checks subscriptions (monthly/premium)
CREATE OR REPLACE FUNCTION user_has_explain_access(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
    AND type IN ('explain_monthly', 'premium_yearly')
    AND status IN ('active', 'canceled')
    AND current_period_end > now()
  );
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN subscriptions.type IS 'summary_annual = $14.99/yr all summaries, explain_monthly = $4.99/mo AI explanations, premium_yearly = $59/yr all features';
