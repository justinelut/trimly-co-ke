/**
 * POST /api/webhooks/paystack
 *
 * Authoritative confirmation source for Trimly payments. Paystack fires
 * this endpoint on every transaction lifecycle event — charge.success,
 * charge.failed, subscription.create, etc. — and we trust THIS signal
 * (after HMAC verification + /transaction/verify re-check), not the
 * client-side status polling, when mutating booking state.
 *
 * Security contract (per Paystack docs and Trimly brief §6.3):
 *   1. We read the RAW body via req.text() — NEVER JSON.parse before
 *      computing HMAC, because Paystack signs the exact byte stream.
 *   2. We compute HMAC-SHA512(rawBody, PAYSTACK_SECRET_KEY) and compare
 *      it constant-time against the x-paystack-signature header.
 *   3. We dedupe via TrimlyWebhookEvent keyed by (provider, eventId). If
 *      the same event id arrives twice, we return 200 OK without
 *      re-processing — Paystack retries aggressively.
 *   4. We ALWAYS return 200 once HMAC verifies. Returning non-2xx makes
 *      Paystack retry, which would slow down everyone's bookings.
 *
 * This route is a thin controller: it does NO business logic. It hands
 * the parsed event off to a focused handler in lib/trimly/webhook-handlers.ts
 * (per Cal's "thin controllers" rule).
 */
import crypto from "node:crypto";

import { NextResponse } from "next/server";

import prisma from "@calcom/prisma";
import { Prisma } from "@calcom/prisma/client";

import { EVENT_HANDLERS, parseEnvelope } from "@lib/trimly/webhook-handlers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // requires `crypto` — not Edge

// =============================================================================
// HMAC VERIFICATION
// =============================================================================

const SIGNATURE_HEADER = "x-paystack-signature";

function verifySignature(rawBody: string, header: string | null): boolean {
  if (!header) return false;

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    // Fail closed: if the server is misconfigured we must NOT accept
    // unsigned webhooks. Logged loudly so the operator notices.
    // eslint-disable-next-line no-console
    console.error("[webhook] PAYSTACK_SECRET_KEY is not set — refusing to verify");
    return false;
  }

  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");

  // Constant-time comparison avoids leaking partial matches via timing.
  // Buffers must be the same length or timingSafeEqual throws.
  if (expected.length !== header.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(header, "hex"));
  } catch {
    return false;
  }
}

// =============================================================================
// IDEMPOTENCY LOG
// =============================================================================

interface PersistedEvent {
  alreadyProcessed: boolean;
}

/**
 * Look up — and on miss, insert — the TrimlyWebhookEvent row for this
 * (provider, eventId). Returns alreadyProcessed=true if we've already
 * handled this delivery, in which case the caller skips dispatch and
 * returns 200 OK immediately.
 *
 * The unique constraint on (provider, eventId) makes this atomic:
 * either the insert succeeds (we're the first to process), or we get
 * P2002 and know it's a retry.
 */
async function recordWebhookEvent(input: {
  provider: "paystack";
  eventId: string;
  eventType: string;
  rawPayload: unknown;
}): Promise<PersistedEvent> {
  try {
    await prisma.trimlyWebhookEvent.create({
      data: {
        provider: input.provider,
        eventId: input.eventId,
        eventType: input.eventType,
        rawPayload: input.rawPayload as Prisma.InputJsonValue,
      },
    });
    return { alreadyProcessed: false };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { alreadyProcessed: true };
    }
    throw err;
  }
}

// =============================================================================
// ROUTE HANDLER — thin controller, no business logic
// =============================================================================

export async function POST(req: Request) {
  // 1. RAW BODY FIRST — never parse before HMAC.
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[webhook] could not read body", err);
    return NextResponse.json({ error: "body_read_failed" }, { status: 400 });
  }

  // 2. SIGNATURE VERIFICATION — fail closed.
  const signatureHeader = req.headers.get(SIGNATURE_HEADER);
  if (!verifySignature(rawBody, signatureHeader)) {
    // 401 (not 4xx for other reasons) — tells operators "signature problem"
    // when looking at Paystack's dashboard delivery log.
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  // 3. PARSE the envelope. Use Zod-validated shape; reject anything else.
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = parseEnvelope(payload);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.reason }, { status: 400 });
  }
  const envelope = parsed.envelope;

  // Paystack's event id can arrive as number; normalise to string.
  const eventId = String(envelope.data.id);
  const eventType = envelope.event;

  // 4. IDEMPOTENCY — short-circuit duplicate deliveries.
  let recorded: PersistedEvent;
  try {
    recorded = await recordWebhookEvent({
      provider: "paystack",
      eventId,
      eventType,
      rawPayload: payload,
    });
  } catch (err) {
    // Persistence failure means we genuinely can't promise idempotency.
    // Return 5xx so Paystack retries — better than processing twice.
    // eslint-disable-next-line no-console
    console.error("[webhook] failed to record event", err);
    return NextResponse.json({ error: "log_failed" }, { status: 500 });
  }
  if (recorded.alreadyProcessed) {
    return NextResponse.json({ ok: true, deduped: true }, { status: 200 });
  }

  // 5. DISPATCH — factory pattern, single conditional at the entry point.
  const handler = EVENT_HANDLERS[eventType];
  if (!handler) {
    // We don't have a handler for this event type — that's fine. Some
    // Paystack events (transfer.*, customeridentification.*) don't apply
    // to Trimly. Acknowledge so Paystack stops retrying.
    // eslint-disable-next-line no-console
    console.info("[webhook] unhandled event type — acknowledging", { eventType });
    return NextResponse.json({ ok: true, unhandled: eventType }, { status: 200 });
  }

  try {
    const result = await handler(envelope.data, {
      eventId,
      eventType,
      rawPayload: payload,
    });
    if (!result.ok) {
      // The handler refused to act — log loud, still 200 OK because
      // retrying won't help. Operator must investigate.
      // eslint-disable-next-line no-console
      console.error("[webhook] handler reported error — acknowledging anyway", {
        eventType,
        reason: result.reason,
      });
      return NextResponse.json({ ok: true, handler_error: result.reason }, { status: 200 });
    }
    return NextResponse.json({ ok: true, action: result.action }, { status: 200 });
  } catch (err) {
    // Handler crashed. We've already logged the event for idempotency,
    // so retrying would just no-op. Log and acknowledge.
    // eslint-disable-next-line no-console
    console.error("[webhook] handler threw", err);
    return NextResponse.json({ ok: true, handler_threw: true }, { status: 200 });
  }
}

/**
 * Paystack health-checks the webhook URL with a GET. Return 200 with a
 * one-line body so the dashboard shows green.
 */
export async function GET() {
  return NextResponse.json({ ok: true, service: "trimly-paystack-webhook" }, { status: 200 });
}
