BEGIN;

DROP INDEX IF EXISTS idx_adaptation_evaluations_created_at;
DROP INDEX IF EXISTS idx_adaptation_evaluations_user_time;
DROP TABLE IF EXISTS adaptation_evaluations;

COMMIT;
