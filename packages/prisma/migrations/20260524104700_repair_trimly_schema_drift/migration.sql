-- =============================================================================
-- Repair Trimly schema drift (idempotent)
--
-- Why this exists
-- ---------------
-- Commit b445eb0 set TRIMLY_FORCE_RESET_DB=1 in the deploy env to trigger the
-- destructive reset block in scripts/start.sh. That block:
--   1. DROPs the Trimly tables (CASCADE)
--   2. DROPs the trimlyPhone / trimlyPreferredCity / trimlyPreferredContact
--      columns from "users"
--   3. DELETEs the row for 20260515133517_trimly_initial from
--      "_prisma_migrations" so `prisma migrate deploy` would replay it
--
-- The destructive half ran. The replay half didn't complete (the env var was
-- reverted in c4db469 with the note "didn't resolve the issue"), so the
-- production DB ended up missing every column and table that trimly_initial
-- adds while the generated Prisma client still expects them.
--
-- Symptom: every Prisma query that touches `users` (and therefore every
-- authenticated SSR page) returns
--   `Invalid prisma.user.findUnique() invocation:
--    The column (not available) does not exist in the current database.`
--
-- Fix
-- ---
-- Forward-only, idempotent re-application of trimly_initial. Every statement
-- uses IF NOT EXISTS / DO $$ guards so it's safe on:
--   - a healthy DB where trimly_initial successfully applied (no-op)
--   - a drifted DB where the columns/tables are missing (repaired)
--   - a fresh DB (the trimly_initial migration runs first and this is a no-op)
--
-- This is forward-only and additive — it never drops anything.
-- =============================================================================

-- 1. User table columns -------------------------------------------------------
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "trimlyPhone" TEXT;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "trimlyPreferredCity" TEXT;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "trimlyPreferredContact" TEXT;

-- 2. Trimly tables ------------------------------------------------------------
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

-- 3. Indexes ------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "TrimlyService_slug_key" ON "public"."TrimlyService"("slug");

CREATE INDEX IF NOT EXISTS "TrimlyBooking_userId_idx" ON "public"."TrimlyBooking"("userId");
CREATE INDEX IF NOT EXISTS "TrimlyBooking_scheduledFor_idx" ON "public"."TrimlyBooking"("scheduledFor");
CREATE INDEX IF NOT EXISTS "TrimlyBooking_city_scheduledFor_idx" ON "public"."TrimlyBooking"("city", "scheduledFor");
CREATE INDEX IF NOT EXISTS "TrimlyBooking_paymentStatus_idx" ON "public"."TrimlyBooking"("paymentStatus");

CREATE UNIQUE INDEX IF NOT EXISTS "TrimlyPayment_bookingId_key" ON "public"."TrimlyPayment"("bookingId");
CREATE INDEX IF NOT EXISTS "TrimlyPayment_providerReference_idx" ON "public"."TrimlyPayment"("providerReference");
CREATE INDEX IF NOT EXISTS "TrimlyPayment_subscriptionId_idx" ON "public"."TrimlyPayment"("subscriptionId");
CREATE INDEX IF NOT EXISTS "TrimlyPayment_status_idx" ON "public"."TrimlyPayment"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "TrimlyPlan_slug_key" ON "public"."TrimlyPlan"("slug");

CREATE INDEX IF NOT EXISTS "TrimlySubscription_userId_idx" ON "public"."TrimlySubscription"("userId");
CREATE INDEX IF NOT EXISTS "TrimlySubscription_status_currentPeriodEnd_idx" ON "public"."TrimlySubscription"("status", "currentPeriodEnd");
CREATE INDEX IF NOT EXISTS "TrimlySubscription_paymentMethod_status_currentPeriodEnd_idx" ON "public"."TrimlySubscription"("paymentMethod", "status", "currentPeriodEnd");

CREATE INDEX IF NOT EXISTS "TrimlyAvailability_date_city_idx" ON "public"."TrimlyAvailability"("date", "city");
CREATE UNIQUE INDEX IF NOT EXISTS "TrimlyAvailability_date_city_key" ON "public"."TrimlyAvailability"("date", "city");

CREATE INDEX IF NOT EXISTS "TrimlyPaymentMethod_userId_idx" ON "public"."TrimlyPaymentMethod"("userId");
CREATE INDEX IF NOT EXISTS "TrimlyPaymentMethod_userId_isDefault_idx" ON "public"."TrimlyPaymentMethod"("userId", "isDefault");

CREATE INDEX IF NOT EXISTS "TrimlyWebhookEvent_eventType_processedAt_idx" ON "public"."TrimlyWebhookEvent"("eventType", "processedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "TrimlyWebhookEvent_provider_eventId_key" ON "public"."TrimlyWebhookEvent"("provider", "eventId");

-- 4. Foreign keys (PostgreSQL has no IF NOT EXISTS for FKs, so guard with DO blocks) ----
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrimlyBooking_userId_fkey') THEN
    ALTER TABLE "public"."TrimlyBooking"
      ADD CONSTRAINT "TrimlyBooking_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrimlyBooking_serviceId_fkey') THEN
    ALTER TABLE "public"."TrimlyBooking"
      ADD CONSTRAINT "TrimlyBooking_serviceId_fkey"
      FOREIGN KEY ("serviceId") REFERENCES "public"."TrimlyService"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrimlyPayment_bookingId_fkey') THEN
    ALTER TABLE "public"."TrimlyPayment"
      ADD CONSTRAINT "TrimlyPayment_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "public"."TrimlyBooking"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrimlyPayment_subscriptionId_fkey') THEN
    ALTER TABLE "public"."TrimlyPayment"
      ADD CONSTRAINT "TrimlyPayment_subscriptionId_fkey"
      FOREIGN KEY ("subscriptionId") REFERENCES "public"."TrimlySubscription"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrimlySubscription_userId_fkey') THEN
    ALTER TABLE "public"."TrimlySubscription"
      ADD CONSTRAINT "TrimlySubscription_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrimlySubscription_planId_fkey') THEN
    ALTER TABLE "public"."TrimlySubscription"
      ADD CONSTRAINT "TrimlySubscription_planId_fkey"
      FOREIGN KEY ("planId") REFERENCES "public"."TrimlyPlan"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrimlyPaymentMethod_userId_fkey') THEN
    ALTER TABLE "public"."TrimlyPaymentMethod"
      ADD CONSTRAINT "TrimlyPaymentMethod_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
