BEGIN;

DROP INDEX IF EXISTS idx_pilot_sprint_days_user_completed;
DROP TABLE IF EXISTS pilot_sprint_days;

DROP TABLE IF EXISTS pilot_plans;

COMMIT;
