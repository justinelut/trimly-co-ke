/**
 * POST /api/account/subscription/checkout
 *
 * Creates a TrimlySubscription record (pending payment).
 * Payment is handled separately via /api/payments/charge (inline card or M-Pesa).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies, headers } from "next/headers";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import prisma from "@calcom/prisma";

import { buildLegacyRequest } from "@lib/buildLegacyCtx";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  planSlug: z.enum(["starter", "regular", "executive"]),
  billing: z.enum(["monthly", "yearly"]).default("monthly"),
});

export async function POST(req: Request) {
  const session = await getServerSession({
    req: buildLegacyRequest(await headers(), await cookies()),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { planSlug, billing } = parsed.data;

  const plan = await prisma.trimlyPlan.findUnique({
    where: { slug: planSlug },
    select: { id: true, name: true, priceKES: true, cutsPerMonth: true, isActive: true },
  });

  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
  }

  // Cancel any existing active subscription (plan change)
  await prisma.trimlySubscription.updateMany({
    where: { userId: session.user.id, status: { in: ["active", "past_due"] } },
    data: { status: "cancelled", cancelAtPeriodEnd: true },
  });

  // Create the subscription record (payment handled by /api/payments/charge)
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + (billing === "yearly" ? 12 : 1));

  const subscription = await prisma.trimlySubscription.create({
    data: {
      userId: session.user.id,
      planId: plan.id,
      status: "pending",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cutsRemaining: plan.cutsPerMonth,
      paymentMethod: "card",
    },
  });

  return NextResponse.json({
    subscriptionId: subscription.id,
    reference: subscription.id,
  });
}
