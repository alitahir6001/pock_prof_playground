BEGIN;

-- One active sprint plan per user (pilot scope). Re-onboarding upserts this row,
-- replacing the prior plan. FK points at pilot_users(user_id) (TEXT) per gotcha #6.
CREATE TABLE IF NOT EXISTS pilot_plans (
  plan_id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES pilot_users(user_id) ON DELETE CASCADE,
  plan_json JSONB NOT NULL,
  active_track_id TEXT,
  sprint_day_count INT NOT NULL DEFAULT 14,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per completed sprint day. completed_at timestamps are the return signal
-- (gaps between them = did the user come back across real days).
CREATE TABLE IF NOT EXISTS pilot_sprint_days (
  day_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES pilot_users(user_id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES pilot_plans(plan_id) ON DELETE CASCADE,
  day_index INT NOT NULL,
  track_id TEXT,
  interaction_id TEXT,
  task_summary TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (plan_id, day_index)
);

CREATE INDEX IF NOT EXISTS idx_pilot_sprint_days_user_completed
  ON pilot_sprint_days (user_id, completed_at DESC);

COMMIT;
