import type { Metadata } from "next";
import Link from "next/link";

import { BillingToggle } from "../_components/BillingToggle";
import { PlanCardCTA } from "../_components/PlanCardCTA";

export const metadata: Metadata = {
  title: "Pricing — Trimly | Premium house-call barber in Nakuru & Nairobi",
  description:
    "Trimly pricing: KES 2,000 per cut in Nakuru, KES 5,000 in Nairobi. Monthly subscriptions from KES 3,200. M-Pesa or card.",
  openGraph: {
    title: "Trimly Pricing — Per-cut & subscription plans",
    description:
      "Standard cuts from KES 2,000 in Nakuru. Subscriptions from KES 3,200/month. M-Pesa or card.",
  },
};

export default function PricingPage() {
  return (
    <>
      <section className="t-section t-section--bordered" style={{ paddingTop: 120 }}>
        <div className="t-container">
          <div className="t-section-head">
            <div>
              <p className="t-eyebrow">Per-cut pricing</p>
              <h2 className="t-section-title">Two cities, two tiers. No surprises.</h2>
            </div>
            <p className="t-lead">
              Nakuru is the home base — standard pricing. Nairobi carries a travel premium
              because the round trip costs half a day. The price is visible before you book.
            </p>
          </div>

          <div className="t-pricing-table">
            <table className="t-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Duration</th>
                  <th>Nakuru</th>
                  <th>Nairobi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <Link href="/services/standard">The standard</Link>
                  </td>
                  <td>45 min</td>
                  <td className="t-price-cell">KES 2,000</td>
                  <td className="t-price-cell">KES 5,000</td>
                </tr>
                <tr>
                  <td>
                    <Link href="/services/executive">The executive</Link>
                  </td>
                  <td>75 min</td>
                  <td className="t-price-cell">KES 2,500</td>
                  <td className="t-price-cell">KES 6,000</td>
                </tr>
                <tr>
                  <td>
                    <Link href="/services/beard">The beard</Link>
                  </td>
                  <td>30 min</td>
                  <td className="t-price-cell">KES 1,500</td>
                  <td className="t-price-cell">KES 4,000</td>
                </tr>
                <tr>
                  <td>
                    <Link href="/services/household">Father &amp; son</Link>
                  </td>
                  <td>75 min</td>
                  <td className="t-price-cell">KES 3,500</td>
                  <td className="t-price-cell">KES 9,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="t-section t-section--bordered">
        <div className="t-container">
          <div className="t-section-head">
            <div>
              <p className="t-eyebrow">Subscriptions</p>
              <h2 className="t-section-title">
                A standing reservation, on your <em>terms</em>.
              </h2>
            </div>
            <p className="t-lead">
              For clients who book the same week every month. You get a reserved seat in the
              rotation and a per-cut rate that beats walking up to any salon in Section 58.
              Cancel any time — no penalties, no minimum term.
            </p>
          </div>

          <BillingToggle />

          <div className="t-plans">
            <PlanCard
              name="Starter"
              slug="starter"
              tagline="Two cuts a month for clients who keep it tight."
              monthlyPrice="KES 3,200"
              yearlyPrice="KES 32,000"
              monthlyWas="KES 4,000"
              yearlyWas="KES 48,000"
              features={[
                "2 standard cuts per month",
                "Saturday + one weekday slot",
                "Priority over walk-up bookings",
                "WhatsApp confirmation, every visit",
              ]}
              ctaLabel="Start with Starter"
              ctaVariant="secondary"
            />
            <PlanCard
              name="Regular"
              slug="regular"
              tagline="Weekly cuts. The best per-cut rate Trimly offers."
              monthlyPrice="KES 5,600"
              yearlyPrice="KES 56,000"
              monthlyWas="KES 8,000"
              yearlyWas="KES 96,000"
              features={[
                "4 standard cuts per month",
                "Reserved weekly slot of your choice",
                "Beard touch-up between cuts on request",
                "Free reschedule up to 4 hours before",
                "WhatsApp confirmation, every visit",
              ]}
              ctaLabel="Start with Regular"
              ctaVariant="primary"
              popular
            />
            <PlanCard
              name="Executive"
              slug="executive"
              tagline="Weekly executive cut + beard maintenance."
              monthlyPrice="KES 7,800"
              yearlyPrice="KES 78,000"
              monthlyWas="KES 10,000"
              yearlyWas="KES 120,000"
              features={[
                "4 executive cuts per month",
                "2 beard touch-ups in between",
                "Hot-towel + scalp treatment, every visit",
                "First slot of the week, guaranteed",
                "Concierge WhatsApp line",
              ]}
              ctaLabel="Start with Executive"
              ctaVariant="secondary"
            />
          </div>

          <p className="t-plan__note">
            <strong>About M-Pesa renewals.</strong> Paystack does not support automatic M-Pesa
            debit. If you subscribe with M-Pesa, you will approve an STK prompt on your phone
            each cycle. Card subscriptions renew automatically. We will text you the morning
            of renewal either way.
          </p>

          <p className="t-plan__note" style={{ marginTop: 16 }}>
            <strong>Nairobi clients:</strong> subscriptions coming once we have a Nairobi-based
            barber on the roster. For now, <Link href="/book">individual bookings</Link>.
          </p>
        </div>
      </section>

      <section className="t-closing">
        <div className="t-container">
          <h2 className="t-display">
            Your next cut shouldn&rsquo;t cost you a <em>Saturday</em>.
          </h2>
          <div className="t-closing__cta" style={{ marginTop: 32 }}>
            <Link href="/book" className="t-btn t-btn--primary t-btn--lg">
              Book a cut · from KES 2,000
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/* ─── Local components ─── */

function PlanCard({
  name,
  slug,
  tagline,
  monthlyPrice,
  yearlyPrice,
  monthlyWas,
  yearlyWas,
  features,
  ctaLabel,
  ctaVariant,
  popular,
}: {
  name: string;
  slug: string;
  tagline: string;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyWas: string;
  yearlyWas: string;
  features: string[];
  ctaLabel: string;
  ctaVariant: "primary" | "secondary";
  popular?: boolean;
}) {
  return (
    <div className={`t-plan${popular ? " t-plan--popular" : ""}`}>
      {popular ? <span className="t-plan__badge">Most popular</span> : null}
      <h3 className="t-plan__name">{name}</h3>
      <p className="t-plan__tagline">{tagline}</p>
      <p className="t-plan__price" data-monthly={monthlyPrice} data-yearly={yearlyPrice}>
        {monthlyPrice}
        <span className="t-plan__interval"> / month</span>
      </p>
      <p className="t-plan__was" data-monthly-was={monthlyWas} data-yearly-was={yearlyWas}>
        was {monthlyWas}
      </p>
      <ul className="t-plan__features">
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <PlanCardCTA slug={slug} label={ctaLabel} variant={ctaVariant} />
    </div>
  );
}
