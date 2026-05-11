"use client";

/**
 * Step 2 — Service picker. Prices are city-dependent and are pulled from
 * SERVICE_CATALOG via the parent (no client-side price math).
 */
import { SERVICE_CATALOG, formatKES } from "@lib/trimly/pricing";
import type { City, ServiceSlug } from "@lib/trimly/types";

interface Props {
  city: City;
  value?: ServiceSlug;
  onSelect: (slug: ServiceSlug) => void;
}

export function StepService({ city, value, onSelect }: Props) {
  const services = Object.values(SERVICE_CATALOG);

  return (
    <div className="t-step">
      <div className="t-step__head">
        <p className="t-eyebrow">Step 02</p>
        <h2 className="t-step__title">Which cut today?</h2>
        <p className="t-step__intro">
          Every cut includes line-up, hot-towel finish, and a clean neck shave-down. Prices
          shown are for {city} — the rate we agreed at step one.
        </p>
      </div>

      <div className="t-choice-grid">
        {services.map((service) => {
          const priceKES = city === "Nakuru" ? service.priceKESNakuru : service.priceKESNairobi;
          return (
            <button
              key={service.slug}
              type="button"
              className={`t-choice${value === service.slug ? " t-choice--selected" : ""}`}
              onClick={() => onSelect(service.slug)}
              aria-pressed={value === service.slug}>
              <p className="t-choice__eyebrow">{service.durationMin} minutes</p>
              <h3 className="t-choice__name">{service.name}</h3>
              <p className="t-choice__desc">{service.description}</p>
              <div className="t-choice__price-row">
                <span className="t-choice__price">{formatKES(priceKES)}</span>
                <span className="t-choice__price-unit">{service.unit}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
