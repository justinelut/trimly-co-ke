"use client";

/**
 * PaystackPaymentComponent — renders our custom M-Pesa/Card UI inside
 * Cal.diy's /payment/[uid] page. No Paystack redirect or popup.
 */
import { useEffect, useRef, useState } from "react";

type PaymentMethod = "mpesa" | "card";
type Stage = "idle" | "sending" | "waiting" | "succeeded" | "failed";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 200_000;

interface Props {
  payment: { id: number; amount: number; currency: string; data: Record<string, unknown> };
  bookingId: number;
  bookerEmail: string;
}

export function PaystackPaymentComponent({ payment, bookingId, bookerEmail }: Props) {
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
          // Reload to show the booking confirmed state
          setTimeout(() => window.location.reload(), 1500);
        } else if (data.status === "failed") {
          stopPolling();
          setStage("failed");
          setError(data.gatewayMessage ?? "Payment was declined.");
        }
      } catch { /* keep polling */ }
    }, POLL_INTERVAL_MS);
  }

  async function handlePay() {
    setStage("sending");
    setError(null);

    try {
      const amountKES = Math.round(payment.amount / 100);
      let chargeBody: Record<string, unknown>;

      if (method === "mpesa") {
        chargeBody = {
          channel: "mobile_money",
          bookingId: String(bookingId),
          serviceSlug: "standard",
          city: "Nakuru",
          email: bookerEmail,
          phone,
        };
      } else {
        const digits = cardNumber.replace(/\s/g, "");
        const [mm, yyRaw] = expiry.replace(/\D/g, "").match(/.{1,2}/g) ?? [];
        const yy = yyRaw?.length === 2 ? `20${yyRaw}` : yyRaw;
        chargeBody = {
          channel: "card",
          bookingId: String(bookingId),
          serviceSlug: "standard",
          city: "Nakuru",
          email: bookerEmail,
          encryptedCard: JSON.stringify({ number: digits, cvv, expiry_month: mm, expiry_year: yy }),
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

  if (stage === "waiting") {
    const progressPct = Math.min(95, Math.round((elapsedMs / POLL_TIMEOUT_MS) * 100));
    return (
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <p style={{ fontWeight: 600, fontSize: 16 }}>
          {method === "mpesa" ? "Check your phone for the M-Pesa prompt" : "Processing card payment…"}
        </p>
        <div style={{ margin: "12px auto", width: "100%", height: 4, background: "#e5e7eb", borderRadius: 2 }}>
          <div style={{ width: `${progressPct}%`, height: "100%", background: "#10b981", borderRadius: 2, transition: "width 0.3s" }} />
        </div>
        <p style={{ fontSize: 13, color: "#6b7280" }}>Reference: {reference}</p>
      </div>
    );
  }

  if (stage === "succeeded") {
    return (
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <p style={{ fontWeight: 600, fontSize: 16, color: "#10b981" }}>✓ Payment confirmed</p>
        <p style={{ fontSize: 13, color: "#6b7280" }}>Your booking is confirmed. Redirecting…</p>
      </div>
    );
  }

  if (stage === "failed") {
    return (
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <p style={{ fontWeight: 600, fontSize: 16, color: "#ef4444" }}>Payment failed</p>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>{error}</p>
        <button onClick={() => { setStage("idle"); setError(null); }} style={{ padding: "8px 16px", background: "#111", color: "#fff", borderRadius: 6, border: "none", cursor: "pointer" }}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      {/* Method toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button type="button" onClick={() => setMethod("mpesa")}
          style={{ flex: 1, padding: "10px", borderRadius: 6, border: method === "mpesa" ? "2px solid #111" : "1px solid #d1d5db", background: method === "mpesa" ? "#f9fafb" : "#fff", fontWeight: method === "mpesa" ? 600 : 400, cursor: "pointer" }}>
          M-Pesa
        </button>
        <button type="button" onClick={() => setMethod("card")}
          style={{ flex: 1, padding: "10px", borderRadius: 6, border: method === "card" ? "2px solid #111" : "1px solid #d1d5db", background: method === "card" ? "#f9fafb" : "#fff", fontWeight: method === "card" ? 600 : 400, cursor: "pointer" }}>
          Card
        </button>
      </div>

      {/* M-Pesa */}
      {method === "mpesa" && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Phone number</label>
          <input type="tel" inputMode="tel" placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 15 }} />
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>We'll send an STK prompt to this number.</p>
        </div>
      )}

      {/* Card */}
      {method === "card" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Card number</label>
            <input type="text" inputMode="numeric" placeholder="4084 0840 8408 4081" value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim())}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 15 }} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Expiry</label>
              <input type="text" inputMode="numeric" placeholder="MM / YY" value={expiry}
                onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 4); setExpiry(d.length <= 2 ? d : `${d.slice(0, 2)} / ${d.slice(2)}`); }}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 15 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>CVV</label>
              <input type="text" inputMode="numeric" placeholder="123" maxLength={4} value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 15 }} />
            </div>
          </div>
        </div>
      )}

      <button type="button" onClick={handlePay}
        disabled={stage === "sending" || (method === "mpesa" && phone.length < 10) || (method === "card" && (cardNumber.replace(/\s/g, "").length < 15 || expiry.length < 7 || cvv.length < 3))}
        style={{ width: "100%", padding: "12px", background: "#111", color: "#fff", borderRadius: 6, border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: stage === "sending" ? 0.6 : 1 }}>
        {stage === "sending" ? "Processing…" : `Pay KES ${Math.round(payment.amount / 100).toLocaleString("en-KE")}`}
      </button>

      {error && <p style={{ marginTop: 8, fontSize: 13, color: "#ef4444" }}>{error}</p>}
    </div>
  );
}
