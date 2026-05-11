/**
 * Trimly shared types — used by booking wizard, API routes, and the
 * Paystack client wrapper. Co-located here so the front-end, the API
 * routes, and any future services share one source of truth.
 */

export type City = "Nakuru" | "Nairobi";

export type ServiceSlug = "standard" | "executive" | "beard" | "household";

export interface TrimlyServiceCatalog {
  slug: ServiceSlug;
  name: string;
  durationMin: number;
  priceKESNakuru: number;
  priceKESNairobi: number;
  description: string;
  unit: string; // "/ cut", "/ session", "/ household"
}

/** Server-validated price quote. The browser never computes price — it asks the server. */
export interface PriceQuote {
  serviceSlug: ServiceSlug;
  city: City;
  amountKES: number;
  amountKobo: number; // amount * 100 — Paystack uses minor units
  currency: "KES";
  serviceName: string;
  durationMin: number;
}

export type PaymentChannel = "mobile_money" | "card";

/** Initial response from POST /api/payments/charge. */
export interface ChargeResponse {
  reference: string;
  /** Paystack returns one of these statuses on /charge */
  status:
    | "pay_offline" // M-Pesa STK pushed — waiting for customer
    | "send_pin" // card needs PIN
    | "send_otp" // card needs OTP
    | "open_url" // 3DS — open this URL inside our modal
    | "success" // already settled (rare for cards, never for mobile_money)
    | "failed"
    | "pending"; // intermediate
  /** Customer-facing instruction supplied by Paystack ("Please enter your M-PESA PIN..."). */
  displayText?: string;
  /** Present when status === "open_url" — the 3DS challenge URL. We render it inside our own modal. */
  redirectUrl?: string;
}

/** Polled status from GET /api/payments/status?reference=... */
export interface PaymentStatus {
  reference: string;
  status: "pending" | "success" | "failed";
  amountKES: number;
  bookingId: string;
  gatewayMessage?: string;
}

/** Address payload submitted in Step 4. */
export interface BookingAddress {
  estate: string;
  addressLine1: string;
  addressLine2?: string;
  notes?: string;
}

/** Full booking state held by the wizard while the user fills it in. */
export interface BookingDraft {
  city?: City;
  serviceSlug?: ServiceSlug;
  scheduledFor?: string; // ISO date-time
  address?: BookingAddress;
  customer?: {
    email: string;
    name: string;
    phone: string; // E.164 normalised before sending to Paystack
  };
}

/** Neighborhoods that the booking flow's estate dropdown filters by. */
export const NEIGHBORHOODS: Record<City, readonly string[]> = {
  Nakuru: [
    "Section 58 / Milimani",
    "Naka",
    "Kiamunyi",
    "Pipeline",
    "Lanet",
    "Bahati",
    "Nakuru CBD",
  ],
  Nairobi: ["Westlands", "Kilimani", "Karen", "Lavington", "Runda", "Kileleshwa"],
} as const;
