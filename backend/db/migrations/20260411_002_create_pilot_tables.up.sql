BEGIN;

CREATE TABLE IF NOT EXISTS pilot_users (
  user_id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS pilot_login_codes (
  code_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pilot_login_codes_email_created
  ON pilot_login_codes (email, created_at DESC);

CREATE TABLE IF NOT EXISTS pilot_sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES pilot_users(user_id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pilot_sessions_user_created
  ON pilot_sessions (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS pilot_agent_interactions (
  interaction_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES pilot_users(user_id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  input_json JSONB NOT NULL,
  output_json JSONB NOT NULL,
  helpful BOOLEAN,
  feedback_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pilot_agent_interactions_user_created
  ON pilot_agent_interactions (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS pilot_feedback_events (
  feedback_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES pilot_users(user_id) ON DELETE CASCADE,
  component TEXT NOT NULL,
  helpful BOOLEAN,
  comment TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pilot_feedback_user_created
  ON pilot_feedback_events (user_id, created_at DESC);

COMMIT;
