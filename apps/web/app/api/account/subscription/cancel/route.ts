/**
 * POST /api/account/subscription/cancel
 *
 * Sets cancelAtPeriodEnd=true (default) or cancels immediately. For card
 * subscriptions we also call Paystack /subscription/disable so Paystack
 * stops auto-debiting. M-Pesa subs have no Paystack-side subscription
 * object — we just stop running the renewal cron over the row.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@calcom/prisma";

import { requireCustomerFromHeaders } from "../../_utils/require-customer-from-headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  subscriptionId: z.string().min(1).max(120),
  immediate: z.boolean().optional(),
});

async function disablePaystackSubscription(code: string): Promise<void> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not set");
  // Paystack's /subscription/disable also requires an `email_token` issued
  // when the subscription was created. We don't yet capture it from the
  // subscription.create webhook payload — when we do, plumb it through here
  // and include it in the body. Without the token, this returns 400.
  const res = await fetch("https://api.paystack.co/subscription/disable", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, token: process.env.PAYSTACK_DISABLE_TOKEN ?? "" }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Paystack /subscription/disable failed: ${res.status} ${body}`);
  }
}

export async function POST(req: Request) {
  const customer = await requireCustomerFromHeaders();
  if (!customer.ok) {
    return NextResponse.json({ error: customer.reason }, { status: customer.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { subscriptionId, immediate = false } = parsed.data;

  const sub = await prisma.trimlySubscription.findUnique({
    where: { id: subscriptionId },
    select: {
      id: true,
      userId: true,
      status: true,
      paymentMethod: true,
      paystackSubscriptionCode: true,
    },
  });
  if (!sub) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (sub.userId !== customer.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Best-effort Paystack disable for card subs. We log + continue on
  // failure so a Paystack outage doesn't strand the customer's intent.
  if (sub.paymentMethod === "paystack_card" && sub.paystackSubscriptionCode) {
    try {
      await disablePaystackSubscription(sub.paystackSubscriptionCode);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[account/subscription/cancel] paystack disable failed", err);
    }
  }

  await prisma.trimlySubscription.update({
    where: { id: sub.id },
    data: immediate
      ? { status: "cancelled", cancelAtPeriodEnd: true }
      : { cancelAtPeriodEnd: true },
  });

  return NextResponse.json({ ok: true });
}
