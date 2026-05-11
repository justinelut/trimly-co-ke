"use client";

/**
 * Step 1 — City picker. Non-skippable per the Trimly brief: the price
 * tier is shown BEFORE the customer commits to a service, never as a
 * surprise at checkout.
 */
import type { City } from "@lib/trimly/types";

interface Props {
  value?: City;
  onSelect: (city: City) => void;
}

export function StepCity({ value, onSelect }: Props) {
  return (
    <div className="t-step">
      <div className="t-step__head">
        <p className="t-eyebrow">Step 01</p>
        <h2 className="t-step__title">
          Where are you booking <em>from</em>?
        </h2>
        <p className="t-step__intro">
          Nakuru is the home base — Monday to Saturday at standard pricing. Nairobi runs on
          selected days only and carries a travel premium. The price for each city is shown
          below before you pick a service.
        </p>
      </div>

      <div className="t-choice-grid">
        <button
          type="button"
          className={`t-choice${value === "Nakuru" ? " t-choice--selected" : ""}`}
          onClick={() => onSelect("Nakuru")}
          aria-pressed={value === "Nakuru"}>
          <p className="t-choice__eyebrow t-choice__eyebrow--accent">Home base · Standard</p>
          <h3 className="t-choice__name">Nakuru</h3>
          <p className="t-choice__desc">
            Section 58, Naka, Kiamunyi, Pipeline, Lanet, Bahati, CBD. Monday–Saturday.
          </p>
          <div className="t-choice__price-row">
            <span className="t-choice__price">KES 2,000</span>
            <span className="t-choice__price-unit">/ cut · from</span>
          </div>
        </button>

        <button
          type="button"
          className={`t-choice${value === "Nairobi" ? " t-choice--selected" : ""}`}
          onClick={() => onSelect("Nairobi")}
          aria-pressed={value === "Nairobi"}>
          <p className="t-choice__eyebrow">Travel visit · Premium</p>
          <h3 className="t-choice__name">Nairobi</h3>
          <p className="t-choice__desc">
            Westlands, Kilimani, Karen, Lavington, Runda, Kileleshwa. Selected days only.
          </p>
          <div className="t-choice__price-row">
            <span className="t-choice__price">KES 5,000</span>
            <span className="t-choice__price-unit">/ cut · from</span>
          </div>
          <p className="t-choice__inline-note">
            Includes travel from Nakuru. Most economical for households of two or more.
          </p>
        </button>
      </div>
    </div>
  );
}
