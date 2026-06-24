BEGIN;

-- Failed-verify counter per login code (security finding C2: brute-force lockout).
-- Existing rows default to 0.
ALTER TABLE pilot_login_codes
  ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0;

COMMIT;
