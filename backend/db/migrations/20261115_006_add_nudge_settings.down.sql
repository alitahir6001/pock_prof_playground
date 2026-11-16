BEGIN;

ALTER TABLE pilot_users DROP COLUMN IF EXISTS nudge_stop_token;
ALTER TABLE pilot_users DROP COLUMN IF EXISTS nudges_stopped_at;
ALTER TABLE pilot_users DROP COLUMN IF EXISTS reminder_time;

COMMIT;
