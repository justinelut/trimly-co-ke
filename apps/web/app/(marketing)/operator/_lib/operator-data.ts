/**
 * Operator data adapter — activated against Prisma.
 *
 * DTO boundary: pages see only types from operator-types.ts; row shapes
 * stay inside this file. Queries use `select` projections.
 */
import prisma from "@calcom/prisma";

import type {
  AvailabilityDay,
  ClientSummaryDto,
  RevenuePoint,
  RevenueSnapshot,
  StopDto,
  WeekViewDay,
} from "./operator-types";
import type { City } from "@lib/trimly/types";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(date: Date): string {
  // YYYY-MM-DD in the server's local timezone. K8s deployments run with
  // Africa/Nairobi, so this matches the operator's calendar day.
  return date.toISOString().slice(0, 10);
}

// =============================================================================
// TODAY — chronological stops
// =============================================================================

export async function fetchTodayStops(): Promise<StopDto[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const rows = await prisma.trimlyBooking.findMany({
    where: {
      scheduledFor: { gte: start, lte: end },
      bookingStatus: { in: ["confirmed", "in_progress"] },
    },
    select: {
      id: true,
      scheduledFor: true,
      addressLine1: true,
      addressLine2: true,
      estate: true,
      city: true,
      totalKES: true,
      bookingStatus: true,
      service: { select: { name: true, durationMin: true } },
      user: { select: { name: true, email: true, trimlyPhone: true } },
    },
    orderBy: { scheduledFor: "asc" },
  });

  const stops: StopDto[] = rows.map((r) => ({
    bookingId: r.id,
    scheduledFor: r.scheduledFor.toISOString(),
    durationMin: r.service.durationMin,
    serviceName: r.service.name,
    status: r.bookingStatus as StopDto["status"],
    totalKES: r.totalKES,
    customer: {
      name: r.user.name ?? r.user.email,
      phone: r.user.trimlyPhone ?? "",
      email: r.user.email,
    },
    address: {
      line1: r.addressLine1,
      line2: r.addressLine2 ?? undefined,
      estate: r.estate,
      city: r.city as City,
    },
  }));

  // Travel hints: stub for now — populated by Google Maps Distance Matrix
  // once that integration lands. We attach the next stop's estate so the
  // UI can render "→ Naka" until real ETAs replace it.
  for (let i = 0; i < stops.length - 1; i += 1) {
    stops[i].travelHint = `~ ${stops[i + 1].address.estate}`;
  }

  return stops;
}

// =============================================================================
// CALENDAR — 7-day week view
// =============================================================================

