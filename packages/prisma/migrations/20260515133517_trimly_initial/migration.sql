-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "trimlyPhone" TEXT,
ADD COLUMN     "trimlyPreferredCity" TEXT,
ADD COLUMN     "trimlyPreferredContact" TEXT;

-- CreateTable
CREATE TABLE "public"."TrimlyService" (
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

-- CreateTable
CREATE TABLE "public"."TrimlyBooking" (
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

-- CreateTable
CREATE TABLE "public"."TrimlyPayment" (
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

-- CreateTable
CREATE TABLE "public"."TrimlyPlan" (
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

-- CreateTable
CREATE TABLE "public"."TrimlySubscription" (
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

-- CreateTable
CREATE TABLE "public"."TrimlyAvailability" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Nakuru',
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,

    CONSTRAINT "TrimlyAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TrimlyPaymentMethod" (
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

-- CreateTable
CREATE TABLE "public"."TrimlyWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrimlyWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrimlyService_slug_key" ON "public"."TrimlyService"("slug");

-- CreateIndex
CREATE INDEX "TrimlyBooking_userId_idx" ON "public"."TrimlyBooking"("userId");

-- CreateIndex
CREATE INDEX "TrimlyBooking_scheduledFor_idx" ON "public"."TrimlyBooking"("scheduledFor");

-- CreateIndex
CREATE INDEX "TrimlyBooking_city_scheduledFor_idx" ON "public"."TrimlyBooking"("city", "scheduledFor");

-- CreateIndex
CREATE INDEX "TrimlyBooking_paymentStatus_idx" ON "public"."TrimlyBooking"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "TrimlyPayment_bookingId_key" ON "public"."TrimlyPayment"("bookingId");

-- CreateIndex
CREATE INDEX "TrimlyPayment_providerReference_idx" ON "public"."TrimlyPayment"("providerReference");

-- CreateIndex
CREATE INDEX "TrimlyPayment_subscriptionId_idx" ON "public"."TrimlyPayment"("subscriptionId");

-- CreateIndex
CREATE INDEX "TrimlyPayment_status_idx" ON "public"."TrimlyPayment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TrimlyPlan_slug_key" ON "public"."TrimlyPlan"("slug");

-- CreateIndex
CREATE INDEX "TrimlySubscription_userId_idx" ON "public"."TrimlySubscription"("userId");

-- CreateIndex
CREATE INDEX "TrimlySubscription_status_currentPeriodEnd_idx" ON "public"."TrimlySubscription"("status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "TrimlySubscription_paymentMethod_status_currentPeriodEnd_idx" ON "public"."TrimlySubscription"("paymentMethod", "status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "TrimlyAvailability_date_city_idx" ON "public"."TrimlyAvailability"("date", "city");

-- CreateIndex
CREATE UNIQUE INDEX "TrimlyAvailability_date_city_key" ON "public"."TrimlyAvailability"("date", "city");

-- CreateIndex
CREATE INDEX "TrimlyPaymentMethod_userId_idx" ON "public"."TrimlyPaymentMethod"("userId");

-- CreateIndex
CREATE INDEX "TrimlyPaymentMethod_userId_isDefault_idx" ON "public"."TrimlyPaymentMethod"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "TrimlyWebhookEvent_eventType_processedAt_idx" ON "public"."TrimlyWebhookEvent"("eventType", "processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrimlyWebhookEvent_provider_eventId_key" ON "public"."TrimlyWebhookEvent"("provider", "eventId");

-- AddForeignKey
ALTER TABLE "public"."TrimlyBooking" ADD CONSTRAINT "TrimlyBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrimlyBooking" ADD CONSTRAINT "TrimlyBooking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."TrimlyService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrimlyPayment" ADD CONSTRAINT "TrimlyPayment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."TrimlyBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrimlyPayment" ADD CONSTRAINT "TrimlyPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."TrimlySubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrimlySubscription" ADD CONSTRAINT "TrimlySubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrimlySubscription" ADD CONSTRAINT "TrimlySubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."TrimlyPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrimlyPaymentMethod" ADD CONSTRAINT "TrimlyPaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
