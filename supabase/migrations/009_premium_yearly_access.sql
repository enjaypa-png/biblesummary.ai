-- ============================================================================
-- BibleSummary.ai Database Schema - Part 9: Premium Yearly Access
-- ============================================================================
-- This migration:
--   1. Adds 'premium_yearly' to the subscriptions type constraint
--   2. Updates access-check functions so premium_yearly grants both
--      summary access AND explain access
-- ============================================================================

-- Update the CHECK constraint on subscriptions.type to include premium_yearly
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_type_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_type_check
  CHECK (type IN ('summary_annual', 'explain_monthly', 'premium_yearly'));

-- Update summary access: now also checks for premium_yearly subscription
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

-- Update explain access: now also checks for premium_yearly subscription
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

-- Update comments
COMMENT ON COLUMN subscriptions.type IS 'summary_annual = $14.99/yr all summaries, explain_monthly = $4.99/mo AI explanations, premium_yearly = $59/yr all features';
