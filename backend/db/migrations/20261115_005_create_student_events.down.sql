BEGIN;

ALTER TABLE pilot_users DROP COLUMN IF EXISTS time_zone;

DROP INDEX IF EXISTS uq_pilot_student_events_daily;
DROP INDEX IF EXISTS idx_pilot_student_events_user_order;
DROP TABLE IF EXISTS pilot_student_events;

COMMIT;
