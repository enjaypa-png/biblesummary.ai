-- Add free trial explain count and session tracking to user_profiles

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS free_explain_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS session_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN user_profiles.free_explain_count IS 'Number of free verse explanations used before upgrading';
COMMENT ON COLUMN user_profiles.session_count IS 'Number of reading sessions tracked for upgrade nudge';
