/**
 * Paystack webhook payload schemas + event-type dispatch table.
 *
 * Activated against Prisma — all charge.success / charge.failed
 * effects route through settle-payment.ts so the webhook path and
 * the reconciliation cron produce identical database state.
 */
import { z } from "zod";

import prisma from "@calcom/prisma";

import { verify as paystackVerify } from "./paystack";
import { classifyMetadataBookingId, settleFailed, settleSucceeded } from "./settle-payment";

// =============================================================================
// PAYLOAD SCHEMAS
// =============================================================================

const EnvelopeSchema = z.object({
  event: z.string(),
  data: z.object({ id: z.union([z.string(), z.number()]) }).passthrough(),
});
export type PaystackEnvelope = z.infer<typeof EnvelopeSchema>;

const ChargeDataSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    reference: z.string(),
    status: z.string(),
    amount: z.number(), // kobo / cents — divide by 100 for KES
    currency: z.string().optional(),
    gateway_response: z.string().optional(),
    channel: z.string().optional(),
    customer: z.object({ email: z.string().email().optional() }).passthrough().optional(),
    metadata: z.object({ bookingId: z.string().optional() }).passthrough().optional(),
  })
  .passthrough();

const SubscriptionDataSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    subscription_code: z.string(),
    customer: z
      .object({ customer_code: z.string().optional(), email: z.string().email().optional() })
      .passthrough()
      .optional(),
    plan: z.object({ plan_code: z.string().optional() }).passthrough().optional(),
    status: z.string().optional(),
    next_payment_date: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .passthrough();

const InvoiceDataSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    subscription: z.object({ subscription_code: z.string().optional() }).passthrough().optional(),
    customer: z.object({ email: z.string().email().optional() }).passthrough().optional(),
    paid: z.boolean().optional(),
    amount: z.number().optional(),
    transaction: z
      .object({ reference: z.string().optional(), status: z.string().optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type ChargeData = z.infer<typeof ChargeDataSchema>;
export type SubscriptionData = z.infer<typeof SubscriptionDataSchema>;
export type InvoiceData = z.infer<typeof InvoiceDataSchema>;

// =============================================================================
// HANDLER SHAPE
// =============================================================================

export interface HandlerContext {
  eventId: string;
  eventType: string;
  rawPayload: unknown;
}

export type HandlerResult =
  | { ok: true; action: string; reference?: string; bookingId?: string }
  | { ok: false; reason: string };

export type EventHandler = (data: unknown, ctx: HandlerContext) => Promise<HandlerResult>;

// =============================================================================
// HANDLERS — one per event type
// =============================================================================

function normaliseChannel(raw: string | undefined): "mobile_money" | "card" {
  return raw === "mobile_money" ? "mobile_money" : "card";
}

/** charge.success — re-verify, then settle through the shared helper. */
async function handleChargeSuccess(rawData: unknown, ctx: HandlerContext): Promise<HandlerResult> {
  const parsed = ChargeDataSchema.safeParse(rawData);
  if (!parsed.success) return { ok: false, reason: "invalid_payload" };
  const data = parsed.data;

  // Defense in depth — never trust the webhook payload alone.
  const verified = await paystackVerify(data.reference);
  if (verified.status !== "success") {
    return { ok: false, reason: `verify_returned_${verified.status}` };
  }

  const ids = classifyMetadataBookingId(data.metadata?.bookingId);
  await settleSucceeded({
    reference: data.reference,
    bookingId: ids.bookingId,
    subscriptionId: ids.subscriptionId,
    amountKES: Math.round(data.amount / 100),
    channel: normaliseChannel(data.channel),
    rawCallback: ctx.rawPayload,
  });

  // Also mark Cal.diy Payment record as paid (for event-type payments via Paystack app)
  try {
    const calPayment = await prisma.payment.findFirst({
      where: { externalId: data.reference, success: false },
      select: { id: true, bookingId: true },
    });
    if (calPayment) {
      await prisma.payment.update({ where: { id: calPayment.id }, data: { success: true } });
      if (calPayment.bookingId) {
        await prisma.booking.update({ where: { id: calPayment.bookingId }, data: { paid: true } });
      }
    }
  } catch (err) {
    // Non-fatal — Trimly payment settlement already succeeded above
    console.error("[webhook] Cal Payment update failed (non-fatal):", err);
  }

  // Save payment method for future use (if authorization is present)
  try {
    const auth = (data as any).authorization;
    const customerEmail = data.customer?.email;
    if (auth?.authorization_code && customerEmail) {
      const user = await prisma.user.findFirst({ where: { email: customerEmail }, select: { id: true } });
      if (user) {
        const channel = normaliseChannel(data.channel);
        const existing = await prisma.trimlyPaymentMethod.findFirst({
          where: { userId: user.id, paystackAuthCode: auth.authorization_code },
        });
        if (!existing) {
          await prisma.trimlyPaymentMethod.create({
            data: {
              userId: user.id,
              kind: channel === "mobile_money" ? "mpesa" : "card",
              paystackAuthCode: auth.authorization_code,
              phone: channel === "mobile_money" ? auth.receiver_bank_account_number || null : null,
              brand: auth.brand || auth.bank || null,
              last4: auth.last4 || null,
              expMonth: auth.exp_month ? parseInt(auth.exp_month) : null,
              expYear: auth.exp_year ? parseInt(auth.exp_year) : null,
              isDefault: true,
            },
          });
        }
      }
    }
  } catch {
    // Non-fatal — payment method saving shouldn't block the webhook
  }

  return {
    ok: true,
    action: ids.subscriptionId ? "subscription_renewed" : "booking_confirmed",
    reference: data.reference,
    bookingId: ids.bookingId ?? undefined,
  };
}

/** charge.failed — settle via the failed helper. */
async function handleChargeFailed(rawData: unknown, ctx: HandlerContext): Promise<HandlerResult> {
  const parsed = ChargeDataSchema.safeParse(rawData);
  if (!parsed.success) return { ok: false, reason: "invalid_payload" };
  const data = parsed.data;

  const ids = classifyMetadataBookingId(data.metadata?.bookingId);
  await settleFailed({
    reference: data.reference,
    bookingId: ids.bookingId,
    subscriptionId: ids.subscriptionId,
    amountKES: Math.round(data.amount / 100),
    channel: normaliseChannel(data.channel),
    reason: data.gateway_response ?? "gateway_failed",
    rawCallback: ctx.rawPayload,
  });

  return {
    ok: true,
    action: "marked_failed",
    reference: data.reference,
    bookingId: ids.bookingId ?? undefined,
  };
}

/**
 * subscription.create — Paystack created the recurring object for a card
 * payer. Find our TrimlySubscription by the customer email + plan_code we
 * seeded earlier, and persist Paystack's identifiers.
 */
async function handleSubscriptionCreate(
  rawData: unknown,
  _ctx: HandlerContext
): Promise<HandlerResult> {
  const parsed = SubscriptionDataSchema.safeParse(rawData);
  if (!parsed.success) return { ok: false, reason: "invalid_payload" };
  const data = parsed.data;

  const email = data.customer?.email;
  const planCode = data.plan?.plan_code;
  if (!email || !planCode) {
    return { ok: false, reason: "missing_customer_or_plan_code" };
  }

  const updated = await prisma.trimlySubscription.updateMany({
    where: {
      user: { email },
      plan: { paystackPlanCode: planCode },
      status: { in: ["active", "past_due"] },
    },
    data: {
      paystackSubscriptionCode: data.subscription_code,
      paystackCustomerCode: data.customer?.customer_code,
    },
  });

  return updated.count > 0
    ? { ok: true, action: "subscription_recorded" }
    : { ok: false, reason: "no_matching_subscription" };
}

/** subscription.disable / subscription.not_renew — mark cancelled. */
async function handleSubscriptionDisable(
  rawData: unknown,
  _ctx: HandlerContext
): Promise<HandlerResult> {
  const parsed = SubscriptionDataSchema.safeParse(rawData);
  if (!parsed.success) return { ok: false, reason: "invalid_payload" };
  const data = parsed.data;

  await prisma.trimlySubscription.updateMany({
    where: { paystackSubscriptionCode: data.subscription_code },
    data: { status: "cancelled", cancelAtPeriodEnd: true },
  });

  return { ok: true, action: "subscription_cancelled" };
}

/** invoice.create / invoice.update — log only, no state change. */
async function handleInvoiceCreate(
  _rawData: unknown,
  _ctx: HandlerContext
): Promise<HandlerResult> {
  return { ok: true, action: "invoice_noted" };
}

/** invoice.payment_failed — Paystack does NOT auto-retry; flag past_due. */
async function handleInvoicePaymentFailed(
  rawData: unknown,
  _ctx: HandlerContext
): Promise<HandlerResult> {
  const parsed = InvoiceDataSchema.safeParse(rawData);
  if (!parsed.success) return { ok: false, reason: "invalid_payload" };
  const data = parsed.data;
  const code = data.subscription?.subscription_code;
  if (!code) return { ok: false, reason: "missing_subscription_code" };

  await prisma.trimlySubscription.updateMany({
    where: { paystackSubscriptionCode: code },
    data: { status: "past_due" },
  });

  // TODO: enqueue a "your card was declined" email via Resend once that
  // wire-up lands. Until then operators see this surface in /operator/clients
  // (subscriptionStatus column) and /operator/payments (pending KPI).
  return { ok: true, action: "subscription_past_due" };
}

// =============================================================================
// DISPATCH TABLE
// =============================================================================

export const EVENT_HANDLERS: Record<string, EventHandler> = {
  "charge.success": handleChargeSuccess,
  "charge.failed": handleChargeFailed,
  "subscription.create": handleSubscriptionCreate,
  "subscription.disable": handleSubscriptionDisable,
  "subscription.not_renew": handleSubscriptionDisable,
  "invoice.create": handleInvoiceCreate,
  "invoice.update": handleInvoiceCreate,
  "invoice.payment_failed": handleInvoicePaymentFailed,
};

export function parseEnvelope(rawJson: unknown):
  | { ok: true; envelope: PaystackEnvelope }
  | { ok: false; reason: string } {
  const parsed = EnvelopeSchema.safeParse(rawJson);
  if (!parsed.success) {
    return { ok: false, reason: "invalid_envelope" };
  }
  return { ok: true, envelope: parsed.data };
}
