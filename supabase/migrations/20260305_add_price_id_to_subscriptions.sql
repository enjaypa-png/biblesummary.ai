-- Add price_id column to subscriptions table for tracking which Stripe price
-- was used (enables distinguishing monthly vs yearly plans).
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS price_id TEXT;
