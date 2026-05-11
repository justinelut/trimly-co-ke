/**
 * POST /api/payments/charge
 *
 * Initiates a Paystack charge for a booking. Two channels:
 *
 *   1. mobile_money — payload { channel: "mobile_money", phone, email, bookingId }
 *      Server normalises the phone, calls Paystack /charge with
 *      mobile_money payload. Paystack issues an STK push to the customer's
 *      handset; the response carries status="pay_offline" until they
 *      confirm. The front-end then polls /api/payments/status.
 *
 *   2. card — payload { channel: "card", encryptedCard, email, bookingId }
 *      encryptedCard is the opaque ciphertext produced client-side by
 *      Paystack's encrypt() helper using our PAYSTACK_PUBLIC_KEY. Trimly
 *      servers NEVER see raw card details — we stay out of PCI scope.
 *      Response carries one of: success | send_pin | send_otp | open_url | failed.
 *      The front-end handles each branch in OUR OWN UI.
 *
 * NO DARAJA. NO M-PESA DIRECT API. NO PAYSTACK-HOSTED CHECKOUT REDIRECT.
 * Everything routes through Paystack /charge.
 *
 * Customer email comes from the body (anonymous bookings allowed).
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { normalisePhone } from "@lib/trimly/phone";
import { chargeCard, chargeMobileMoney } from "@lib/trimly/paystack";
import { quote } from "@lib/trimly/pricing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MobileMoneyBody = z.object({
  channel: z.literal("mobile_money"),
  bookingId: z.string().min(1),
  serviceSlug: z.enum(["standard", "executive", "beard", "household"]),
  city: z.enum(["Nakuru", "Nairobi"]),
  email: z.string().email(),
  phone: z.string().min(7),
});

const CardBody = z.object({
  channel: z.literal("card"),
  bookingId: z.string().min(1),
  serviceSlug: z.enum(["standard", "executive", "beard", "household"]),
  city: z.enum(["Nakuru", "Nairobi"]),
  email: z.string().email(),
  /** Paystack-encrypted card blob — opaque to us. */
  encryptedCard: z.string().min(1),
});

const BodySchema = z.discriminatedUnion("channel", [MobileMoneyBody, CardBody]);

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

  const input = parsed.data;
  const priceQuote = quote(input.serviceSlug, input.city);

  try {
    if (input.channel === "mobile_money") {
      const phone = normalisePhone(input.phone);

      // Max single M-Pesa transaction is KES 150,000 (Safaricom limit).
      // Our priciest service is well under this, but guard anyway in case
      // someone bundles future household upsells.
      if (priceQuote.amountKES > 150_000) {
        return NextResponse.json(
          { error: "amount_exceeds_mpesa_limit", limitKES: 150_000 },
          { status: 400 }
        );
      }

      const result = await chargeMobileMoney({
        email: input.email,
        amountKobo: priceQuote.amountKobo,
        phone,
        bookingId: input.bookingId,
      });
      return NextResponse.json(result, { status: 200 });
    }

    // input.channel === "card"
    const result = await chargeCard({
      email: input.email,
      amountKobo: priceQuote.amountKobo,
      encryptedCard: input.encryptedCard,
      bookingId: input.bookingId,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[payments/charge] paystack error", err);
    return NextResponse.json(
      { error: "paystack_error", message: err instanceof Error ? err.message : "unknown" },
      { status: 502 }
    );
  }
}
