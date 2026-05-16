/**
 * POST /api/bookings/create
 *
 * Persists a TrimlyBooking row in `pending` payment status. Returns the
 * bookingId so the next step (payment) can reference it. The booking
 * itself is not confirmed until Paystack webhooks back with charge.success.
 *
 * ANONYMOUS BOOKINGS ALLOWED — Trimly customers don't have to sign up
 * before booking. If a cal.diy User with the supplied email already
 * exists we link to them; otherwise we create a placeholder User row
 * with the supplied email + name so the booking has a real FK.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies, headers } from "next/headers";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import prisma from "@calcom/prisma";

import { buildLegacyRequest } from "@lib/buildLegacyCtx";
import { normalisePhone } from "@lib/trimly/phone";
import { quote } from "@lib/trimly/pricing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  serviceSlug: z.enum(["standard", "executive", "beard", "household"]),
  city: z.enum(["Nakuru", "Nairobi"]),
  scheduledFor: z.string().datetime(),
  address: z.object({
    estate: z.string().min(1).max(120),
    addressLine1: z.string().min(1).max(200),
    addressLine2: z.string().max(200).optional(),
    notes: z.string().max(500).optional(),
  }),
  customer: z.object({
    email: z.string().email(),
    name: z.string().min(1).max(120),
    phone: z.string().min(7),
  }),
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

  // Phone normalisation — surface a clean error if the format is unparseable.
  let phone: string;
  try {
    phone = normalisePhone(data.customer.phone);
  } catch (err) {
    return NextResponse.json(
      {
        error: "invalid_phone",
        message: err instanceof Error ? err.message : "Could not parse phone",
      },
      { status: 400 }
    );
  }

  // Server-side authoritative price — never trust the client's number.
  const priceQuote = quote(data.serviceSlug, data.city);

  // Nairobi lead-time guard (5 days, per Trimly brief §7.2).
  if (data.city === "Nairobi") {
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
    const leadMs = new Date(data.scheduledFor).getTime() - Date.now();
    if (leadMs < fiveDaysMs) {
      return NextResponse.json(
        {
          error: "insufficient_lead_time",
          message: "Nairobi visits need 5 days notice. Pick a later date.",
        },
        { status: 400 }
      );
    }
  }

  // Look up the seeded TrimlyService row by slug — the FK requires the cuid.
  const service = await prisma.trimlyService.findUnique({
    where: { slug: data.serviceSlug },
    select: { id: true, isActive: true },
  });
  if (!service || !service.isActive) {
    return NextResponse.json(
      { error: "service_unavailable", message: "That service isn't bookable right now." },
      { status: 409 }
    );
  }

  // Use the logged-in session user if available; otherwise find-or-create by email.
  const session = await getServerSession({
    req: buildLegacyRequest(await headers(), await cookies()),
  });

  let userId: number;
  if (session?.user?.id) {
    // Logged in — link booking to session user, update their phone
    await prisma.user.update({
      where: { id: session.user.id },
      data: { trimlyPhone: phone },
    });
    userId = session.user.id;
  } else {
    // Anonymous — find or create by email
    const user = await prisma.user.upsert({
      where: { email: data.customer.email.toLowerCase() },
      update: { name: data.customer.name, trimlyPhone: phone },
      create: {
        email: data.customer.email.toLowerCase(),
        name: data.customer.name,
        username: null,
        trimlyPhone: phone,
      },
      select: { id: true },
    });
    userId = user.id;
  }

  const booking = await prisma.trimlyBooking.create({
    data: {
      userId,
      serviceId: service.id,
      scheduledFor: new Date(data.scheduledFor),
      addressLine1: data.address.addressLine1,
      addressLine2: data.address.addressLine2,
      estate: data.address.estate,
      city: data.city,
      notes: data.address.notes,
      totalKES: priceQuote.amountKES,
      paymentMethod: "pending",
      paymentStatus: "pending",
      bookingStatus: "pending",
    },
    select: { id: true },
  });

  // Create a Cal.diy Booking record so it shows on the operator's calendar.
  // This links Trimly's custom booking flow to Cal.diy's scheduling engine.
  let calBookingUid: string | undefined;
  const operatorUsername = process.env.TRIMLY_OPERATOR_USERNAME;
  if (operatorUsername) {
    try {
      const operator = await prisma.user.findFirst({
        where: { username: operatorUsername },
        select: { id: true, email: true },
      });
      if (operator) {
        // Find the operator's first event type to attach the booking to
        const eventType = await prisma.eventType.findFirst({
          where: { userId: operator.id },
          select: { id: true, length: true, slug: true },
        });
        if (eventType) {
          const startTime = new Date(data.scheduledFor);
          const endTime = new Date(startTime.getTime() + (eventType.length ?? 45) * 60 * 1000);

          const calBooking = await prisma.booking.create({
            data: {
              uid: `trimly-${booking.id}`,
              title: `Trimly: ${priceQuote.serviceName} — ${data.customer.name}`,
              startTime,
              endTime,
              userId: operator.id,
              eventTypeId: eventType.id,
              status: "PENDING",
              location: `${data.address.addressLine1}, ${data.address.estate}, ${data.city}`,
              description: data.address.notes || undefined,
              attendees: {
                create: {
                  email: data.customer.email.toLowerCase(),
                  name: data.customer.name,
                  timeZone: "Africa/Nairobi",
                },
              },
            },
            select: { uid: true },
          });
          calBookingUid = calBooking.uid;
        }
      }
    } catch (err) {
      // Non-fatal — the Trimly booking is still valid without the Cal record
      console.error("[bookings/create] Cal.diy booking creation failed:", err);
    }
  }

  return NextResponse.json({
    bookingId: booking.id,
    calBookingUid,
    quote: priceQuote,
    normalisedPhone: phone,
  });
}
