/**
 * PATCH /api/account/profile — update name, phone, preferred city,
 * preferred contact. Email changes go through cal.diy's /settings.
 *
 * Phone is normalised server-side so the renewal cron and booking flow
 * always read one canonical form.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@calcom/prisma";

import { normalisePhone } from "@lib/trimly/phone";

import { requireCustomerFromHeaders } from "../_utils/require-customer-from-headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(7),
  preferredCity: z.enum(["Nakuru", "Nairobi"]),
  preferredContact: z.enum(["whatsapp", "email", "sms"]),
});

export async function PATCH(req: Request) {
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

  let normalisedPhone: string;
  try {
    normalisedPhone = normalisePhone(parsed.data.phone);
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_phone", message: err instanceof Error ? err.message : "Could not parse phone" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: customer.user.id },
    data: {
      name: parsed.data.name,
      trimlyPhone: normalisedPhone,
      trimlyPreferredCity: parsed.data.preferredCity,
      trimlyPreferredContact: parsed.data.preferredContact,
    },
  });

  return NextResponse.json({ ok: true, normalisedPhone });
}
