/**
 * POST /api/auth/trimly-signup
 *
 * Captures name + email + (optional) phone during signup. Upserts the
 * User row in cal's schema, normalising the phone server-side so the
 * renewal cron and booking flow read one canonical form.
 *
 * The CLIENT then calls signIn("email", { email }) to trigger the
 * NextAuth magic-link send (which goes through our overridden
 * sendVerificationRequest → Resend + MagicLinkEmail).
 *
 * Why split: NextAuth's email provider only takes an email; we can't
 * pass name/phone through its standard flow. Upserting upfront lets
 * us persist those fields BEFORE the user clicks the link.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@calcom/prisma";

import { normalisePhone } from "@lib/trimly/phone";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().min(7).optional(),
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
  const data = parsed.data;

  let normalisedPhone: string | undefined;
  if (data.phone) {
    try {
      normalisedPhone = normalisePhone(data.phone);
    } catch (err) {
      return NextResponse.json(
        { error: "invalid_phone", message: err instanceof Error ? err.message : "Could not parse phone" },
        { status: 400 }
      );
    }
  }

  // Upsert by email. If the customer previously booked anonymously their
  // User row already exists; we just refresh name + trimlyPhone.
  await prisma.user.upsert({
    where: { email: data.email.toLowerCase() },
    update: {
      name: data.name,
      ...(normalisedPhone ? { trimlyPhone: normalisedPhone } : {}),
    },
    create: {
      email: data.email.toLowerCase(),
      name: data.name,
      username: null,
      ...(normalisedPhone ? { trimlyPhone: normalisedPhone } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
