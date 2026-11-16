BEGIN;

-- Wall-clock time in the user's own zone (pilot_users.time_zone). NULL = no nudges.
ALTER TABLE pilot_users ADD COLUMN IF NOT EXISTS reminder_time TIME;
ALTER TABLE pilot_users ADD COLUMN IF NOT EXISTS nudges_stopped_at TIMESTAMPTZ;
-- Random secret carried by the stop link in the nudge email; it works without a login.
ALTER TABLE pilot_users ADD COLUMN IF NOT EXISTS nudge_stop_token TEXT UNIQUE;

COMMIT;
