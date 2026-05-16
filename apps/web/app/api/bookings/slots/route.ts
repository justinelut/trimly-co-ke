/**
 * GET /api/bookings/slots?city=Nakuru&date=2026-05-20
 *
 * Reads the operator's REAL Cal.diy Schedule + Availability to generate
 * available time slots. No hardcoded fallbacks — if the operator hasn't
 * set availability in Cal.diy, no slots are returned.
 */
import { NextResponse } from "next/server";

import prisma from "@calcom/prisma";

import type { City } from "@lib/trimly/types";

export const dynamic = "force-dynamic";

// Slot interval in minutes — generates slots every N minutes within the availability window
const SLOT_INTERVAL = 90;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const city = url.searchParams.get("city") as City | null;
  const dateStr = url.searchParams.get("date"); // YYYY-MM-DD

  if (!city || !dateStr) {
    return NextResponse.json({ error: "city and date required" }, { status: 400 });
  }

  const date = new Date(dateStr + "T00:00:00");
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ...

  // Nairobi lead-time guard (5 days)
  if (city === "Nairobi") {
    const leadMs = date.getTime() - Date.now();
    if (leadMs < 5 * 24 * 60 * 60 * 1000) {
      return NextResponse.json({ slots: [], reason: "insufficient_lead_time" });
    }
  }

  const operatorUsername = process.env.TRIMLY_OPERATOR_USERNAME;
  if (!operatorUsername) {
    return NextResponse.json({ slots: [], reason: "no_operator_configured" });
  }

  const operator = await prisma.user.findFirst({
    where: { username: operatorUsername },
    select: { id: true },
  });

  if (!operator) {
    return NextResponse.json({ slots: [], reason: "operator_not_found" });
  }

  // Get the operator's default schedule availability from Cal.diy
  const schedule = await prisma.schedule.findFirst({
    where: { userId: operator.id },
    select: { id: true },
  });

  if (!schedule) {
    return NextResponse.json({ slots: [], reason: "no_schedule" });
  }

  // Find availability rules that apply to this day of week
  const availabilityRules = await prisma.availability.findMany({
    where: {
      scheduleId: schedule.id,
      OR: [
        { days: { has: dayOfWeek } },       // recurring rule for this day
        { date: date },                      // specific date override
      ],
    },
    select: { startTime: true, endTime: true, days: true, date: true },
  });

  if (availabilityRules.length === 0) {
    return NextResponse.json({ slots: [], reason: "not_available_this_day" });
  }

  // Generate time slots from availability windows
  const allSlots: string[] = [];
  for (const rule of availabilityRules) {
    const startMinutes = rule.startTime.getHours() * 60 + rule.startTime.getMinutes();
    const endMinutes = rule.endTime.getHours() * 60 + rule.endTime.getMinutes();

    for (let m = startMinutes; m + SLOT_INTERVAL <= endMinutes; m += SLOT_INTERVAL) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      allSlots.push(`${hh}:${mm}`);
    }
  }

  // Remove duplicates and sort
  const uniqueSlots = [...new Set(allSlots)].sort();

  // Exclude slots already booked (from TrimlyBooking)
  const dayStart = new Date(dateStr + "T00:00:00");
  const dayEnd = new Date(dateStr + "T23:59:59");

  const existingBookings = await prisma.trimlyBooking.findMany({
    where: {
      scheduledFor: { gte: dayStart, lte: dayEnd },
      bookingStatus: { notIn: ["cancelled", "no_show"] },
    },
    select: { scheduledFor: true },
  });

  const takenSlots = new Set(
    existingBookings.map((b) => {
      const d = new Date(b.scheduledFor);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    })
  );

  // Also exclude slots from Cal.diy Booking table
  const calBookings = await prisma.booking.findMany({
    where: {
      userId: operator.id,
      startTime: { gte: dayStart, lte: dayEnd },
      status: { in: ["ACCEPTED", "PENDING"] },
    },
    select: { startTime: true },
  });

  for (const b of calBookings) {
    const d = new Date(b.startTime);
    takenSlots.add(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
  }

  const availableSlots = uniqueSlots.filter((s) => !takenSlots.has(s));

  return NextResponse.json({
    slots: availableSlots,
    source: "cal-schedule",
    debug: { dayOfWeek, rulesFound: availabilityRules.length, totalGenerated: uniqueSlots.length, taken: takenSlots.size },
  });
}
