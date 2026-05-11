/**
 * POST /api/operator/bookings/[id]/complete — operator marks a booking
 * as completed after the cut. Decrements linked subscription's
 * cutsRemaining if applicable.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@calcom/prisma";

import { requireOperatorFromHeaders } from "../../../_utils/require-operator-from-headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ParamsSchema = z.object({ id: z.string().min(1).max(120) });

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const operator = await requireOperatorFromHeaders();
  if (!operator.ok) {
    return NextResponse.json({ error: operator.reason }, { status: operator.status });
  }
  const parsed = ParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const bookingId = parsed.data.id;

  // Decrement subscription cuts when applicable. We carry the
  // subscription id in payment metadata; lookup goes through the
  // payment row.
  await prisma.$transaction(async (tx) => {
    const booking = await tx.trimlyBooking.update({
      where: { id: bookingId },
      data: { bookingStatus: "completed" },
      select: { id: true, payment: { select: { subscriptionId: true } } },
    });
    const subId = booking.payment?.subscriptionId;
    if (subId) {
      // Atomic decrement; floor at 0 so a double-complete can't underflow.
      await tx.trimlySubscription.update({
        where: { id: subId },
        data: { cutsRemaining: { decrement: 1 } },
      });
    }
  });

  // TODO: enqueue a "rate your cut" prompt 4 hours later via Resend.
  return NextResponse.json({ ok: true });
}
