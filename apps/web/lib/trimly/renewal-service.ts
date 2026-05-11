/**
 * M-Pesa renewal service. Activated against Prisma.
 *
 * Daily at 08:00 EAT, two phases:
 *   1. Past-due sweep — mark stale renewals
 *   2. Fresh STK push — for subs renewing in ≤ 24 h
 *
 * Per-subscription errors are caught so one bad row doesn't kill the run.
 */
import prisma from "@calcom/prisma";

import { notifyRenewalPrompt } from "./messaging/notify-renewal-prompt";
import { chargeMobileMoney } from "./paystack";

export interface RenewalSummary {
  pastDueSweep: { checked: number; marked: number };
  renewalAttempts: { found: number; stkSent: number; failed: number };
  errors: Array<{ subscriptionId: string; reason: string }>;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function runMpesaRenewalCron(): Promise<RenewalSummary> {
  const summary: RenewalSummary = {
    pastDueSweep: { checked: 0, marked: 0 },
    renewalAttempts: { found: 0, stkSent: 0, failed: 0 },
    errors: [],
  };

  await markStalePastDue(summary);
  await pushFreshStkPrompts(summary);

  return summary;
}

// =============================================================================
// PHASE 1 — sweep stale renewals into past_due
// =============================================================================

async function markStalePastDue(summary: RenewalSummary): Promise<void> {
  const yesterday = new Date(Date.now() - ONE_DAY_MS);

  // Active M-Pesa subs whose period has lapsed AND no succeeded payment
  // recorded in the last 24 h. These had a renewal attempt yesterday
  // that the customer never approved.
  const stale = await prisma.trimlySubscription.findMany({
    where: {
      paymentMethod: "mpesa",
      status: "active",
      currentPeriodEnd: { lt: new Date() },
      payments: {
        none: {
          status: "succeeded",
          createdAt: { gte: yesterday },
        },
      },
    },
    select: { id: true },
  });

  summary.pastDueSweep.checked = stale.length;
  if (stale.length === 0) return;

  const result = await prisma.trimlySubscription.updateMany({
    where: { id: { in: stale.map((s) => s.id) } },
    data: { status: "past_due" },
  });
  summary.pastDueSweep.marked = result.count;
}

// =============================================================================
// PHASE 2 — push STK prompts for subs renewing in the next 24h
// =============================================================================

async function pushFreshStkPrompts(summary: RenewalSummary): Promise<void> {
  const cutoff = new Date(Date.now() + ONE_DAY_MS);

  const subs = await prisma.trimlySubscription.findMany({
    where: {
      paymentMethod: "mpesa",
      status: "active",
      currentPeriodEnd: { lte: cutoff, gte: new Date() },
    },
    select: {
      id: true,
      plan: { select: { name: true, priceKES: true } },
      user: { select: { email: true, trimlyPhone: true } },
    },
  });

  summary.renewalAttempts.found = subs.length;
  if (subs.length === 0) return;

  for (const sub of subs) {
    try {
      const email = sub.user.email;
      const phone = sub.user.trimlyPhone;
      if (!email || !phone) {
        throw new Error("missing email or trimlyPhone on linked user");
      }

      const result = await chargeMobileMoney({
        email,
        amountKobo: sub.plan.priceKES * 100,
        phone,
        // "sub:" prefix tells the webhook this is a subscription renewal
        // — see settle-payment.classifyMetadataBookingId.
        bookingId: `sub:${sub.id}`,
      });

      // Persist the pending payment immediately. The webhook (or the
      // reconciliation cron) will flip it to succeeded once the customer
      // approves the STK.
      await prisma.trimlyPayment.create({
        data: {
          subscriptionId: sub.id,
          provider: "paystack",
          providerReference: result.reference,
          channel: "mobile_money",
          amountKES: sub.plan.priceKES,
          status: "pending",
        },
      });

      summary.renewalAttempts.stkSent += 1;

      // Email heads-up about the prompt — fire-and-forget.
      notifyRenewalPrompt({
        subscriptionId: sub.id,
        reference: result.reference,
        amountKES: sub.plan.priceKES,
      }).catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[renewal] notify-renewal-prompt threw", err);
      });

      // eslint-disable-next-line no-console
      console.info("[renewal] STK sent", {
        subscriptionId: sub.id,
        reference: result.reference,
        amountKES: sub.plan.priceKES,
      });
    } catch (err) {
      summary.renewalAttempts.failed += 1;
      summary.errors.push({
        subscriptionId: sub.id,
        reason: err instanceof Error ? err.message : "unknown",
      });
      // eslint-disable-next-line no-console
      console.error("[renewal] STK push failed for sub", sub.id, err);
    }
  }
}
