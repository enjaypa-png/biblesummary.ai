-- Migration 009: Account deletions audit table
-- Records every account deletion for compliance and debugging

CREATE TABLE IF NOT EXISTS account_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT,
  stripe_customer_id TEXT,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Only service role can insert/read audit records
ALTER TABLE account_deletions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON account_deletions
  FOR ALL
  USING (false)
  WITH CHECK (false);
