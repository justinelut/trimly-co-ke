"use client";

/**
 * PaymentCard — our OWN card form. Never shows Paystack chrome.
 *
 * Card encryption:
 *   Card details are NEVER sent to Trimly's servers in plaintext. We use
 *   Paystack's @paystack/inline-js encrypt() helper (loaded from their CDN)
 *   with our PAYSTACK_PUBLIC_KEY to encrypt the card object client-side,
 *   producing an opaque ciphertext we POST to /api/payments/charge. The
 *   server then forwards it to Paystack's /charge endpoint. Trimly stays
 *   out of PCI-DSS scope.
 *
 * 3DS handling:
 *   Paystack responses can carry status="open_url" with a redirectUrl —
 *   we render that URL inside our OWN modal IFRAME (the t-3ds-modal class)
 *   instead of redirecting the customer away. When 3DS completes, the
 *   page inside the iframe posts a message back via window.postMessage
 *   OR our status poller observes the transaction succeeding via
 *   /api/payments/status.
 *
 * OTP handling:
 *   status="send_otp" → we collect the OTP in our own 6-digit row, POST
 *   it to /api/payments/charge/submit-otp (TODO endpoint), then resume polling.
 */
import { useEffect, useRef, useState } from "react";
import Script from "next/script";

import { formatKES } from "@lib/trimly/pricing";
import type { ChargeResponse, City, PaymentStatus, ServiceSlug } from "@lib/trimly/types";

interface Props {
  bookingId: string;
  serviceSlug: ServiceSlug;
  city: City;
  email: string;
  amountKES: number;
  onSucceeded: (reference: string) => void;
}

type Stage = "idle" | "submitting" | "waiting" | "otp" | "3ds" | "succeeded" | "failed";

declare global {
  // Paystack's CDN script injects a global `PaystackPop` constructor on
  // window. We also use `window.encrypt` exposed by paystack-inline-js
  // for card encryption. Typing it loosely keeps us from importing
  // Paystack's types into the bundle.
  interface Window {
    PaystackPop?: {
      new (): {
        // We DO NOT use .setup() — that shows Paystack chrome. We only use
        // the encrypt helper:
        encrypt?: (publicKey: string, cardData: unknown) => string;
      };
    };
  }
}

const PAYSTACK_INLINE_JS = "https://js.paystack.co/v2/inline.js";

function detectBrand(num: string): string {
  const cleaned = num.replace(/\s/g, "");
  if (/^4/.test(cleaned)) return "Visa";
  if (/^5[1-5]/.test(cleaned)) return "Mastercard";
  if (/^3[47]/.test(cleaned)) return "Amex";
  return "Card";
}

