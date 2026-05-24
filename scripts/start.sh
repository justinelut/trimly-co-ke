#!/bin/sh
set -x

# Replace the statically built BUILT_NEXT_PUBLIC_WEBAPP_URL with run-time NEXT_PUBLIC_WEBAPP_URL
# NOTE: if these values are the same, this will be skipped.
scripts/replace-placeholder.sh "$BUILT_NEXT_PUBLIC_WEBAPP_URL" "$NEXT_PUBLIC_WEBAPP_URL"

scripts/wait-for-it.sh ${DATABASE_HOST} -- echo "database is up"

# ---- One-time force-reset ------------------------------------------------
# Set TRIMLY_FORCE_RESET_DB=1 in the env secret to wipe all Trimly data
# and re-apply the Trimly migration on next deploy. Remove it afterward.
#
# WARNING: this block has a known foot-gun. It DROPs the trimly schema and
# DELETEs the trimly_initial migration record, then relies on the next
# `prisma migrate deploy` to replay trimly_initial. If that replay fails or
# is skipped (e.g. the env var was reverted before the next pod cycled), the
# DB is left missing columns the Prisma client expects and every authenticated
# page 500s ("The column (not available) does not exist in the current
# database.").
#
# The pre-flight repair block below runs IF NOT EXISTS DDL on every boot,
# which heals exactly that drift state without touching healthy DBs. If you
# ever set TRIMLY_FORCE_RESET_DB=1 again, the next boot will still self-repair.
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

# ---- Pre-flight schema repair (always runs, idempotent) ------------------
# Safety net for the drift class described above. Every statement is
# IF NOT EXISTS / guarded so it is a no-op on a healthy DB and a forward
# repair on a drifted one. Runs BEFORE `prisma migrate deploy` so the
# Trimly columns are present even if the prisma migration record is stuck
# in a partially-applied state (which would otherwise block migrate deploy
# from finishing the job).
#
# This mirrors packages/prisma/migrations/20260524104700_repair_trimly_schema_drift
# but applied via raw SQL so it works even if `_prisma_migrations` itself
# is in a weird state (e.g. trimly_initial recorded as failed).
echo "==> Running pre-flight Trimly schema repair (idempotent)"
npx prisma db execute --schema /calcom/prisma/schema.prisma --stdin <<'SQL' || echo "==> Pre-flight repair failed; continuing (prisma migrate deploy will retry)"
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "trimlyPhone" TEXT;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "trimlyPreferredCity" TEXT;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "trimlyPreferredContact" TEXT;

CREATE TABLE IF NOT EXISTS "public"."TrimlyService" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "priceKESNakuru" INTEGER NOT NULL,
    "priceKESNairobi" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrimlyService_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."TrimlyPlan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cutsPerMonth" INTEGER NOT NULL,
    "priceKES" INTEGER NOT NULL,
    "intervalMonths" INTEGER NOT NULL DEFAULT 1,
    "paystackPlanCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "TrimlyPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."TrimlyBooking" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "serviceId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "estate" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Nakuru',
    "notes" TEXT,
    "totalKES" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "bookingStatus" TEXT NOT NULL,
    "arrivalReminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrimlyBooking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."TrimlySubscription" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "planId" TEXT NOT NULL,
    "paystackSubscriptionCode" TEXT,
    "paystackCustomerCode" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cutsRemaining" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrimlySubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."TrimlyPayment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "subscriptionId" TEXT,
    "provider" TEXT NOT NULL,
    "providerReference" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "amountKES" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "rawCallback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrimlyPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."TrimlyAvailability" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Nakuru',
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    CONSTRAINT "TrimlyAvailability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."TrimlyPaymentMethod" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "paystackAuthCode" TEXT,
    "phone" TEXT,
    "brand" TEXT NOT NULL,
    "last4" TEXT,
    "expMonth" INTEGER,
    "expYear" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrimlyPaymentMethod_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."TrimlyWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrimlyWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- Re-seed Trimly plans defensively. The seed migration ran ONCE on the
-- original deploy; if the table is wiped (TRIMLY_FORCE_RESET_DB) it stays
-- empty because Prisma still has the seed migration recorded as applied.
-- ON CONFLICT (slug) DO NOTHING makes this safe to re-run on every boot.
INSERT INTO "public"."TrimlyPlan" (id, slug, name, "cutsPerMonth", "priceKES", "intervalMonths", "isActive") VALUES
  ('plan_starter',   'starter',   'Starter',   2, 3200, 1, true),
  ('plan_regular',   'regular',   'Regular',   4, 5600, 1, true),
  ('plan_executive', 'executive', 'Executive', 4, 7800, 1, true)
ON CONFLICT (slug) DO NOTHING;
SQL
echo "==> Pre-flight repair complete"

npx prisma migrate deploy --schema /calcom/prisma/schema.prisma
npx ts-node --transpile-only /calcom/scripts/seed-app-store.ts

# NOTE: no admin user seeding here. The first admin is created via cal.diy's
# built-in setup wizard at /auth/setup on first boot of an empty DB.
# Migration 20260524111000_delete_seeded_admin_user removes the previously
# baked-in justinequartz user, putting the DB into the same "no admin yet"
# state as a vanilla cal.diy install.

yarn start
