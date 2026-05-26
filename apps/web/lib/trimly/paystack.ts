/**
 * Paystack API client wrapper.
 *
 * SINGLE PROVIDER: Paystack handles BOTH cards and M-Pesa from one
 * integration. NO Daraja, NO direct M-Pesa API anywhere. Even the
 * M-Pesa STK push is initiated via Paystack /charge with the
 * mobile_money payload.
 *
 * SINGLE SURFACE: Every Paystack call goes through this module. Routes
 * never call fetch('https://api.paystack.co/...') directly — they call
 * paystack.chargeMobileMoney() / paystack.chargeCard() / paystack.verify().
 *
 * RUNTIME: This file imports nothing browser-specific — safe to use in
 * route handlers (server-only).
 */
import type {
  ChargeResponse,
  PaymentStatus,
  PriceQuote,
} from "./types";

const PAYSTACK_BASE = "https://api.paystack.co";

function secretKey(): string {
  // Read at call time from the global process.env (NOT from `import process`).
  // Next.js/Turbopack inlines `process.env.X` at BUILD time for non-NEXT_PUBLIC
  // vars when `import process from "node:process"` is used. Using the global
  // avoids this — the K8s secret injects the value at container start.
  const key = globalThis.process?.env?.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error("PAYSTACK_SECRET_KEY is not set in environment");
  }
  return key;
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${secretKey()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/**
 * Map a raw Paystack /charge response into our canonical ChargeResponse.
 * Paystack uses a heterogeneous status field across payment surfaces;
 * we normalise it here so the front-end sees one shape.
 */
function parseChargeResponse(json: any): ChargeResponse {
  const data = json?.data ?? {};
  const status = (data.status as ChargeResponse["status"]) ?? "pending";
  return {
    reference: data.reference,
    status,
    displayText: data.display_text ?? data.message,
    redirectUrl: data.url, // present when status === "open_url" (3DS)
  };
}

/**
 * POST /charge with mobile_money payload — issues an STK push to the
 * customer's phone. Response includes a reference we persist and a
 * status="pay_offline" until the customer approves on their handset.
 *
 * The customer has 180 seconds to approve (Safaricom network limit,
 * not configurable). Polling logic lives in the caller — see
 * /api/payments/status.
 *
 * Max single M-Pesa transaction is KES 150,000. We don't enforce
 * here — pricing is bounded by our service catalog.
 */
export async function chargeMobileMoney(input: {
  email: string;
  amountKobo: number;
  phone: string; // already normalised to "0712345678" form by lib/trimly/phone.ts
  bookingId: string;
}): Promise<ChargeResponse> {
  const res = await fetch(`${PAYSTACK_BASE}/charge`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: "KES",
      mobile_money: {
        phone: "+254" + input.phone.slice(1),
        provider: "mpesa",
      },
      metadata: {
        bookingId: input.bookingId,
        channel: "mobile_money",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Paystack /charge mpesa failed: ${res.status} ${body}`);
  }

  const json = await res.json();
  if (!json.status) {
    throw new Error(`Paystack /charge mpesa rejected: ${json.message ?? "unknown"}`);
  }
  return parseChargeResponse(json);
}

/**
 * POST /charge with card payload.
 *
 * Card data MUST already be encrypted client-side using Paystack's
 * @paystack/inline-js encrypt() helper with our PAYSTACK_PUBLIC_KEY.
 * That keeps Trimly's servers out of PCI scope — we only ever see
 * the opaque encrypted blob.
 *
 * Paystack may respond with one of:
 *   - status="success" — settled
 *   - status="send_pin" — customer needs to enter their PIN (rare on KE cards)
 *   - status="send_otp" — customer needs OTP (most common 3DS-lite path)
 *   - status="open_url" — full 3DS challenge — we render `data.url` in our own modal iframe
 *   - status="failed" — declined
 *
 * The front-end handles each branch with our OWN UI — Paystack chrome is
 * NEVER shown.
 */
export async function chargeCard(input: {
  email: string;
  amountKobo: number;
  /** Encrypted card string OR raw card object */
  encryptedCard: string | { number: string; cvv: string; expiry_month: string; expiry_year: string };
  bookingId: string;
}): Promise<ChargeResponse> {
  const res = await fetch(`${PAYSTACK_BASE}/charge`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: "KES",
      card: input.encryptedCard,
      metadata: {
        bookingId: input.bookingId,
        channel: "card",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Paystack /charge card failed: ${res.status} ${body}`);
  }
  const json = await res.json();
  if (!json.status) {
    throw new Error(`Paystack /charge card rejected: ${json.message ?? "unknown"}`);
  }
  return parseChargeResponse(json);
}

/**
 * Submit OTP for a charge that returned status="send_otp".
 * Called when the customer types the OTP into our OWN form.
 */
export async function submitOtp(input: {
  reference: string;
  otp: string;
}): Promise<ChargeResponse> {
  const res = await fetch(`${PAYSTACK_BASE}/charge/submit_otp`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ reference: input.reference, otp: input.otp }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Paystack /charge/submit_otp failed: ${res.status} ${body}`);
  }
  const json = await res.json();
  return parseChargeResponse(json);
}

/**
 * GET /transaction/verify/{reference} — confirm a charge's final state.
 * Called by /api/payments/status when the front-end polls, and by the
 * Paystack webhook handler as a defense-in-depth check before marking
 * a booking succeeded.
 */
export async function verify(reference: string): Promise<{
  status: "success" | "failed" | "pending";
  amountKES: number;
  gatewayMessage?: string;
  rawMetadata: Record<string, unknown>;
}> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Paystack /transaction/verify failed: ${res.status} ${body}`);
  }
  const json = await res.json();
  const data = json.data ?? {};
  return {
    status:
      data.status === "success"
        ? "success"
        : data.status === "failed" || data.status === "abandoned"
          ? "failed"
          : "pending",
    amountKES: Math.round((data.amount ?? 0) / 100),
    gatewayMessage: data.gateway_response,
    rawMetadata: data.metadata ?? {},
  };
}
