-- ============================================================================
-- BibleSummary.ai Database Schema - Part 10: Premium Yearly Support
-- ============================================================================
-- This migration adds full support for the Premium Yearly ($59/year) plan:
--   1. Adds 'premium_yearly' to the subscriptions type CHECK constraint
--   2. Updates user_has_summary_access() to grant access for premium subscribers
--   3. Updates user_has_explain_access() to grant access for premium subscribers
-- ============================================================================

-- ============================================================================
-- 1. UPDATE CHECK CONSTRAINT on subscriptions.type
-- ============================================================================
-- The existing constraint only allows ('summary_annual', 'explain_monthly').
-- We need to add 'premium_yearly' so the webhook can actually store it.

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_type_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_type_check
  CHECK (type IN ('summary_annual', 'explain_monthly', 'premium_yearly'));

-- ============================================================================
-- 2. UPDATE user_has_summary_access() to include premium_yearly
-- ============================================================================
-- Premium subscribers get access to ALL 66 book summaries (same as summary_annual).

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
    AND current_period_end > now()   -- Subscription still valid
  );
END;
$$;

-- ============================================================================
-- 3. UPDATE user_has_explain_access() to include premium_yearly
-- ============================================================================
-- Premium subscribers get unlimited verse explanations (same as explain_monthly).

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
