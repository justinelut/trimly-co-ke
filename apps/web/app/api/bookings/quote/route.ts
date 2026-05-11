/**
 * POST /api/bookings/quote
 *
 * Server-side price resolver. The client NEVER computes price — it asks
 * here. This prevents a malicious client from forging a Nakuru rate on a
 * Nairobi booking. Pricing rules live in lib/trimly/pricing.ts.
 *
 * Body: { serviceSlug: ServiceSlug, city: City }
 * Response: PriceQuote
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { quote } from "@lib/trimly/pricing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  serviceSlug: z.enum(["standard", "executive", "beard", "household"]),
  city: z.enum(["Nakuru", "Nairobi"]),
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
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  }

  const result = quote(parsed.data.serviceSlug, parsed.data.city);
  return NextResponse.json(result, { status: 200 });
}
