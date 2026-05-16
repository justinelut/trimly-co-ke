import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services — Trimly | House-call barber services in Nakuru & Nairobi",
  description:
    "Four services, no upsells. Standard cut KES 2,000, executive KES 2,500, beard sculpt KES 1,500, father & son KES 3,500. Nakuru pricing; Nairobi travel-premium applies.",
  openGraph: {
    title: "Trimly Services — Premium house-call barber",
    description:
      "Standard cut, executive, beard sculpt, father & son. Every cut includes line-up, hot-towel finish, and neck shave-down.",
  },
};

const SERVICES = [
  {
    slug: "standard",
    name: "The standard",
    duration: "45 minutes",
    desc: "Clippers, scissors, line-up, finish. Best for clients booking us monthly.",
    priceNakuru: "KES 2,000",
    priceNairobi: "KES 5,000",
    iconPath: "M7 4l10 16M17 4L7 20",
  },
  {
    slug: "executive",
    name: "The executive",
    duration: "75 minutes",
    desc: "Hot towel, beard sculpting, scalp treatment. The standard, with time.",
    priceNakuru: "KES 2,500",
    priceNairobi: "KES 6,000",
    iconPath: "M3 7h18M5 7v12h14V7M9 11h6M9 15h6",
  },
  {
    slug: "beard",
    name: "The beard",
    duration: "30 minutes",
    desc: "Beard alone — shape, edge, oil. For weeks the cut still holds.",
    priceNakuru: "KES 1,500",
    priceNairobi: "KES 4,000",
    iconPath: "M4 20l8-16 8 16M8 14h8",
  },
  {
    slug: "household",
    name: "Father & son",
    duration: "75 minutes",
    desc: "Two cuts, one visit. Standard tier each, same home, same chair.",
    priceNakuru: "KES 3,500",
    priceNairobi: "KES 9,000",
    iconPath: "M12 4a4 4 0 100 8 4 4 0 000-8zM6 20a6 6 0 0112 0",
  },
] as const;

export default function ServicesPage() {
  return (
    <>
      <section className="t-section t-section--bordered" style={{ paddingTop: 120 }}>
        <div className="t-container">
          <div className="t-section-head">
            <div>
              <p className="t-eyebrow">The services</p>
              <h2 className="t-section-title">Four cuts, no upsells.</h2>
            </div>
            <p className="t-lead">
              Every cut includes line-up, hot-towel finish, and a clean shave-down of the neck.
              No &ldquo;add-on&rdquo; fees at the door. Prices below are the Nakuru standard
              rate. Nairobi visits carry a travel premium — shown before you book.
            </p>
          </div>

          <div className="t-services">
            {SERVICES.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="t-service-card t-service-card--link"
                aria-label={`${s.name} — ${s.duration}, from ${s.priceNakuru}`}>
                <div className="t-service-card__icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.iconPath} />
                  </svg>
                </div>
                <h3 className="t-service-card__name">{s.name}</h3>
                <p className="t-service-card__duration">{s.duration}</p>
                <p className="t-service-card__desc">{s.desc}</p>
                <div className="t-service-card__prices">
                  <span className="t-price">{s.priceNakuru}</span>
                  <span className="t-service-card__city">Nakuru</span>
                  <span className="t-price">{s.priceNairobi}</span>
                  <span className="t-service-card__city">Nairobi</span>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: 48, textAlign: "center" }}>
            <Link href="/book" className="t-btn t-btn--primary t-btn--lg">
              Book a cut
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
