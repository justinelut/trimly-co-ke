"use client";

/**
 * SubscribeButton — subscription payment using the same UI patterns as the
 * booking flow (PaymentMpesa / PaymentCard). No Paystack redirect or inline popup.
 */
import { useEffect, useRef, useState } from "react";

type PaymentMethod = "mpesa" | "card";
type Stage = "idle" | "sending" | "waiting" | "succeeded" | "failed";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 200_000;

export function SubscribeButton({
  planSlug,
  planName,
  priceKES,
  email,
}: {
  planSlug: string;
  planName: string;
  priceKES: number;
  email: string;
}) {
  const [method, setMethod] = useState<PaymentMethod>("mpesa");
  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);

  function stopPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  }

  useEffect(() => stopPolling, []);

  function beginPolling(ref: string) {
    stopPolling();
    startedAtRef.current = Date.now();
    pollRef.current = setInterval(async () => {
      const elapsed = Date.now() - startedAtRef.current;
      setElapsedMs(elapsed);
      if (elapsed > POLL_TIMEOUT_MS) {
        stopPolling();
        setStage("failed");
        setError("Payment timed out. Try again.");
        return;
      }
      try {
        const res = await fetch(`/api/payments/status?reference=${encodeURIComponent(ref)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "success") {
          stopPolling();
          setStage("succeeded");
          setTimeout(() => { window.location.href = "/account/subscription?status=success"; }, 1500);
        } else if (data.status === "failed") {
          stopPolling();
          setStage("failed");
          setError(data.gatewayMessage ?? "Payment was declined or cancelled.");
        }
      } catch { /* keep polling */ }
    }, POLL_INTERVAL_MS);
  }

  async function handlePay() {
    setStage("sending");
    setError(null);

    try {
      // 1. Create subscription record
      const checkoutRes = await fetch("/api/account/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug, billing: "monthly" }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) throw new Error(checkoutData.error || "Checkout failed");

      // 2. Charge via our /api/payments/charge
      let chargeBody: Record<string, unknown>;
      if (method === "mpesa") {
        chargeBody = {
          channel: "mobile_money",
          subscriptionRef: checkoutData.reference,
          amountKES: priceKES,
          email,
          phone,
        };
      } else {
        // Send card details to our server — server passes them to Paystack /charge
        // (HTTPS end-to-end, card never stored, goes straight to Paystack)
        const digits = cardNumber.replace(/\s/g, "");
        const [mm, yyRaw] = expiry.replace(/\D/g, "").match(/.{1,2}/g) ?? [];
        const yy = yyRaw?.length === 2 ? `20${yyRaw}` : yyRaw;
        chargeBody = {
          channel: "card",
          subscriptionRef: checkoutData.reference,
          amountKES: priceKES,
          email,
          card: { number: digits, cvv, expiry_month: mm, expiry_year: yy },
        };
      }

      const chargeRes = await fetch("/api/payments/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chargeBody),
      });
      const chargeData = await chargeRes.json();
      if (!chargeRes.ok) throw new Error(chargeData.message || "Charge failed");

      setReference(chargeData.reference);
      setStage("waiting");
      beginPolling(chargeData.reference);
    } catch (err) {
      setStage("failed");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  // ─── Waiting / Success / Failed screens ───
  if (stage === "waiting" || stage === "succeeded" || stage === "failed") {
    const progressPct = stage === "succeeded" || stage === "failed"
      ? 100
      : Math.min(95, Math.round((elapsedMs / POLL_TIMEOUT_MS) * 100));

    const cls = stage === "succeeded"
      ? "t-waiting t-waiting--success"
      : stage === "failed"
        ? "t-waiting t-waiting--failed"
        : "t-waiting";

    return (
      <div className={cls} style={{ marginTop: 24 }}>
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

        {stage === "waiting" && (
          <>
            <h3 className="t-waiting__title">
              {method === "mpesa"
                ? <>Check your phone for the <em>M-Pesa</em> prompt.</>
                : <>Processing card payment…</>}
            </h3>
            <p className="t-waiting__body">
              {method === "mpesa"
                ? "Approve the STK prompt with your M-Pesa PIN. You have about three minutes."
                : "Verifying your card. This usually takes a few seconds."}
              {" "}Amount: <strong style={{ color: "var(--trimly-text-primary)" }}>KES {priceKES.toLocaleString("en-KE")}</strong>.
            </p>
            <div className="t-waiting__progress" aria-hidden>
              <div className="t-waiting__progress-bar" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="t-waiting__meta">
              Reference {reference} · We'll auto-confirm once approved
            </p>
          </>
        )}

        {stage === "succeeded" && (
          <>
            <h3 className="t-waiting__title">Paid.</h3>
            <p className="t-waiting__body">
              Your {planName} subscription is active. Redirecting…
            </p>
          </>
        )}

        {stage === "failed" && (
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

  // ─── Idle / Sending — input form ───
  return (
    <div style={{ marginTop: 24 }}>
      {/* Payment method toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setMethod("mpesa")}
          className={`t-btn ${method === "mpesa" ? "t-btn--primary" : "t-btn--secondary"}`}
          style={{ flex: 1, justifyContent: "center" }}>
          M-Pesa
        </button>
        <button
          type="button"
          onClick={() => setMethod("card")}
          className={`t-btn ${method === "card" ? "t-btn--primary" : "t-btn--secondary"}`}
          style={{ flex: 1, justifyContent: "center" }}>
          Card
        </button>
      </div>

      {/* M-Pesa phone input */}
      {method === "mpesa" && (
        <div className="t-field" style={{ marginBottom: 16 }}>
          <label htmlFor="sub-phone">Send the M-Pesa prompt to</label>
          <input
            id="sub-phone"
            type="tel"
            inputMode="tel"
            placeholder="0712 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <span className="t-field__hint">
            We'll push an STK prompt — approve it with your M-Pesa PIN. You have about three minutes.
          </span>
        </div>
      )}

      {/* Card inputs */}
      {method === "card" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <div className="t-field">
            <label htmlFor="sub-card">Card number</label>
            <input
              id="sub-card"
              type="text"
              inputMode="numeric"
              placeholder="4084 0840 8408 4081"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim())}
            />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="t-field" style={{ flex: 1 }}>
              <label htmlFor="sub-exp">Expiry</label>
              <input
                id="sub-exp"
                type="text"
                inputMode="numeric"
                placeholder="MM / YY"
                value={expiry}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setExpiry(d.length <= 2 ? d : `${d.slice(0, 2)} / ${d.slice(2)}`);
                }}
              />
            </div>
            <div className="t-field" style={{ flex: 1 }}>
              <label htmlFor="sub-cvv">CVV</label>
              <input
                id="sub-cvv"
                type="text"
                inputMode="numeric"
                placeholder="123"
                maxLength={4}
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
          </div>
          <span className="t-field__hint">
            Card details are encrypted on this page — Trimly never sees the number.
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={
          stage === "sending" ||
          (method === "mpesa" && phone.length < 10) ||
          (method === "card" && (cardNumber.replace(/\s/g, "").length < 15 || expiry.length < 7 || cvv.length < 3))
        }
        className="t-btn t-btn--primary t-btn--lg"
        style={{ width: "100%", justifyContent: "center" }}>
        {stage === "sending"
          ? "Sending…"
          : `Pay KES ${priceKES.toLocaleString("en-KE")}/mo with ${method === "mpesa" ? "M-Pesa" : "Card"}`}
      </button>

      {error && <p className="t-field__hint t-field__hint--error" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}
