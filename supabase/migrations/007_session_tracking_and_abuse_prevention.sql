-- ============================================================================
-- BibleSummary.ai Database Schema - Part 7: Session Tracking & Abuse Prevention
-- ============================================================================
-- This migration adds:
--   1. user_sessions — tracks active sessions with device + IP info
--   2. summary_access_log — tracks summary views for rate limiting
--   3. Abuse detection function (5+ IPs or fingerprints in 24h)
--   4. Summary rate limit function (200 views/day)
-- ============================================================================

-- ─── USER SESSIONS ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  device_fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- One record per user per session token
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_user_token
  ON user_sessions(user_id, session_token);

-- Fast lookup for active sessions per user
CREATE INDEX IF NOT EXISTS idx_user_sessions_active
  ON user_sessions(user_id, is_active, last_active_at DESC)
  WHERE is_active = true;

-- For abuse detection queries (distinct IPs/fingerprints in 24h)
CREATE INDEX IF NOT EXISTS idx_user_sessions_recent
  ON user_sessions(user_id, last_active_at)
  WHERE last_active_at > now() - interval '24 hours';

-- ─── SUMMARY ACCESS LOG ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS summary_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id),
  ip_address TEXT,
  accessed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_summary_access_log_user_time
  ON summary_access_log(user_id, accessed_at);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE summary_access_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role manages sessions (via API routes)
CREATE POLICY "Service role manages sessions"
  ON user_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Service role manages access log
CREATE POLICY "Service role manages summary access log"
  ON summary_access_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── ABUSE DETECTION FUNCTION ───────────────────────────────────────────────
-- Returns TRUE if account looks suspicious:
--   5+ distinct IPs in 24 hours OR 5+ distinct fingerprints in 24 hours

CREATE OR REPLACE FUNCTION check_account_suspicious(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  distinct_ips INTEGER;
  distinct_fps INTEGER;
BEGIN
  SELECT COUNT(DISTINCT ip_address) INTO distinct_ips
  FROM user_sessions
  WHERE user_id = p_user_id
    AND last_active_at > now() - interval '24 hours'
    AND ip_address IS NOT NULL;

  SELECT COUNT(DISTINCT device_fingerprint) INTO distinct_fps
  FROM user_sessions
  WHERE user_id = p_user_id
    AND last_active_at > now() - interval '24 hours'
    AND device_fingerprint IS NOT NULL;

  RETURN distinct_ips >= 5 OR distinct_fps >= 5;
END;
$$;

-- ─── SUMMARY RATE LIMIT FUNCTION ────────────────────────────────────────────
-- Returns TRUE if user is WITHIN the limit (< 200 views in 24h)

CREATE OR REPLACE FUNCTION check_summary_rate_limit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) < 200
    FROM summary_access_log
    WHERE user_id = p_user_id
      AND accessed_at > now() - interval '24 hours'
  );
END;
$$;

-- ─── COMMENTS ───────────────────────────────────────────────────────────────

COMMENT ON TABLE user_sessions IS 'Tracks active user sessions for concurrent session limiting and abuse detection';
COMMENT ON TABLE summary_access_log IS 'Logs summary views for rate limiting (200/day per account)';
COMMENT ON FUNCTION check_account_suspicious IS 'Flags accounts with 5+ distinct IPs or fingerprints in 24h';
COMMENT ON FUNCTION check_summary_rate_limit IS 'Returns true if user has fewer than 200 summary views in 24h';
