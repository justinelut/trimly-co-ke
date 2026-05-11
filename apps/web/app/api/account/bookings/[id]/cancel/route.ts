/**
 * POST /api/account/bookings/[id]/cancel
 *
 * Cancels a booking the customer owns. Rules:
 *   > 4 h before appointment → free
 *   ≤ 4 h                     → 50 % late fee (we keep the deposit)
 *   No-show                    → 100 % (operator-handled)
 *
 * Refund execution itself is out of band — M-Pesa via Paystack support
 * (2 biz days); cards via the Paystack dashboard (instant). This
 * endpoint just flips state and computes the fee for the response.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@calcom/prisma";

import { requireCustomerFromHeaders } from "../../../_utils/require-customer-from-headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ParamsSchema = z.object({ id: z.string().min(1).max(120) });
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const customer = await requireCustomerFromHeaders();
  if (!customer.ok) {
    return NextResponse.json({ error: customer.reason }, { status: customer.status });
  }

  const parsed = ParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const bookingId = parsed.data.id;

  const booking = await prisma.trimlyBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      scheduledFor: true,
      bookingStatus: true,
      totalKES: true,
    },
  });
  if (!booking) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (booking.userId !== customer.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (booking.bookingStatus !== "confirmed") {
    return NextResponse.json(
      {
        error: "invalid_state",
        message: `Cannot cancel a ${booking.bookingStatus} booking.`,
      },
      { status: 409 }
    );
  }

  const leadMs = booking.scheduledFor.getTime() - Date.now();
  const lateFeeKES = leadMs < FOUR_HOURS_MS ? Math.round(booking.totalKES / 2) : 0;

  await prisma.trimlyBooking.update({
    where: { id: booking.id },
    data: { bookingStatus: "cancelled" },
  });

  // TODO: enqueue an email to the customer with the fee + refund timeline,
  // and a notification to the operator. Lands when Resend is wired.

  return NextResponse.json({ ok: true, lateFeeKES });
}
