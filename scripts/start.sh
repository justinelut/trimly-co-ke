#!/bin/sh
set -x

# Replace the statically built BUILT_NEXT_PUBLIC_WEBAPP_URL with run-time NEXT_PUBLIC_WEBAPP_URL
# NOTE: if these values are the same, this will be skipped.
scripts/replace-placeholder.sh "$BUILT_NEXT_PUBLIC_WEBAPP_URL" "$NEXT_PUBLIC_WEBAPP_URL"

scripts/wait-for-it.sh ${DATABASE_HOST} -- echo "database is up"

# ---- One-time force-reset ------------------------------------------------
# Set TRIMLY_FORCE_RESET_DB=1 in the env secret to wipe all Trimly data
# and re-apply the Trimly migration on next deploy. Remove it afterward.
if [ "${TRIMLY_FORCE_RESET_DB:-0}" = "1" ] || [ "${TRIMLY_FORCE_RESET_DB:-}" = "true" ]; then
  echo "==> TRIMLY_FORCE_RESET_DB is set — wiping Trimly schema and re-seeding"
  npx prisma db execute --schema /calcom/prisma/schema.prisma --stdin <<'SQL'
DROP TABLE IF EXISTS "TrimlyWebhookEvent"  CASCADE;
DROP TABLE IF EXISTS "TrimlyPaymentMethod" CASCADE;
DROP TABLE IF EXISTS "TrimlyAvailability"  CASCADE;
DROP TABLE IF EXISTS "TrimlySubscription"  CASCADE;
DROP TABLE IF EXISTS "TrimlyPayment"       CASCADE;
DROP TABLE IF EXISTS "TrimlyBooking"       CASCADE;
DROP TABLE IF EXISTS "TrimlyService"       CASCADE;
DROP TABLE IF EXISTS "TrimlyPlan"          CASCADE;
ALTER TABLE "users" DROP COLUMN IF EXISTS "trimlyPhone";
ALTER TABLE "users" DROP COLUMN IF EXISTS "trimlyPreferredCity";
ALTER TABLE "users" DROP COLUMN IF EXISTS "trimlyPreferredContact";
-- Remove the Trimly migration record so migrate deploy replays it
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20260515133517_trimly_initial';
SQL
  echo "==> Trimly tables dropped, columns removed, migration record cleared"
fi

npx prisma migrate deploy --schema /calcom/prisma/schema.prisma
npx ts-node --transpile-only /calcom/scripts/seed-app-store.ts

# Ensure admin user exists (idempotent)
npx prisma db execute --schema /calcom/prisma/schema.prisma --stdin <<'SQL'
INSERT INTO "users" (email, username, "completedOnboarding", "identityProvider", locale, "timeZone", metadata, uuid, role, name, "emailVerified")
VALUES ('justinequartz@gmail.com', 'justinequartz', true, 'CAL'::"IdentityProvider", 'en', 'Africa/Nairobi', '{}', gen_random_uuid(), 'ADMIN'::"UserPermissionRole", 'Justine Quartz', NOW())
ON CONFLICT (email) DO UPDATE SET role = 'ADMIN'::"UserPermissionRole";
INSERT INTO "UserPassword" ("userId", hash)
SELECT id, '$2a$10$AHgUeojQCx/WinQ.Xx81F.yjampbxGzb7dDF4Ri8QHSurb89qRLVO'
FROM "users" WHERE email = 'justinequartz@gmail.com'
ON CONFLICT ("userId") DO NOTHING;
SQL

yarn start
