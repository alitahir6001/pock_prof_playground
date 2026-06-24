BEGIN;

ALTER TABLE pilot_login_codes DROP COLUMN IF EXISTS attempts;

COMMIT;
