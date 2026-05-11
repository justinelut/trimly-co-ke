"use client";

/**
 * Step 5 — Payment method. Two tabs: M-Pesa | Card. Each tab delegates to
 * a self-contained component that handles its own Paystack flow and posts
 * the success callback back to the wizard, which navigates to /book/confirmation.
 */
import { useState } from "react";

import { formatKES } from "@lib/trimly/pricing";
import type { City, ServiceSlug } from "@lib/trimly/types";

import { PaymentCard } from "./PaymentCard";
import { PaymentMpesa } from "./PaymentMpesa";

type Method = "mpesa" | "card";

interface Props {
  bookingId: string;
  serviceSlug: ServiceSlug;
  city: City;
  email: string;
  phone: string;
  amountKES: number;
  onSucceeded: (reference: string, method: Method) => void;
}

export function StepPayment({
  bookingId,
  serviceSlug,
  city,
  email,
  phone,
  amountKES,
  onSucceeded,
}: Props) {
  const [method, setMethod] = useState<Method>("mpesa");

  return (
    <div className="t-step">
      <div className="t-step__head">
        <p className="t-eyebrow">Step 05</p>
        <h2 className="t-step__title">
          How would you like to <em>pay</em>?
        </h2>
        <p className="t-step__intro">
          M-Pesa pushes an STK prompt to your phone. Card payments are encrypted right here on
          this page — Trimly never sees the number. Total today:{" "}
          <strong style={{ color: "var(--trimly-text-primary)" }}>{formatKES(amountKES)}</strong>.
        </p>
      </div>

      <div className="t-pay-tabs" role="tablist" aria-label="Payment method">
        <button
          type="button"
          role="tab"
          aria-selected={method === "mpesa"}
          className={`t-pay-tab${method === "mpesa" ? " t-pay-tab--active" : ""}`}
          onClick={() => setMethod("mpesa")}>
          <span className="t-pay-tab__name">M-Pesa</span>
          <span className="t-pay-tab__meta">STK push · 1.5 % fee · no card required</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={method === "card"}
          className={`t-pay-tab${method === "card" ? " t-pay-tab--active" : ""}`}
          onClick={() => setMethod("card")}>
          <span className="t-pay-tab__name">Card</span>
          <span className="t-pay-tab__meta">Visa · Mastercard · 2.9 % local · 3.8 % intl</span>
        </button>
      </div>

      {method === "mpesa" ? (
        <PaymentMpesa
          bookingId={bookingId}
          serviceSlug={serviceSlug}
          city={city}
          email={email}
          defaultPhone={phone}
          amountKES={amountKES}
          onSucceeded={(ref) => onSucceeded(ref, "mpesa")}
        />
      ) : (
        <PaymentCard
          bookingId={bookingId}
          serviceSlug={serviceSlug}
          city={city}
          email={email}
          amountKES={amountKES}
          onSucceeded={(ref) => onSucceeded(ref, "card")}
        />
      )}
    </div>
  );
}
