/**
 * POST /api/operator/availability/block
 *
 * Block or unblock a single date for booking. The booking-quote endpoint
 * filters out blocked days when serving the customer's slot picker.
 *
 * Idempotent via @@unique([date, city]) — we upsert.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@calcom/prisma";

import { requireOperatorFromHeaders } from "../../_utils/require-operator-from-headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  blocked: z.boolean(),
  reason: z.string().max(200).optional(),
  city: z.enum(["Nakuru", "Nairobi"]).optional(),
});

export async function POST(req: Request) {
  const operator = await requireOperatorFromHeaders();
  if (!operator.ok) {
    return NextResponse.json({ error: operator.reason }, { status: operator.status });
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
  const { date, blocked, reason, city } = parsed.data;
  const targetCity = city ?? "Nakuru";
  const dateObj = new Date(`${date}T00:00:00.000Z`);

  await prisma.trimlyAvailability.upsert({
    where: { date_city: { date: dateObj, city: targetCity } },
    update: { isBlocked: blocked, reason: reason ?? null },
    create: {
      date: dateObj,
      startTime: "09:00",
      endTime: "17:00",
      city: targetCity,
      isBlocked: blocked,
      reason: reason ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
