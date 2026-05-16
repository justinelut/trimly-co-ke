/**
 * settle-payment.ts — the one place that writes "this charge succeeded"
 * or "this charge failed" to the database.
 *
 * Two call sites:
 *   1. /api/webhooks/paystack — webhook handler for charge.success / charge.failed
 *   2. /api/cron/payment-reconciliation — reconciliation cron sweep
 *
 * Both must produce the same downstream side effects. The webhook is the
 * authoritative source; the cron is defense-in-depth for missed
 * deliveries. By going through this helper, both paths write the same
 * fields, in the same transaction, in the same order — so a payment
 * settled via either path looks identical in the database.
 *
 * Idempotent by design: re-calling settleSucceeded() over a payment
 * already marked succeeded is a no-op (Prisma's update with the same
 * data simply touches updatedAt).
 */
import prisma from "@calcom/prisma";
import { Prisma } from "@calcom/prisma/client";

import { notifyBookingConfirmed } from "./messaging/notify-booking-confirmed";
import { notifyPaymentFailed } from "./messaging/notify-payment-failed";

interface SettleSucceededInput {
  /** Paystack reference — the natural key we own across providers. */
  reference: string;
  bookingId?: string | null;
  subscriptionId?: string | null;
  amountKES: number;
  channel: "mobile_money" | "card";
  /** Raw provider payload for audit. Webhook supplies it; cron path can omit. */
  rawCallback?: unknown;
}

interface SettleFailedInput {
  reference: string;
  bookingId?: string | null;
  subscriptionId?: string | null;
  amountKES: number;
  channel: "mobile_money" | "card";
  reason: string;
  rawCallback?: unknown;
}

/**
 * Settle a successful charge. Upserts the TrimlyPayment row, flips the
 * linked TrimlyBooking to confirmed (if any), advances the subscription
 * cycle (if any). Wrapped in a single $transaction for atomicity.
 */
export async function settleSucceeded(input: SettleSucceededInput): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.trimlyPayment.findFirst({
      where: { providerReference: input.reference },
      select: { id: true },
    });

    if (existing) {
      await tx.trimlyPayment.update({
        where: { id: existing.id },
        data: {
          status: "succeeded",
          amountKES: input.amountKES,
          rawCallback: (input.rawCallback ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        },
      });
    } else {
      await tx.trimlyPayment.create({
        data: {
          bookingId: input.bookingId ?? null,
          subscriptionId: input.subscriptionId ?? null,
          provider: "paystack",
          providerReference: input.reference,
          channel: input.channel,
          amountKES: input.amountKES,
          status: "succeeded",
          rawCallback: (input.rawCallback ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        },
      });
    }

    if (input.bookingId) {
      await tx.trimlyBooking.update({
        where: { id: input.bookingId },
        data: { paymentStatus: "succeeded", bookingStatus: "confirmed" },
      });
    }

    if (input.subscriptionId) {
      // Advance the cycle: bump currentPeriodEnd, reset cutsRemaining from
      // the plan, and flip status from past_due → active if applicable.
      const sub = await tx.trimlySubscription.findUnique({
        where: { id: input.subscriptionId },
        select: {
          id: true,
          currentPeriodEnd: true,
          plan: { select: { cutsPerMonth: true, intervalMonths: true } },
        },
      });
      if (sub) {
        const nextEnd = new Date(sub.currentPeriodEnd);
        nextEnd.setMonth(nextEnd.getMonth() + sub.plan.intervalMonths);
        await tx.trimlySubscription.update({
          where: { id: sub.id },
          data: {
            status: "active",
            currentPeriodStart: sub.currentPeriodEnd,
            currentPeriodEnd: nextEnd,
            cutsRemaining: sub.plan.cutsPerMonth,
          },
        });
      }
    }
  });

  // Email confirmation — fire-and-forget. Never throws back: the payment
  // is already settled; an email failure shouldn't make Paystack retry.
  if (input.bookingId) {
    notifyBookingConfirmed(input.bookingId).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[settle-payment] notify-booking-confirmed threw", err);
    });
  }
}

/**
 * Settle a failed charge. Same upsert pattern but flips status to
 * failed, marks the booking cancelled (if any), and leaves
 * subscription cycle untouched — the renewal cron handles past_due
 * transitions, not us.
 */
export async function settleFailed(input: SettleFailedInput): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.trimlyPayment.upsert({
      where: { providerReference: input.reference },
      update: {
        status: "failed",
        amountKES: input.amountKES,
        rawCallback: (input.rawCallback ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
      create: {
        bookingId: input.bookingId ?? null,
        subscriptionId: input.subscriptionId ?? null,
        provider: "paystack",
        providerReference: input.reference,
        channel: input.channel,
        amountKES: input.amountKES,
        status: "failed",
        rawCallback: (input.rawCallback ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });

    if (input.bookingId) {
      await tx.trimlyBooking.update({
        where: { id: input.bookingId },
        data: { paymentStatus: "failed", bookingStatus: "cancelled" },
      });
    }
  });

  // eslint-disable-next-line no-console
  console.info("[settle-payment] marked failed", {
    reference: input.reference,
    bookingId: input.bookingId,
    subscriptionId: input.subscriptionId,
    reason: input.reason,
  });

  // Email customer with the failure reason and a retry CTA.
  if (input.bookingId) {
    notifyPaymentFailed(input.bookingId, input.reason).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[settle-payment] notify-payment-failed threw", err);
    });
  }
}

/**
 * Helper for the webhook + cron paths: a single charge can carry a
 * synthetic bookingId in its Paystack metadata. If the metadata bookingId
 * starts with "sub:" it's a subscription renewal charge, not a one-off
 * booking. This helper splits the two.
 */
export function classifyMetadataBookingId(metaBookingId: string | undefined): {
  bookingId: string | null;
  subscriptionId: string | null;
} {
  if (!metaBookingId) return { bookingId: null, subscriptionId: null };
  if (metaBookingId.startsWith("sub:")) {
    return { bookingId: null, subscriptionId: metaBookingId.slice(4) };
  }
  return { bookingId: metaBookingId, subscriptionId: null };
}