function formatCardNumber(raw: string): string {
  // Group digits in 4s, max 19 digits for cards (Amex is 15, Visa/MC 16, Maestro up to 19)
  return raw
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

export function PaymentCard({
  bookingId,
  serviceSlug,
  city,
  email,
  amountKES,
  onSucceeded,
}: Props) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [reference, setReference] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function encryptCard(): string {
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error("Card payments are not configured (missing public key).");
    }
    if (typeof window === "undefined" || !window.PaystackPop) {
      throw new Error("Paystack encryption library has not loaded yet.");
    }
    const cleanedNumber = cardNumber.replace(/\s/g, "");
    const [expMonth, expYearRaw] = expiry.replace(/\D/g, "").match(/.{1,2}/g) ?? [];
    const expYear = expYearRaw?.length === 2 ? `20${expYearRaw}` : expYearRaw;
    const pop = new window.PaystackPop();
    if (!pop.encrypt) {
      throw new Error("Paystack inline-js v2 did not expose encrypt().");
    }
    return pop.encrypt(publicKey, {
      number: cleanedNumber,
      cvv,
      expiry_month: expMonth,
      expiry_year: expYear,
    });
  }

  async function submit() {
    setError(null);
    setStage("submitting");
    try {
      const encryptedCard = encryptCard();
      const res = await fetch("/api/payments/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "card",
          bookingId,
          serviceSlug,
          city,
          email,
          encryptedCard,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message ?? `Charge failed (${res.status})`);
      }
      const data = (await res.json()) as ChargeResponse;
      setReference(data.reference);
      handleChargeResponse(data);
    } catch (err) {
      setStage("failed");
      setError(err instanceof Error ? err.message : "Card payment could not start.");
    }
  }

  function handleChargeResponse(data: ChargeResponse) {
    switch (data.status) {
      case "success":
        setStage("succeeded");
        onSucceeded(data.reference);
        break;
      case "open_url":
        setRedirectUrl(data.redirectUrl ?? null);
        setStage("3ds");
        beginPolling(data.reference);
        break;
      case "send_otp":
        setStage("otp");
        break;
      case "pay_offline":
      case "pending":
        setStage("waiting");
        beginPolling(data.reference);
        break;
      case "failed":
      default:
        setStage("failed");
        setError(data.displayText ?? "Card declined.");
        break;
    }
  }

  function beginPolling(ref: string) {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    let elapsed = 0;
    pollTimerRef.current = setInterval(async () => {
      elapsed += 3000;
      if (elapsed > 200_000) {
        stopPolling();
        setStage("failed");
        setError("3-D Secure challenge timed out.");
        return;
      }
      try {
        const res = await fetch(`/api/payments/status?reference=${encodeURIComponent(ref)}`);
        if (!res.ok) return;
        const status = (await res.json()) as PaymentStatus;
        if (status.status === "success") {
          stopPolling();
          setStage("succeeded");
          onSucceeded(ref);
        } else if (status.status === "failed") {
          stopPolling();
          setStage("failed");
          setError(status.gatewayMessage ?? "Card challenge failed.");
        }
      } catch {
        // network blip — keep polling
      }
    }, 3000);
  }

  function stopPolling() {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = null;
  }

  useEffect(() => stopPolling, []);

  // Listen for the iframe inside the 3DS modal posting a "done" message
  // when it completes (Paystack's challenge pages can be configured to
  // postMessage on success). This is a faster path than waiting for the
  // 3-second poller to pick it up.
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (typeof e.data !== "object" || e.data === null) return;
      const d = e.data as { type?: string; status?: string };
      if (d.type === "trimly:3ds-done" && reference) {
        if (d.status === "success") {
          stopPolling();
          setStage("succeeded");
          onSucceeded(reference);
        } else {
          stopPolling();
          setStage("failed");
          setError("3-D Secure declined the transaction.");
        }
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [reference, onSucceeded]);

  const brand = detectBrand(cardNumber);
  const formValid = cardNumber.replace(/\s/g, "").length >= 15 && expiry.replace(/\D/g, "").length === 4 && cvv.length >= 3;

  return (
    <>
      <Script
        src={PAYSTACK_INLINE_JS}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />

      {stage === "succeeded" ? (
        <div className="t-waiting t-waiting--success">
          <div className="t-waiting__phone-frame" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="t-waiting__title">Paid.</h3>
          <p className="t-waiting__body">Your booking is confirmed. Routing you to the receipt.</p>
        </div>
      ) : stage === "otp" ? (
        <OtpForm
          reference={reference ?? ""}
          onResponse={(resp) => handleChargeResponse(resp)}
          onError={(msg) => {
            setStage("failed");
            setError(msg);
          }}
        />
      ) : (
        <form
          className="t-card-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          noValidate>
          <div className="t-card-form__cardlike">
            <div className="t-card-form__brand-row">
              <span>Card details</span>
              <span className="t-card-form__secure">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Encrypted via Paystack
              </span>
            </div>

            <div className="t-field">
              <label htmlFor="card-number">{brand} number</label>
              <input
                id="card-number"
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="4084 0840 8408 4081"
              />
            </div>

            <div className="t-field--row">
              <div className="t-field">
                <label htmlFor="card-expiry">Expires</label>
                <input
                  id="card-expiry"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="12 / 30"
                />
              </div>
              <div className="t-field">
                <label htmlFor="card-cvv">Security code</label>
                <input
                  id="card-cvv"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                />
              </div>
            </div>
          </div>

          {error ? <p className="t-field__hint t-field__hint--error">{error}</p> : null}

          <button
            type="submit"
            className="t-btn t-btn--primary t-btn--lg"
            disabled={!formValid || !scriptReady || stage === "submitting" || stage === "waiting" || stage === "3ds"}>
            {stage === "submitting"
              ? "Encrypting…"
              : stage === "waiting"
                ? "Confirming…"
                : `Pay ${formatKES(amountKES)} with card`}
          </button>

          <p className="t-field__hint">
            Your card details are encrypted on this page before they leave it. Trimly never sees
            the raw number — Paystack handles tokenisation and PCI compliance.
          </p>
        </form>
      )}

      {stage === "3ds" && redirectUrl ? (
        <div className="t-3ds-overlay" role="dialog" aria-modal="true" aria-label="3-D Secure">
          <div className="t-3ds-modal">
            <div className="t-3ds-modal__head">
              <h3 className="t-3ds-modal__title">Verify your card</h3>
              <p className="t-3ds-modal__meta">
                Your bank wants to confirm this charge. Follow the prompt below — we&rsquo;ll
                close this window as soon as it&rsquo;s approved.
              </p>
            </div>
            <div className="t-3ds-modal__body">
              <iframe
                className="t-3ds-modal__iframe"
                src={redirectUrl}
                title="3-D Secure challenge"
                sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation-by-user-activation"
              />
              <button
                type="button"
                className="t-3ds-modal__close"
                onClick={() => {
                  stopPolling();
                  setStage("idle");
                  setRedirectUrl(null);
                  setError("You cancelled the 3-D Secure check. Try again.");
                }}>
                Cancel and try a different card
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Custom OTP collector — Paystack returns send_otp for some KE banks. */
function OtpForm({
  reference,
  onResponse,
  onError,
}: {
  reference: string;
  onResponse: (r: ChargeResponse) => void;
  onError: (msg: string) => void;
}) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);

  function setDigit(i: number, v: string) {
    const next = [...digits];
    next[i] = v.replace(/\D/g, "").slice(0, 1);
    setDigits(next);
    if (next[i] && i < digits.length - 1) {
      const el = document.getElementById(`otp-${i + 1}`) as HTMLInputElement | null;
      el?.focus();
    }
  }

  async function submitOtp() {
    const otp = digits.join("");
    if (otp.length !== 6) return onError("Enter all six digits.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments/charge/submit-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, otp }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message ?? "OTP submission failed");
      }
      const data = (await res.json()) as ChargeResponse;
      onResponse(data);
    } catch (err) {
      onError(err instanceof Error ? err.message : "OTP submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="t-form" style={{ alignItems: "center", textAlign: "center", maxWidth: "none" }}>
      <h3 className="t-step__title" style={{ fontSize: 24 }}>
        Enter the <em>OTP</em> your bank just sent
      </h3>
      <p className="t-step__intro" style={{ maxWidth: "42ch", textAlign: "center" }}>
        Six digits, usually via SMS. We&rsquo;ll confirm the booking as soon as you submit.
      </p>
      <div className="t-otp-row">
        {digits.map((d, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            aria-label={`OTP digit ${i + 1}`}
            maxLength={1}
          />
        ))}
      </div>
      <button
        type="button"
        className="t-btn t-btn--primary"
        disabled={submitting || digits.join("").length !== 6}
        onClick={submitOtp}>
        {submitting ? "Submitting…" : "Submit OTP"}
      </button>
    </div>
  );
}
