/**
 * GET /api/payments/status?reference=...
 *
 * Polled by the front-end every 3 seconds (up to 200 seconds total) while
 * the customer is approving an M-Pesa STK prompt or completing a 3DS card
 * challenge. Returns the latest Paystack /transaction/verify result, mapped
 * into our PaymentStatus shape.
 *
 * The webhook handler at /api/webhooks/paystack is the authoritative source
 * for "did this payment succeed" — this endpoint is for UX only.
 */
import { NextResponse } from "next/server";

import { verify } from "@lib/trimly/paystack";
import type { PaymentStatus } from "@lib/trimly/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "missing_reference" }, { status: 400 });
  }

  try {
    const v = await verify(reference);
    const bookingId = (v.rawMetadata?.bookingId as string | undefined) ?? "";
    const status: PaymentStatus = {
      reference,
      status: v.status,
      amountKES: v.amountKES,
      bookingId,
      gatewayMessage: v.gatewayMessage,
    };
    return NextResponse.json(status, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[payments/status] verify error", err);
    return NextResponse.json(
      { error: "verify_failed", message: err instanceof Error ? err.message : "unknown" },
      { status: 502 }
    );
  }
}
