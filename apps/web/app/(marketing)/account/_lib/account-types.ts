/**
 * DTOs for the /account dashboard.
 *
 * These are the shapes the page components consume. NEVER import Prisma
 * types here — per cal's `data-dto-boundaries.md` rule, database types
 * must not leak to the frontend. The data adapter (mock-data.ts now,
 * Prisma repository later) maps DB rows → these DTOs.
 *
 * String-literal unions instead of Prisma enums keep this file ORM-
 * agnostic.
 */
import type { City, ServiceSlug } from "@lib/trimly/types";

export type BookingStatusDto =
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type PaymentStatusDto = "pending" | "succeeded" | "failed" | "refunded";

export type SubscriptionStatusDto = "active" | "past_due" | "cancelled" | "non_renewing";

export type PaymentMethodKind = "mpesa" | "card";

export interface BookingDto {
  id: string;
  serviceSlug: ServiceSlug;
  serviceName: string;
  durationMin: number;
  scheduledFor: string; // ISO
  city: City;
  estate: string;
  addressLine1: string;
  addressLine2?: string;
  totalKES: number;
  paymentStatus: PaymentStatusDto;
  bookingStatus: BookingStatusDto;
  paymentChannel: "mobile_money" | "card";
  paystackReference?: string;
}

export interface SubscriptionDto {
  id: string;
  planSlug: "starter" | "regular" | "executive";
  planName: string;
  priceKES: number;
  intervalLabel: "monthly" | "yearly";
  status: SubscriptionStatusDto;
  cutsPerCycle: number;
  cutsRemaining: number;
  currentPeriodStart: string; // ISO
  currentPeriodEnd: string; // ISO
  paymentMethod: PaymentMethodKind;
  cancelAtPeriodEnd: boolean;
}

export interface PaymentMethodDto {
  id: string;
  kind: PaymentMethodKind;
  /** "•••• 4081" for cards; "07•• ••• 678" for M-Pesa */
  label: string;
  /** "Visa" | "Mastercard" | "Amex" for cards; "M-Pesa" for mpesa */
  brand: string;
  isDefault: boolean;
  /** Cards: "12/30". M-Pesa: undefined. */
  expiry?: string;
}

export interface CustomerProfileDto {
  email: string;
  name: string;
  phone: string;
  preferredCity: City;
  preferredContact: "whatsapp" | "email" | "sms";
}

/** Bundle returned by the account-data adapter — single fetch hydrates the page. */
export interface AccountData {
  profile: CustomerProfileDto;
  upcomingBookings: BookingDto[];
  pastBookings: BookingDto[];
  subscription: SubscriptionDto | null;
  paymentMethods: PaymentMethodDto[];
}
