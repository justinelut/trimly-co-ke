/**
 * POST /api/payments/charge/submit-otp
 *
 * Called by PaymentCard.tsx when Paystack's initial /charge response was
 * status="send_otp". The customer typed the six-digit OTP into our own
 * UI (NEVER Paystack's), and we POST it here. We forward to Paystack's
 * /charge/submit_otp endpoint via the wrapper.
 *
 * The response shape is the same ChargeResponse used by /charge — the
 * card flow can reuse handleChargeResponse() without branching.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { submitOtp } from "@lib/trimly/paystack";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  reference: z.string().min(1),
  otp: z.string().regex(/^\d{4,8}$/, "OTP must be 4–8 digits"),
});

export async function POST(req: Request) {
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

  try {
    const result = await submitOtp(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[payments/charge/submit-otp] paystack error", err);
    return NextResponse.json(
      { error: "paystack_error", message: err instanceof Error ? err.message : "unknown" },
      { status: 502 }
    );
  }
}
