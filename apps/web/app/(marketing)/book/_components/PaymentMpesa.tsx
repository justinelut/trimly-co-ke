"use client";

/**
 * PaymentMpesa — our OWN M-Pesa waiting screen. Never shows Paystack chrome.
 *
 * Flow:
 *   1. Customer's phone (from Step 4) is pre-filled; they can override
 *   2. Click "Send STK push" → POST /api/payments/charge with channel="mobile_money"
 *      → server calls Paystack /charge with mobile_money payload
 *      → Paystack pushes STK to the handset → we get status="pay_offline"
 *   3. We render the WaitingScreen, polling GET /api/payments/status?reference=...
 *      every 3 seconds for up to 200 seconds (~3 minutes; Paystack's STK window is 180s)
 *   4. On status=success → onSucceeded(reference) → parent navigates to /book/confirmation
 *   5. On status=failed or timeout → show retry UI
 */
import { useEffect, useRef, useState } from "react";

import { formatKES } from "@lib/trimly/pricing";
import type { ChargeResponse, City, PaymentStatus, ServiceSlug } from "@lib/trimly/types";

interface Props {
  bookingId: string;
  serviceSlug: ServiceSlug;
  city: City;
  email: string;
  defaultPhone: string;
  amountKES: number;
  onSucceeded: (reference: string) => void;
}

type Stage = "idle" | "sending" | "waiting" | "succeeded" | "failed";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 200_000; // 200 s — slightly over Safaricom's 180 s STK window

export function PaymentMpesa({
  bookingId,
  serviceSlug,
  city,
  email,
  defaultPhone,
  amountKES,
  onSucceeded,
}: Props) {
  const [phone, setPhone] = useState(defaultPhone);
  const [stage, setStage] = useState<Stage>("idle");
  const [reference, setReference] = useState<string | null>(null);
  const [displayText, setDisplayText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  async function sendStk() {
    setError(null);
    setStage("sending");
    try {
      const res = await fetch("/api/payments/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "mobile_money",
          bookingId,
          serviceSlug,
          city,
          email,
          phone,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message ?? `Charge failed (${res.status})`);
      }
      const data = (await res.json()) as ChargeResponse;
      setReference(data.reference);
      setDisplayText(data.displayText ?? "Approve the M-Pesa STK prompt on your phone.");
      setStage("waiting");
      startedAtRef.current = Date.now();
      beginPolling(data.reference);
    } catch (err) {
      setStage("failed");
      setError(err instanceof Error ? err.message : "Could not start payment.");
    }
  }

  function beginPolling(ref: string) {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      const elapsed = Date.now() - startedAtRef.current;
      setElapsedMs(elapsed);
      if (elapsed > POLL_TIMEOUT_MS) {
        stopPolling();
        setStage("failed");
        setError("STK prompt expired. The Safaricom window is about three minutes — try again.");
        return;
      }
      try {
        const res = await fetch(`/api/payments/status?reference=${encodeURIComponent(ref)}`);
        if (!res.ok) return; // ignore transient verify errors
        const status = (await res.json()) as PaymentStatus;
        if (status.status === "success") {
          stopPolling();
          setStage("succeeded");
          onSucceeded(ref);
        } else if (status.status === "failed") {
          stopPolling();
          setStage("failed");
          setError(status.gatewayMessage ?? "The prompt was declined or cancelled.");
        }
      } catch {
        // network blip — keep polling
      }
    }, POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = null;
  }

  useEffect(() => stopPolling, []);

  if (stage === "waiting" || stage === "succeeded" || stage === "failed") {
    const progressPct =
      stage === "succeeded"
        ? 100
        : stage === "failed"
          ? 100
          : Math.min(95, Math.round((elapsedMs / POLL_TIMEOUT_MS) * 100));
    const cls =
      stage === "succeeded"
        ? "t-waiting t-waiting--success"
        : stage === "failed"
          ? "t-waiting t-waiting--failed"
          : "t-waiting";
    return (
      <div className={cls}>
        <div className="t-waiting__phone-frame" aria-hidden>
          {stage === "succeeded" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : stage === "failed" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="3" width="12" height="18" rx="2" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
          )}
        </div>

        {stage === "waiting" ? (
          <>
            <h3 className="t-waiting__title">
              Check your phone for the <em>M-Pesa</em> prompt.
            </h3>
            <p className="t-waiting__body">
              {displayText} Amount: <strong style={{ color: "var(--trimly-text-primary)" }}>{formatKES(amountKES)}</strong>.
            </p>
            <div className="t-waiting__progress" aria-hidden>
              <div className="t-waiting__progress-bar" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="t-waiting__meta">
              Reference {reference} · We&rsquo;ll auto-confirm once you approve
            </p>
          </>
        ) : stage === "succeeded" ? (
          <>
            <h3 className="t-waiting__title">Paid.</h3>
            <p className="t-waiting__body">
              Your booking is confirmed. We&rsquo;re routing you to the receipt now.
            </p>
          </>
        ) : (
          <>
            <h3 className="t-waiting__title">That didn&rsquo;t go through.</h3>
            <p className="t-waiting__body">{error}</p>
            <button
              type="button"
              className="t-btn t-btn--primary"
              onClick={() => {
                setElapsedMs(0);
                setReference(null);
                setStage("idle");
              }}>
              Try again
            </button>
          </>
        )}
      </div>
    );
  }

  // stage === "idle" | "sending"
  return (
    <div className="t-form" style={{ gap: 16 }}>
      <div className="t-field">
        <label htmlFor="mpesa-phone">Send the M-Pesa prompt to</label>
        <input
          id="mpesa-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0712 345 678"
          inputMode="tel"
        />
        <span className="t-field__hint">
          We&rsquo;ll push an STK prompt — approve it with your M-Pesa PIN. You have about three minutes.
        </span>
      </div>

      {error ? <p className="t-field__hint t-field__hint--error">{error}</p> : null}

      <div>
        <button
          type="button"
          className="t-btn t-btn--primary t-btn--lg"
          disabled={stage === "sending" || !phone}
          onClick={sendStk}>
          {stage === "sending" ? "Sending prompt…" : `Pay ${formatKES(amountKES)} with M-Pesa`}
        </button>
      </div>
    </div>
  );
}
