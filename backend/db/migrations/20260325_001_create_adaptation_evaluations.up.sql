BEGIN;

CREATE TABLE IF NOT EXISTS adaptation_evaluations (
  evaluation_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  evaluation_time TIMESTAMPTZ NOT NULL,
  trigger_window TEXT NOT NULL,
  events_used_json JSONB NOT NULL,
  applied_rule_ids_json JSONB NOT NULL,
  mutations_json JSONB NOT NULL,
  previous_state_json JSONB NOT NULL,
  new_state_json JSONB NOT NULL,
  deferred_mutations_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adaptation_evaluations_user_time
  ON adaptation_evaluations (user_id, evaluation_time DESC);

CREATE INDEX IF NOT EXISTS idx_adaptation_evaluations_created_at
  ON adaptation_evaluations (created_at DESC);

COMMIT;
