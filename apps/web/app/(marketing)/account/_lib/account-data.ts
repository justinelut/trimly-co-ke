/**
 * Account data adapter — activated against Prisma.
 *
 * Maps DB rows to DTOs (account-types.ts). NEVER returns Prisma row
 * types directly — per cal's `data-dto-boundaries.md`. Every query
 * uses `select` projections, never `include`, per `data-prefer-select-over-include.md`.
 */
import prisma from "@calcom/prisma";

import type {
  AccountData,
  BookingDto,
  BookingStatusDto,
  CustomerProfileDto,
  PaymentMethodDto,
  PaymentStatusDto,
  SubscriptionDto,
  SubscriptionStatusDto,
} from "./account-types";
import type { City, ServiceSlug } from "@lib/trimly/types";

// =============================================================================
// MAPPERS — Prisma row → DTO. Single direction; types must align with the
// `select` projections used in the queries below.
// =============================================================================

type BookingRow = {
  id: string;
  scheduledFor: Date;
  addressLine1: string;
  addressLine2: string | null;
  estate: string;
  city: string;
  totalKES: number;
  paymentStatus: string;
  bookingStatus: string;
  service: { slug: string; name: string; durationMin: number };
  payment: { channel: string; providerReference: string } | null;
};

function toBookingDto(row: BookingRow): BookingDto {
  return {
    id: row.id,
    serviceSlug: row.service.slug as ServiceSlug,
    serviceName: row.service.name,
    durationMin: row.service.durationMin,
    scheduledFor: row.scheduledFor.toISOString(),
    city: row.city as City,
    estate: row.estate,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2 ?? undefined,
    totalKES: row.totalKES,
    paymentStatus: row.paymentStatus as PaymentStatusDto,
    bookingStatus: row.bookingStatus as BookingStatusDto,
    paymentChannel: row.payment?.channel === "mobile_money" ? "mobile_money" : "card",
    paystackReference: row.payment?.providerReference ?? undefined,
  };
}

const BOOKING_SELECT = {
  id: true,
  scheduledFor: true,
  addressLine1: true,
  addressLine2: true,
  estate: true,
  city: true,
  totalKES: true,
  paymentStatus: true,
  bookingStatus: true,
  service: { select: { slug: true, name: true, durationMin: true } },
  payment: { select: { channel: true, providerReference: true } },
} as const;

// =============================================================================
// PROFILE
// =============================================================================

export async function fetchProfile(
  userId: number,
  email: string,
  name: string
): Promise<CustomerProfileDto> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      trimlyPhone: true,
      trimlyPreferredCity: true,
      trimlyPreferredContact: true,
    },
  });
  return {
    email,
    name,
    phone: u?.trimlyPhone ?? "",
    preferredCity: (u?.trimlyPreferredCity as City | null) ?? "Nakuru",
    preferredContact:
      (u?.trimlyPreferredContact as CustomerProfileDto["preferredContact"] | null) ?? "whatsapp",
  };
}

// =============================================================================
// BOOKINGS — upcoming + past in one round-trip
// =============================================================================

export async function fetchBookings(userId: number): Promise<{
  upcoming: BookingDto[];
  past: BookingDto[];
}> {
  const now = new Date();
  const [upcomingRows, pastRows] = await prisma.$transaction([
    prisma.trimlyBooking.findMany({
      where: {
        userId,
        scheduledFor: { gte: now },
        bookingStatus: { in: ["confirmed", "in_progress"] },
      },
      select: BOOKING_SELECT,
      orderBy: { scheduledFor: "asc" },
      take: 25,
    }),
    prisma.trimlyBooking.findMany({
      where: {
        userId,
        OR: [
          { scheduledFor: { lt: now } },
          { bookingStatus: { in: ["completed", "cancelled", "no_show"] } },
        ],
      },
      select: BOOKING_SELECT,
      orderBy: { scheduledFor: "desc" },
      take: 50,
    }),
  ]);
  return { upcoming: upcomingRows.map(toBookingDto), past: pastRows.map(toBookingDto) };
}

// =============================================================================
// SUBSCRIPTION
// =============================================================================

export async function fetchSubscription(userId: number): Promise<SubscriptionDto | null> {
  const sub = await prisma.trimlySubscription.findFirst({
    where: { userId, status: { not: "cancelled" } },
    select: {
      id: true,
      status: true,
      cutsRemaining: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      paymentMethod: true,
      cancelAtPeriodEnd: true,
      plan: {
        select: {
          slug: true,
          name: true,
          priceKES: true,
          intervalMonths: true,
          cutsPerMonth: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!sub) return null;

  return {
    id: sub.id,
    planSlug: sub.plan.slug as SubscriptionDto["planSlug"],
    planName: sub.plan.name,
    priceKES: sub.plan.priceKES,
    intervalLabel: sub.plan.intervalMonths >= 12 ? "yearly" : "monthly",
    status: sub.status as SubscriptionStatusDto,
    cutsPerCycle: sub.plan.cutsPerMonth,
    cutsRemaining: sub.cutsRemaining,
    currentPeriodStart: sub.currentPeriodStart.toISOString(),
    currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    paymentMethod: sub.paymentMethod === "mpesa" ? "mpesa" : "card",
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  };
}

// =============================================================================
// PAYMENT METHODS
// =============================================================================

export async function fetchPaymentMethods(userId: number): Promise<PaymentMethodDto[]> {
  const rows = await prisma.trimlyPaymentMethod.findMany({
    where: { userId },
    select: {
      id: true,
      kind: true,
      phone: true,
      brand: true,
      last4: true,
      expMonth: true,
      expYear: true,
      isDefault: true,
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return rows.map((r) => {
    const kind = r.kind === "card" ? "card" : "mpesa";
    return {
      id: r.id,
      kind,
      brand: r.brand,
      label:
        kind === "card"
          ? `•••• ${r.last4 ?? "0000"}`
          : maskPhone(r.phone ?? ""),
      isDefault: r.isDefault,
      expiry:
        kind === "card" && r.expMonth && r.expYear
          ? `${String(r.expMonth).padStart(2, "0")} / ${String(r.expYear).slice(-2)}`
          : undefined,
    };
  });
}

function maskPhone(phone: string): string {
  // 0712345678 → 07•• ••• 678
  if (phone.length !== 10) return phone;
  return `${phone.slice(0, 2)}•• ••• ${phone.slice(7)}`;
}

// =============================================================================
// BUNDLE
// =============================================================================

export async function fetchAccountData(input: {
  userId: number;
  email: string;
  name: string;
}): Promise<AccountData> {
  const [profile, bookings, subscription, paymentMethods] = await Promise.all([
    fetchProfile(input.userId, input.email, input.name),
    fetchBookings(input.userId),
    fetchSubscription(input.userId),
    fetchPaymentMethods(input.userId),
  ]);
  return {
    profile,
    upcomingBookings: bookings.upcoming,
    pastBookings: bookings.past,
    subscription,
    paymentMethods,
  };
}
