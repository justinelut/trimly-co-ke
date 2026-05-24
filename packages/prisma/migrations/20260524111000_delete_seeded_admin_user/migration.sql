-- =============================================================================
-- Delete the seeded admin user so the cal.diy first-time setup wizard takes
-- over.
--
-- Why this exists
-- ---------------
-- 20260518140000_seed_admin_user added a hard-coded admin (justinequartz) with
-- a 9-character password baked into the image. In production NODE_ENV is
-- "production", so packages/features/auth/lib/next-auth-options.ts marks any
-- ADMIN whose password fails the 15+ char strict policy as "INACTIVE_ADMIN".
--
-- The decision is to drop the seeded user entirely and create the first admin
-- through cal.diy's built-in /auth/setup wizard (the vanilla flow), so the
-- password is chosen by the operator and stored only in the DB.
--
-- This migration:
--   * Deletes the UserPassword row for justinequartz (FK to users)
--   * Deletes the user row itself
--
-- Idempotent: if the user is already gone (fresh DB, or already deleted), the
-- DELETEs match zero rows and the migration completes cleanly.
-- =============================================================================

DELETE FROM "UserPassword"
WHERE "userId" IN (SELECT id FROM "users" WHERE email = 'justinequartz@gmail.com');

DELETE FROM "users" WHERE email = 'justinequartz@gmail.com';
