"use client";

/**
 * Profile editor — name, phone, preferred city, preferred contact channel.
 * Email is intentionally read-only here; cal.diy already has its own
 * email-change flow at /settings/security if/when a customer needs it.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";

import type { CustomerProfileDto } from "../_lib/account-types";

export function ProfileForm({ initial }: { initial: CustomerProfileDto }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [preferredCity, setPreferredCity] = useState<CustomerProfileDto["preferredCity"]>(initial.preferredCity);
  const [preferredContact, setPreferredContact] = useState<CustomerProfileDto["preferredContact"]>(initial.preferredContact);
  const [stage, setStage] = useState<"idle" | "pending" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStage("pending");
    setError(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, preferredCity, preferredContact }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Save failed (${res.status})`);
      }
      setStage("saved");
      router.refresh();
      // Reset the "saved" indicator after a couple of seconds
      setTimeout(() => setStage("idle"), 2400);
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Could not save the profile.");
    }
  }

  return (
    <form className="t-form" onSubmit={save} noValidate>
      <div className="t-field">
        <label htmlFor="prof-email">Email</label>
        <input id="prof-email" type="email" value={initial.email} readOnly aria-readonly />
        <span className="t-field__hint">Change your email in cal.diy account settings.</span>
      </div>

      <div className="t-field">
        <label htmlFor="prof-name">Name</label>
        <input id="prof-name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </div>

      <div className="t-field">
        <label htmlFor="prof-phone">M-Pesa / WhatsApp number</label>
        <input
          id="prof-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          inputMode="tel"
          placeholder="0712 345 678"
        />
        <span className="t-field__hint">
          We send STK prompts and the 15-minute arrival WhatsApp to this number.
        </span>
      </div>

      <div className="t-field--row">
        <div className="t-field">
          <label htmlFor="prof-city">Preferred city</label>
          <select id="prof-city" value={preferredCity} onChange={(e) => setPreferredCity(e.target.value as CustomerProfileDto["preferredCity"])}>
            <option value="Nakuru">Nakuru</option>
            <option value="Nairobi">Nairobi</option>
          </select>
        </div>
        <div className="t-field">
          <label htmlFor="prof-contact">Reach us by</label>
          <select id="prof-contact" value={preferredContact} onChange={(e) => setPreferredContact(e.target.value as CustomerProfileDto["preferredContact"])}>
            <option value="whatsapp">WhatsApp (default)</option>
            <option value="sms">SMS only</option>
            <option value="email">Email only</option>
          </select>
        </div>
      </div>

      {error ? <p className="t-field__hint t-field__hint--error">{error}</p> : null}

      <div className="t-step__actions">
        <button type="submit" className="t-btn t-btn--primary" disabled={stage === "pending"}>
          {stage === "pending" ? "Saving…" : stage === "saved" ? "Saved ✓" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
