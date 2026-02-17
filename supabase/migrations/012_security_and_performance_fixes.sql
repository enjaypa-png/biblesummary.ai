-- ============================================================================
-- BibleSummary.ai Migration 012: Security & Performance Fixes
-- ============================================================================
-- Resolves Supabase Dashboard lint issues:
--
-- SECURITY: All 6 SECURITY DEFINER functions have mutable search_path.
--   Fix: SET search_path = '' and fully-qualify all table references.
--
-- PERFORMANCE:
--   1. 6 redundant indexes that duplicate UNIQUE constraints.
--   2. Missing FK indexes on book_id columns (cascade delete performance).
--   3. RLS policies using auth.uid() directly instead of (select auth.uid()),
--      which prevents the planner from inlining the value into index scans.
-- ============================================================================


-- ============================================================================
-- 1. SECURITY: Fix mutable search_path on all functions
-- ============================================================================

-- 1a. update_updated_at_column (trigger function)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1b. user_has_summary_access (checks purchases + subscriptions)
CREATE OR REPLACE FUNCTION user_has_summary_access(
  p_user_id UUID,
  p_book_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.purchases
    WHERE user_id = p_user_id
    AND (
      book_id = p_book_id OR
      type = 'lifetime'
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id
    AND type IN ('summary_annual', 'premium_yearly')
    AND status IN ('active', 'canceled')
    AND current_period_end > now()
  );
END;
$$;

-- 1c. user_has_explain_access (checks subscriptions)
CREATE OR REPLACE FUNCTION user_has_explain_access(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id
    AND type IN ('explain_monthly', 'premium_yearly')
    AND status IN ('active', 'canceled')
    AND current_period_end > now()
  );
END;
$$;

-- 1d. insert_verse_explanation (cache helper)
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
SET search_path = ''
AS $$
BEGIN
  IF p_verse_end IS NULL THEN
    INSERT INTO public.verse_explanations (book, chapter, verse_start, verse_end, explanation_text)
    VALUES (p_book, p_chapter, p_verse_start, NULL, p_explanation_text)
    ON CONFLICT (book, chapter, verse_start) WHERE (verse_end IS NULL) DO NOTHING;
  ELSE
    INSERT INTO public.verse_explanations (book, chapter, verse_start, verse_end, explanation_text)
    VALUES (p_book, p_chapter, p_verse_start, p_verse_end, p_explanation_text)
    ON CONFLICT (book, chapter, verse_start, verse_end) WHERE (verse_end IS NOT NULL) DO NOTHING;
  END IF;
END;
$$;

-- 1e. check_account_suspicious (abuse detection)
CREATE OR REPLACE FUNCTION check_account_suspicious(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  distinct_ips INTEGER;
  distinct_fps INTEGER;
BEGIN
  SELECT COUNT(DISTINCT ip_address) INTO distinct_ips
  FROM public.user_sessions
  WHERE user_id = p_user_id
    AND last_active_at > now() - interval '24 hours'
    AND ip_address IS NOT NULL;

  SELECT COUNT(DISTINCT device_fingerprint) INTO distinct_fps
  FROM public.user_sessions
  WHERE user_id = p_user_id
    AND last_active_at > now() - interval '24 hours'
    AND device_fingerprint IS NOT NULL;

  RETURN distinct_ips >= 5 OR distinct_fps >= 5;
END;
$$;

-- 1f. check_summary_rate_limit (rate limiting)
CREATE OR REPLACE FUNCTION check_summary_rate_limit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) < 200
    FROM public.summary_access_log
    WHERE user_id = p_user_id
      AND accessed_at > now() - interval '24 hours'
  );
END;
$$;


-- ============================================================================
-- 2. PERFORMANCE: Drop redundant indexes
-- ============================================================================
-- PostgreSQL automatically creates an index for every UNIQUE constraint.
-- These explicit indexes duplicate those implicit ones and waste space/writes.

DROP INDEX IF EXISTS idx_user_profiles_user_id;         -- duplicates UNIQUE(user_id) on user_profiles
DROP INDEX IF EXISTS idx_subscriptions_user_type;        -- duplicates UNIQUE(user_id, type) on subscriptions
DROP INDEX IF EXISTS idx_stripe_customers_user;          -- duplicates UNIQUE(user_id) on stripe_customers
DROP INDEX IF EXISTS idx_stripe_customers_stripe;        -- duplicates UNIQUE(stripe_customer_id) on stripe_customers
DROP INDEX IF EXISTS idx_purchases_stripe;               -- duplicates UNIQUE(stripe_payment_id) on purchases
DROP INDEX IF EXISTS idx_subscriptions_stripe_sub;       -- duplicates UNIQUE(stripe_subscription_id) on subscriptions


-- ============================================================================
-- 3. PERFORMANCE: Add missing foreign key indexes
-- ============================================================================
-- FK columns without indexes cause slow sequential scans during CASCADE deletes.

CREATE INDEX IF NOT EXISTS idx_bookmarks_book
  ON bookmarks(book_id);

CREATE INDEX IF NOT EXISTS idx_summary_access_log_book
  ON summary_access_log(book_id);


-- ============================================================================
-- 4. PERFORMANCE: Optimize RLS policies to use (select auth.uid())
-- ============================================================================
-- When RLS policies use auth.uid() directly, PostgreSQL may evaluate it as an
-- "initplan" that doesn't inline into index scan conditions. Wrapping in
-- (select auth.uid()) forces it to resolve as a constant, enabling index use.
--
-- Drop and recreate each policy. Runs inside a transaction so there is no
-- window where policies are missing.

-- ── notes ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own notes" ON notes;
CREATE POLICY "Users can create their own notes"
  ON notes FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- ── highlights ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own highlights" ON highlights;
CREATE POLICY "Users can view their own highlights"
  ON highlights FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own highlights" ON highlights;
CREATE POLICY "Users can create their own highlights"
  ON highlights FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own highlights" ON highlights;
CREATE POLICY "Users can update their own highlights"
  ON highlights FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own highlights" ON highlights;
CREATE POLICY "Users can delete their own highlights"
  ON highlights FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- ── reading_progress ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own progress" ON reading_progress;
CREATE POLICY "Users can view their own progress"
  ON reading_progress FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own progress" ON reading_progress;
CREATE POLICY "Users can create their own progress"
  ON reading_progress FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON reading_progress;
CREATE POLICY "Users can update their own progress"
  ON reading_progress FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own progress" ON reading_progress;
CREATE POLICY "Users can delete their own progress"
  ON reading_progress FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- ── bookmarks ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own bookmark" ON bookmarks;
CREATE POLICY "Users can view their own bookmark"
  ON bookmarks FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own bookmark" ON bookmarks;
CREATE POLICY "Users can create their own bookmark"
  ON bookmarks FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own bookmark" ON bookmarks;
CREATE POLICY "Users can update their own bookmark"
  ON bookmarks FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookmark" ON bookmarks;
CREATE POLICY "Users can delete their own bookmark"
  ON bookmarks FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- ── purchases ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
CREATE POLICY "Users can view their own purchases"
  ON purchases FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- ── subscriptions ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- ── stripe_customers ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own stripe customer" ON stripe_customers;
CREATE POLICY "Users can view their own stripe customer"
  ON stripe_customers FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- ── user_profiles ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ── user_sessions ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
