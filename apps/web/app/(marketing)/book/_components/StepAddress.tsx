"use client";

/**
 * Step 4 — Address + customer details. The estate dropdown is filtered by
 * the city the customer picked in Step 1. Phone is normalised server-side
 * but the UI also validates locally to catch common typos.
 */
import { useState } from "react";

import { NEIGHBORHOODS } from "@lib/trimly/types";
import type { BookingAddress, City } from "@lib/trimly/types";

interface CustomerInput {
  email: string;
  name: string;
  phone: string;
}

interface Props {
  city: City;
  address?: BookingAddress;
  customer?: CustomerInput;
  onSubmit: (address: BookingAddress, customer: CustomerInput) => void;
}

export function StepAddress({ city, address, customer, onSubmit }: Props) {
  const [estate, setEstate] = useState(address?.estate ?? NEIGHBORHOODS[city][0]);
  const [line1, setLine1] = useState(address?.addressLine1 ?? "");
  const [line2, setLine2] = useState(address?.addressLine2 ?? "");
  const [notes, setNotes] = useState(address?.notes ?? "");
  const [name, setName] = useState(customer?.name ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!line1.trim()) return setError("Please enter the street or building address.");
    if (!name.trim()) return setError("We need a name for the booking.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("That email doesn't look right.");
    const stripped = phone.replace(/\s|-/g, "");
    const phoneOk =
      /^0[17]\d{8}$/.test(stripped) ||
      /^\+254\d{9}$/.test(stripped) ||
      /^254\d{9}$/.test(stripped);
    if (!phoneOk) return setError("Phone should look like 0712 345 678 or +254712345678.");
    setError(null);
    onSubmit(
      { estate, addressLine1: line1.trim(), addressLine2: line2.trim() || undefined, notes: notes.trim() || undefined },
      { email: email.trim(), name: name.trim(), phone: stripped }
    );
  }

  return (
    <div className="t-step">
      <div className="t-step__head">
        <p className="t-eyebrow">Step 04</p>
        <h2 className="t-step__title">Where are we coming?</h2>
        <p className="t-step__intro">
          Estate, gate, floor — the more specific the address, the smoother the arrival. We
          send a WhatsApp ping 15 minutes out.
        </p>
      </div>

      <form className="t-form" onSubmit={handleSubmit} noValidate>
        <div className="t-field">
          <label htmlFor="estate">Estate / area</label>
          <select id="estate" value={estate} onChange={(e) => setEstate(e.target.value)}>
            {NEIGHBORHOODS[city].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="t-field">
          <label htmlFor="line1">Building, street, gate</label>
          <input
            id="line1"
            type="text"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            placeholder="e.g. Karibu Court, Block C, Gate 4"
            autoComplete="address-line1"
          />
        </div>

        <div className="t-field">
          <label htmlFor="line2">Floor / apartment / extra direction (optional)</label>
          <input
            id="line2"
            type="text"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            placeholder="e.g. 3rd floor, Apt 7"
            autoComplete="address-line2"
          />
        </div>

        <div className="t-field">
          <label htmlFor="notes">Notes for the barber (optional)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything we should know? Dog, child napping, preferred entrance, etc."
          />
        </div>

        <div className="t-field--row">
          <div className="t-field">
            <label htmlFor="name">Your name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="t-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@email.co.ke"
            />
          </div>
        </div>

        <div className="t-field">
          <label htmlFor="phone">M-Pesa / WhatsApp number</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0712 345 678"
            autoComplete="tel"
            inputMode="tel"
          />
          <span className="t-field__hint">
            We text the M-Pesa STK prompt to this number, and WhatsApp you when we&rsquo;re close.
          </span>
        </div>

        {error ? <p className="t-field__hint t-field__hint--error">{error}</p> : null}

        <div className="t-step__actions">
          <button type="submit" className="t-btn t-btn--primary t-btn--lg">
            Continue to payment
          </button>
        </div>
      </form>
    </div>
  );
}
