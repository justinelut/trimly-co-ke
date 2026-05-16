import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Areas — Trimly | Service areas in Nakuru & Nairobi",
  description:
    "Trimly serves Nakuru (Section 58, Milimani, Naka, Kiamunyi, Pipeline, Lanet, Bahati) and Nairobi (Westlands, Kilimani, Karen, Lavington, Runda, Kileleshwa).",
};

const NAKURU_AREAS = [
  { name: "Section 58 / Milimani", slug: "section-58-milimani" },
  { name: "Naka", slug: "naka" },
  { name: "Kiamunyi", slug: "kiamunyi" },
  { name: "Pipeline", slug: "pipeline" },
  { name: "Lanet", slug: "lanet" },
  { name: "Bahati", slug: "bahati" },
  { name: "Nakuru CBD", slug: "nakuru-cbd" },
];

const NAIROBI_AREAS = [
  { name: "Westlands", slug: "westlands" },
  { name: "Kilimani", slug: "kilimani" },
  { name: "Karen", slug: "karen" },
  { name: "Lavington", slug: "lavington" },
  { name: "Runda", slug: "runda" },
  { name: "Kileleshwa", slug: "kileleshwa" },
];

export default function AreasPage() {
  return (
    <section className="t-section t-section--bordered" style={{ paddingTop: 120 }}>
      <div className="t-container">
        <div className="t-section-head">
          <div>
            <p className="t-eyebrow">Areas served</p>
            <h2 className="t-section-title">Two cities, two tiers.</h2>
          </div>
          <p className="t-lead">
            Nakuru is the home base — Monday to Saturday, standard pricing. Nairobi runs on
            selected days, at travel-premium pricing.
          </p>
        </div>

        <div className="t-areas">
          <div className="t-area-tier">
            <div className="t-area-tier__head">
              <p className="t-eyebrow t-eyebrow--accent">Home base · Standard pricing</p>
              <h3 className="t-area-tier__name">Nakuru</h3>
              <p className="t-area-tier__city-meta">
                Service runs Monday through Saturday. Standard rates apply.
              </p>
            </div>
            <div className="t-area-tier__price-row">
              <p className="t-price t-area-tier__price">KES 2,000</p>
              <span className="t-area-tier__price-unit">/ cut · standard</span>
            </div>
            <ul className="t-area-tier__neighborhoods">
              {NAKURU_AREAS.map((a) => (
                <li key={a.slug}>
                  <span className="t-area-tier__pin t-area-tier__pin--nakuru" />
                  <Link href={`/areas/${a.slug}`}>{a.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="t-area-tier t-area-tier--travel">
            <div className="t-area-tier__head">
              <p className="t-eyebrow">Travel visit · Premium pricing</p>
              <h3 className="t-area-tier__name">Nairobi</h3>
              <p className="t-area-tier__city-meta">
                A four-to-six hour round trip from Nakuru. Booked on selected days only.
              </p>
            </div>
            <div className="t-area-tier__price-row">
              <p className="t-price t-area-tier__price">KES 5,000</p>
              <span className="t-area-tier__price-unit">/ cut · travel premium</span>
            </div>
            <ul className="t-area-tier__neighborhoods">
              {NAIROBI_AREAS.map((a) => (
                <li key={a.slug}>
                  <span className="t-area-tier__pin t-area-tier__pin--nairobi" />
                  <Link href={`/areas/${a.slug}`}>{a.name}</Link>
                </li>
              ))}
            </ul>
            <p className="t-area-tier__note">
              Nairobi visits are most economical for households of two or more.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 48, textAlign: "center" }}>
          <Link href="/book" className="t-btn t-btn--primary t-btn--lg">
            Book a cut
          </Link>
        </div>
      </div>
    </section>
  );
}