export async function fetchWeek(): Promise<WeekViewDay[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const [bookings, blocks] = await prisma.$transaction([
    prisma.trimlyBooking.findMany({
      where: {
        scheduledFor: { gte: start, lt: end },
        bookingStatus: { in: ["confirmed", "in_progress"] },
      },
      select: {
        scheduledFor: true,
        city: true,
        service: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { scheduledFor: "asc" },
    }),
    prisma.trimlyAvailability.findMany({
      where: { date: { gte: start, lt: end }, isBlocked: true },
      select: { date: true },
    }),
  ]);

  const blockedKeys = new Set(blocks.map((b) => dateKey(b.date)));
  const todayKey = dateKey(new Date());

  const days: WeekViewDay[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dateKey(d);
    const dayBookings = bookings
      .filter((b) => dateKey(b.scheduledFor) === key)
      .map((b) => ({
        time: b.scheduledFor.toLocaleTimeString("en-KE", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        customer: b.user.name ?? b.user.email,
        serviceName: b.service.name,
        city: b.city as City,
      }));
    days.push({
      date: key,
      isToday: key === todayKey,
      blocked: blockedKeys.has(key),
      bookings: dayBookings,
    });
  }
  return days;
}

// =============================================================================
// CLIENTS — list (search-filtered via query param)
// =============================================================================

export async function fetchClients(query?: string): Promise<ClientSummaryDto[]> {
  // Postgres ILIKE on cal's existing user table — case-insensitive substring
  // over name/email/trimlyPhone, plus a join filter into trimlyBookings.estate.
  const trimmed = query?.trim() ?? "";
  const where = trimmed
    ? {
        trimlyBookings: { some: {} },
        OR: [
          { name: { contains: trimmed, mode: "insensitive" as const } },
          { email: { contains: trimmed, mode: "insensitive" as const } },
          { trimlyPhone: { contains: trimmed } },
          { trimlyBookings: { some: { estate: { contains: trimmed, mode: "insensitive" as const } } } },
        ],
      }
    : { trimlyBookings: { some: {} } };

  const rows = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      trimlyPhone: true,
      trimlyPreferredCity: true,
      trimlyBookings: {
        select: {
          totalKES: true,
          scheduledFor: true,
          city: true,
          estate: true,
          bookingStatus: true,
        },
        orderBy: { scheduledFor: "desc" },
      },
      trimlySubscriptions: {
        select: { status: true },
        where: { status: { not: "cancelled" } },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
    take: 200,
  });

  return rows.map((u) => {
    const completed = u.trimlyBookings.filter((b) => b.bookingStatus === "completed");
    const totalCuts = completed.length;
    const totalSpendKES = completed.reduce((s, b) => s + b.totalKES, 0);
    const lastCutAt = completed[0]?.scheduledFor ?? null;
    const lastBooking = u.trimlyBookings[0];
    return {
      userId: u.id,
      name: u.name ?? u.email,
      email: u.email,
      phone: u.trimlyPhone ?? "",
      city: (u.trimlyPreferredCity as City | null) ?? (lastBooking?.city as City) ?? "Nakuru",
      estate: lastBooking?.estate ?? "",
      totalCuts,
      totalSpendKES,
      lastCutAt: lastCutAt ? lastCutAt.toISOString() : null,
      subscriptionStatus:
        u.trimlySubscriptions[0] === undefined
          ? null
          : (u.trimlySubscriptions[0].status as ClientSummaryDto["subscriptionStatus"]),
    };
  });
}

// =============================================================================
// PAYMENTS — KPI snapshot + 30-day series
// =============================================================================

export async function fetchRevenueSnapshot(): Promise<RevenueSnapshot> {
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startWeek = new Date(now.getTime() - 6 * ONE_DAY_MS);
  startWeek.setHours(0, 0, 0, 0);
  const startMonth = new Date(now.getTime() - 29 * ONE_DAY_MS);
  startMonth.setHours(0, 0, 0, 0);

  const [todayAgg, weekAgg, monthAgg, pendingAgg, last30] = await prisma.$transaction([
    prisma.trimlyPayment.aggregate({
      _sum: { amountKES: true },
      _count: { _all: true },
      where: { status: "succeeded", createdAt: { gte: startToday } },
    }),
    prisma.trimlyPayment.aggregate({
      _sum: { amountKES: true },
      _count: { _all: true },
      where: { status: "succeeded", createdAt: { gte: startWeek } },
    }),
    prisma.trimlyPayment.aggregate({
      _sum: { amountKES: true },
      _count: { _all: true },
      where: { status: "succeeded", createdAt: { gte: startMonth } },
    }),
    prisma.trimlyPayment.aggregate({
      _sum: { amountKES: true },
      _count: { _all: true },
      where: { status: "pending" },
    }),
    prisma.trimlyPayment.findMany({
      where: { status: "succeeded", createdAt: { gte: startMonth } },
      select: { createdAt: true, amountKES: true },
    }),
  ]);

  // Bucket the 30-day series client-side. The number of rows is bounded by
  // the operator's volume so this is O(n) over a small set.
  const buckets = new Map<string, RevenuePoint>();
  for (let i = 0; i < 30; i += 1) {
    const d = new Date(startMonth.getTime() + i * ONE_DAY_MS);
    buckets.set(dateKey(d), { date: dateKey(d), revenueKES: 0, cuts: 0 });
  }
  for (const row of last30) {
    const key = dateKey(row.createdAt);
    const point = buckets.get(key);
    if (point) {
      point.revenueKES += row.amountKES;
      point.cuts += 1;
    }
  }

  return {
    todayKES: todayAgg._sum.amountKES ?? 0,
    todayCuts: todayAgg._count._all ?? 0,
    weekKES: weekAgg._sum.amountKES ?? 0,
    weekCuts: weekAgg._count._all ?? 0,
    monthKES: monthAgg._sum.amountKES ?? 0,
    monthCuts: monthAgg._count._all ?? 0,
    pendingKES: pendingAgg._sum.amountKES ?? 0,
    pendingCount: pendingAgg._count._all ?? 0,
    series: Array.from(buckets.values()),
  };
}

// =============================================================================
// AVAILABILITY — 28-day strip
// =============================================================================

export async function fetchAvailabilityStrip(): Promise<AvailabilityDay[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 28);

  const [blocks, bookingCounts] = await prisma.$transaction([
    prisma.trimlyAvailability.findMany({
      where: { date: { gte: start, lt: end } },
      select: { date: true, isBlocked: true, reason: true },
    }),
    prisma.trimlyBooking.groupBy({
      by: ["scheduledFor"],
      _count: { _all: true },
      orderBy: { scheduledFor: "asc" },
      where: {
        scheduledFor: { gte: start, lt: end },
        bookingStatus: { in: ["confirmed", "in_progress"] },
      },
    }),
  ]);

  // groupBy buckets by exact timestamp — collapse to date-keys client-side.
  const countsByDate = new Map<string, number>();
  for (const row of bookingCounts) {
    const key = dateKey(row.scheduledFor);
    countsByDate.set(key, (countsByDate.get(key) ?? 0) + row._count._all);
  }
  const blocksByDate = new Map<string, { blocked: boolean; reason: string | null }>();
  for (const row of blocks) {
    blocksByDate.set(dateKey(row.date), { blocked: row.isBlocked, reason: row.reason });
  }

  const out: AvailabilityDay[] = [];
  for (let i = 0; i < 28; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dateKey(d);
    const block = blocksByDate.get(key);
    out.push({
      date: key,
      blocked: block?.blocked ?? false,
      reason: block?.reason ?? null,
      scheduledCount: countsByDate.get(key) ?? 0,
    });
  }
  return out;
}

export { DOW_SHORT };
