BEGIN;

-- The student file: one append-only event log per user. Hangs off the user, not
-- the plan, so it survives re-onboarding (POST /pilot/plan wipes pilot_sprint_days).
CREATE TABLE IF NOT EXISTS pilot_student_events (
  event_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES pilot_users(user_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'plan_started', 'session_completed', 'session_missed', 'comeback_checkin',
    'nudge_sent', 'nudge_skipped', 'nudge_failed', 'nudge_stopped'
  )),
  -- The calendar day in the user's own time zone, fixed when the event is written.
  local_date DATE NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_pilot_student_events_user_order
  ON pilot_student_events (user_id, local_date, occurred_at);

-- At most one of each of these per user per day. Do not drop: this index, not
-- the app code, is what guarantees "at most one nudge a day".
CREATE UNIQUE INDEX IF NOT EXISTS uq_pilot_student_events_daily
  ON pilot_student_events (user_id, event_type, local_date)
  WHERE event_type IN ('session_missed', 'comeback_checkin', 'nudge_sent', 'nudge_skipped');

-- IANA zone name (e.g. America/Los_Angeles). NULL is treated as UTC.
ALTER TABLE pilot_users ADD COLUMN IF NOT EXISTS time_zone TEXT;

-- Backfill from data that predates the log. Zones were not stored, so dates are UTC.
INSERT INTO pilot_student_events (event_id, user_id, event_type, local_date, occurred_at)
SELECT 'evt_' || gen_random_uuid(), p.user_id, 'plan_started',
       (p.created_at AT TIME ZONE 'UTC')::date, p.created_at
FROM pilot_plans p
WHERE NOT EXISTS (
  SELECT 1 FROM pilot_student_events e WHERE e.user_id = p.user_id AND e.event_type = 'plan_started'
);

INSERT INTO pilot_student_events (event_id, user_id, event_type, local_date, occurred_at, payload_json)
SELECT 'evt_' || gen_random_uuid(), d.user_id, 'session_completed',
       (d.completed_at AT TIME ZONE 'UTC')::date, d.completed_at,
       jsonb_build_object('day_index', d.day_index, 'track_id', d.track_id,
                          'task_summary', d.task_summary, 'interaction_id', d.interaction_id)
FROM pilot_sprint_days d
WHERE NOT EXISTS (
  SELECT 1 FROM pilot_student_events e WHERE e.user_id = d.user_id AND e.event_type = 'session_completed'
);

COMMIT;
