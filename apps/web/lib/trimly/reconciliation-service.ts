/**
 * Payment reconciliation service. Activated against Prisma.
 *
 * Every 5 minutes, finds TrimlyPayment rows in pending state older than
 * 3 minutes, calls Paystack /transaction/verify, and routes through the
 * shared settle-payment helper so the database state is identical to the
 * webhook path.
 */
import prisma from "@calcom/prisma";

import { verify } from "./paystack";
import { settleFailed, settleSucceeded } from "./settle-payment";

const RECONCILE_AFTER_MS = 3 * 60 * 1000;
const MOBILE_MONEY_TIMEOUT_MS = 10 * 60 * 1000;
const CARD_TIMEOUT_MS = 30 * 60 * 1000;

export interface ReconciliationSummary {
  checked: number;
  settled: number;
  failed: number;
  stillPending: number;
  timedOut: number;
  errors: Array<{ reference: string; reason: string }>;
}

interface PendingPayment {
  id: string;
  reference: string;
  channel: "mobile_money" | "card";
  amountKES: number;
  ageMs: number;
  bookingId: string | null;
  subscriptionId: string | null;
}

export async function runReconciliationCron(): Promise<ReconciliationSummary> {
  const summary: ReconciliationSummary = {
    checked: 0,
    settled: 0,
    failed: 0,
    stillPending: 0,
    timedOut: 0,
    errors: [],
  };

  const pending = await fetchPendingPayments();
  summary.checked = pending.length;
  if (pending.length === 0) return summary;

  for (const payment of pending) {
    try {
      await reconcileOne(payment, summary);
    } catch (err) {
      summary.errors.push({
        reference: payment.reference,
        reason: err instanceof Error ? err.message : "unknown",
      });
      // eslint-disable-next-line no-console
      console.error("[reconciliation] verify failed for", payment.reference, err);
    }
  }
  return summary;
}

async function fetchPendingPayments(): Promise<PendingPayment[]> {
  const cutoff = new Date(Date.now() - RECONCILE_AFTER_MS);
  const rows = await prisma.trimlyPayment.findMany({
    where: {
      status: "pending",
      createdAt: { lt: cutoff },
    },
    select: {
      id: true,
      providerReference: true,
      channel: true,
      amountKES: true,
      createdAt: true,
      bookingId: true,
      subscriptionId: true,
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return rows.map((r) => ({
    id: r.id,
    reference: r.providerReference,
    channel: r.channel === "mobile_money" ? "mobile_money" : "card",
    amountKES: r.amountKES,
    ageMs: Date.now() - r.createdAt.getTime(),
    bookingId: r.bookingId,
    subscriptionId: r.subscriptionId,
  }));
}

async function reconcileOne(payment: PendingPayment, summary: ReconciliationSummary): Promise<void> {
  const verified = await verify(payment.reference);

  if (verified.status === "success") {
    await settleSucceeded({
      reference: payment.reference,
      bookingId: payment.bookingId,
      subscriptionId: payment.subscriptionId,
      amountKES: verified.amountKES || payment.amountKES,
      channel: payment.channel,
    });
    summary.settled += 1;
    return;
  }

  if (verified.status === "failed") {
    await settleFailed({
      reference: payment.reference,
      bookingId: payment.bookingId,
      subscriptionId: payment.subscriptionId,
      amountKES: payment.amountKES,
      channel: payment.channel,
      reason: verified.gatewayMessage ?? "gateway_failed",
    });
    summary.failed += 1;
    return;
  }

  // verified.status === "pending"
  const timeoutMs =
    payment.channel === "mobile_money" ? MOBILE_MONEY_TIMEOUT_MS : CARD_TIMEOUT_MS;
  if (payment.ageMs > timeoutMs) {
    await settleFailed({
      reference: payment.reference,
      bookingId: payment.bookingId,
      subscriptionId: payment.subscriptionId,
      amountKES: payment.amountKES,
      channel: payment.channel,
      reason: "reconciliation_timeout",
    });
    summary.timedOut += 1;
    return;
  }

  summary.stillPending += 1;
}

export const RECONCILIATION_CONSTANTS = {
  RECONCILE_AFTER_MS,
  MOBILE_MONEY_TIMEOUT_MS,
  CARD_TIMEOUT_MS,
} as const;
