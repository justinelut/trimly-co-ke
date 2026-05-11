/**
 * DTOs for /operator/* pages. Pure ORM-agnostic shapes — the data
 * adapter (operator-data.ts) maps Prisma rows → these.
 *
 * Per cal's `data-dto-boundaries.md` rule, the page components only
 * ever see these types — never `@prisma/client`.
 */
import type { BookingStatusDto } from "../../account/_lib/account-types";
import type { City } from "@lib/trimly/types";

/** A stop on today's run. Includes everything the operator needs at a glance. */
export interface StopDto {
  bookingId: string;
  scheduledFor: string; // ISO
  durationMin: number;
  serviceName: string;
  status: BookingStatusDto;
  totalKES: number;
  customer: {
    name: string;
    phone: string; // normalised — used to build the WhatsApp link
    email: string;
  };
  address: {
    line1: string;
    line2?: string;
    estate: string;
    city: City;
  };
  /** Free-text travel hint to the NEXT stop. "8 min" / "12 min — Lanet" / null on last stop. */
  travelHint?: string;
}

/** A row on /operator/clients. */
export interface ClientSummaryDto {
  userId: number;
  name: string;
  email: string;
  phone: string;
  city: City;
  estate: string;
  totalCuts: number;
  totalSpendKES: number;
  lastCutAt: string | null; // ISO
  subscriptionStatus: "active" | "past_due" | "cancelled" | null;
}

/** Daily revenue point for the /operator/payments chart. */
export interface RevenuePoint {
  date: string; // YYYY-MM-DD
  revenueKES: number;
  cuts: number;
}

/** A day in the operator availability strip. */
export interface AvailabilityDay {
  date: string; // YYYY-MM-DD
  blocked: boolean;
  reason: string | null;
  /** Bookings already scheduled on this day — used as a warning before blocking. */
  scheduledCount: number;
}

/** A day in the calendar week view. */
export interface WeekViewDay {
  date: string; // YYYY-MM-DD
  isToday: boolean;
  blocked: boolean;
  bookings: Array<{
    time: string; // HH:MM
    customer: string;
    serviceName: string;
    city: City;
  }>;
}

/** Snapshot used on /operator/payments KPI strip. */
export interface RevenueSnapshot {
  todayKES: number;
  todayCuts: number;
  weekKES: number;
  weekCuts: number;
  monthKES: number;
  monthCuts: number;
  pendingKES: number; // Sum of TrimlyPayment.amountKES where status="pending"
  pendingCount: number;
  /** Last 30 days, oldest → newest. */
  series: RevenuePoint[];
}
