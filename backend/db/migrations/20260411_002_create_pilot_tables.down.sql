BEGIN;

DROP INDEX IF EXISTS idx_pilot_feedback_user_created;
DROP TABLE IF EXISTS pilot_feedback_events;

DROP INDEX IF EXISTS idx_pilot_agent_interactions_user_created;
DROP TABLE IF EXISTS pilot_agent_interactions;

DROP INDEX IF EXISTS idx_pilot_sessions_user_created;
DROP TABLE IF EXISTS pilot_sessions;

DROP INDEX IF EXISTS idx_pilot_login_codes_email_created;
DROP TABLE IF EXISTS pilot_login_codes;

DROP TABLE IF EXISTS pilot_users;

COMMIT;
