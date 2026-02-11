-- ============================================================================
-- BibleSummary.ai Database Schema - Part 6: Subscriptions & Entitlements
-- ============================================================================
-- This migration adds subscription support for:
--   1. Annual Summary Pass ($14.99/year) - unlocks all 66 book summaries
--   2. Verse Explain subscription ($4.99/month) - unlimited AI explanations
-- And updates the access-check functions to account for subscriptions.
-- ============================================================================

-- Create subscriptions table for recurring Stripe payments
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('summary_annual', 'explain_monthly')),
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'expired', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One subscription per type per user
  UNIQUE(user_id, type)
);

-- Store Stripe customer ID on users for re-use across checkout sessions
-- (Avoids creating duplicate Stripe customers)
CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_type
  ON subscriptions(user_id, type);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub
  ON subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON subscriptions(user_id, status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_stripe_customers_user
  ON stripe_customers(user_id);

CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe
  ON stripe_customers(stripe_customer_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only service role can modify subscriptions (via Stripe webhook)
CREATE POLICY "Only service role can modify subscriptions"
  ON subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can view their own Stripe customer record
CREATE POLICY "Users can view their own stripe customer"
  ON stripe_customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only service role can modify Stripe customers
CREATE POLICY "Only service role can modify stripe customers"
  ON stripe_customers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- UPDATED ACCESS FUNCTIONS
-- ============================================================================

-- Update summary access: now checks purchases (single book) OR subscriptions (annual pass)
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
    AND type = 'summary_annual'
    AND status IN ('active', 'canceled')
    AND current_period_end > now()   -- Subscription still valid
  );
END;
$$;

-- New function: check if user has explain access
-- Grants access if subscription is active OR canceled-but-still-in-period
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
    AND type = 'explain_monthly'
    AND status IN ('active', 'canceled')
    AND current_period_end > now()
  );
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE subscriptions IS 'Active recurring subscriptions managed via Stripe';
COMMENT ON TABLE stripe_customers IS 'Maps Supabase user IDs to Stripe customer IDs';
COMMENT ON COLUMN subscriptions.type IS 'summary_annual = $14.99/yr all summaries, explain_monthly = $4.99/mo AI explanations';
COMMENT ON COLUMN subscriptions.status IS 'Synced from Stripe: active, canceled, past_due, expired, trialing';
COMMENT ON FUNCTION user_has_explain_access IS 'Check if user has active Verse Explain subscription';
