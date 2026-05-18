#!/bin/sh
set -x

# Replace the statically built BUILT_NEXT_PUBLIC_WEBAPP_URL with run-time NEXT_PUBLIC_WEBAPP_URL
# NOTE: if these values are the same, this will be skipped.
scripts/replace-placeholder.sh "$BUILT_NEXT_PUBLIC_WEBAPP_URL" "$NEXT_PUBLIC_WEBAPP_URL"

scripts/wait-for-it.sh ${DATABASE_HOST} -- echo "database is up"
npx prisma migrate deploy --schema /calcom/packages/prisma/schema.prisma
npx ts-node --transpile-only /calcom/scripts/seed-app-store.ts

# Ensure admin user exists (idempotent)
npx prisma db execute --schema /calcom/packages/prisma/schema.prisma --stdin <<'SQL'
INSERT INTO "users" (email, username, "completedOnboarding", "identityProvider", locale, "timeZone", metadata, uuid, role, name, "emailVerified")
VALUES ('justinequartz@gmail.com', 'justinequartz', true, 'CAL'::"IdentityProvider", 'en', 'Africa/Nairobi', '{}', gen_random_uuid(), 'ADMIN'::"UserPermissionRole", 'Justine Quartz', NOW())
ON CONFLICT (email) DO UPDATE SET role = 'ADMIN'::"UserPermissionRole";
INSERT INTO "UserPassword" ("userId", hash)
SELECT id, '$2a$10$AHgUeojQCx/WinQ.Xx81F.yjampbxGzb7dDF4Ri8QHSurb89qRLVO'
FROM "users" WHERE email = 'justinequartz@gmail.com'
ON CONFLICT ("userId") DO NOTHING;
SQL

yarn start
