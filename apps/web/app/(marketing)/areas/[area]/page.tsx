/**
 * /areas/[area] — SEO landing page per neighborhood.
 *
 * Statically generated for all thirteen neighborhoods we ship (seven
 * Nakuru, six Nairobi). Each page renders LocalBusiness + per-area
 * JSON-LD, a hero anchored in the neighborhood's character, all four
 * services priced at the area's tier, and a primary CTA.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import {
  NEIGHBORHOODS,
  findNeighborhoodBySlug,
  neighborhoodsByCity,
} from "@lib/trimly/neighborhoods";
import { SERVICE_CATALOG, formatKES } from "@lib/trimly/pricing";
import { buildAreaJsonLd, buildLocalBusinessJsonLd } from "@lib/trimly/seo";

const SITE = process.env.NEXT_PUBLIC_WEBAPP_URL ?? "https://trimly.co.ke";

export function generateStaticParams() {
  return NEIGHBORHOODS.map((n) => ({ area: n.slug }));
}

interface PageProps {
  params: Promise<{ area: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { area } = await params;
  const n = findNeighborhoodBySlug(area);
  if (!n) return { title: "Area not found · Trimly" };
  const fromPrice =
    n.tier === "standard"
      ? formatKES(SERVICE_CATALOG.beard.priceKESNakuru)
      : formatKES(SERVICE_CATALOG.beard.priceKESNairobi);
  const description = `Trimly's house-call barber service in ${n.name}, ${n.city}. ${n.blurb} From ${fromPrice}.`;
  return {
    title: `Trimly · ${n.name}, ${n.city}`,
    description,
    alternates: { canonical: `${SITE}/areas/${area}` },
    openGraph: {
      title: `Trimly · ${n.name}`,
      description,
      url: `${SITE}/areas/${area}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: `Trimly · ${n.name}`, description },
  };
}

export default async function AreaPage({ params }: PageProps) {
  const { area } = await params;
  const n = findNeighborhoodBySlug(area);
  if (!n) notFound();

  const jsonLd = [buildLocalBusinessJsonLd(), buildAreaJsonLd(area)];
  const isStandard = n.tier === "standard";
  const tierLabel = isStandard ? "Standard pricing" : "Travel-premium pricing";
  const tierEyebrow = isStandard ? "Home base · Standard rate" : "Travel visit · Premium rate";
  const otherAreas = neighborhoodsByCity(n.city).filter((other) => other.slug !== n.slug);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="t-header is-scrolled">
        <div className="t-header__inner">
          <Link href="/" className="t-wordmark">
            Trim<em>ly</em>
          </Link>
          <nav className="t-nav" aria-label="Primary">
            <Link href="/#services">Services</Link>
            <Link href="/#subscriptions">Pricing</Link>
            <Link href="/#areas">Areas</Link>
          </nav>
          <div className="t-header__cta">
            <Link href="/book" className="t-btn t-btn--primary">
              Book a cut
            </Link>
          </div>
        </div>
      </header>

      <main className="t-section t-container" style={{ paddingTop: 140 }}>
        <p className="t-eyebrow t-eyebrow--accent" style={{ marginBottom: 16 }}>
          {n.city} · {tierLabel}
        </p>
        <h1 className="t-display" style={{ maxWidth: "18ch", marginBottom: 32 }}>
          Trimly comes to <em>{n.name}</em>.
        </h1>
        <p className="t-lead" style={{ maxWidth: "56ch" }}>
          {n.blurb} {isStandard
            ? "Booked to your door Monday through Saturday at the Nakuru standard rate."
            : "Booked to your door on selected days, at the travel-premium tier. We batch Nairobi trips to keep prices fair."}
        </p>

        {/* All four services priced for this area */}
        <section style={{ marginTop: 64 }}>
          <p className="t-eyebrow" style={{ marginBottom: 16 }}>
            Services in {n.name}
          </p>
          <h2 className="t-section-title" style={{ marginBottom: 48 }}>
            Four cuts · <em>{tierLabel.toLowerCase()}</em>
          </h2>
          <div className="t-services">
            {Object.values(SERVICE_CATALOG).map((s) => {
              const price = isStandard ? s.priceKESNakuru : s.priceKESNairobi;
              return (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  className="t-service"
                  style={{ textDecoration: "none" }}>
                  <h3 className="t-service__name">{s.name}</h3>
                  <p className="t-service__duration">{s.durationMin} minutes</p>
                  <p className="t-service__desc">{s.description}</p>
                  <p className="t-service__price">
                    {formatKES(price)}
                    <span className="t-service__price-unit">{s.unit}</span>
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* What "house call" actually means here */}
        <section style={{ marginTop: 96 }}>
          <p className="t-eyebrow" style={{ marginBottom: 16 }}>
            How it works in {n.name}
          </p>
          <h2 className="t-section-title" style={{ marginBottom: 32, maxWidth: "18ch" }}>
            From booking to <em>cut</em>, ninety seconds.
          </h2>
          <ol className="t-standard">
            <li>
              <div>
                <p className="t-standard__statement">
                  Pick a slot. The booking flow shows the price for {n.city} before you commit to a service.
                </p>
                <p className="t-standard__detail">
                  No surprises at checkout. The travel premium for Nairobi is visible at city-select, not buried in fine print.
                </p>
              </div>
            </li>
            <li>
              <div>
                <p className="t-standard__statement">
                  Tell us where to find you in {n.name} — estate, gate, floor.
                </p>
                <p className="t-standard__detail">
                  We send a WhatsApp ping 15 minutes before arrival so you're never caught mid-meeting.
                </p>
              </div>
            </li>
            <li>
              <div>
                <p className="t-standard__statement">
                  Pay on your phone. M-Pesa STK push or card — your call.
                </p>
                <p className="t-standard__detail">
                  M-Pesa lands as a prompt on your handset; you approve with your PIN. Cards tokenise on the page; we never see the number.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* Other neighborhoods in the same city */}
        <section style={{ marginTop: 96 }}>
          <p className="t-eyebrow" style={{ marginBottom: 16 }}>
            Also serving · {n.city}
          </p>
          <h2 className="t-section-title" style={{ marginBottom: 32 }}>
            Other <em>{n.city}</em> neighborhoods.
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 1,
              background: "var(--trimly-border)",
              border: "1px solid var(--trimly-border)",
            }}>
            {otherAreas.map((other) => (
              <Link
                key={other.slug}
                href={`/areas/${other.slug}`}
                style={{
                  background: "var(--trimly-background)",
                  padding: "24px 24px 20px",
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  color: "var(--trimly-text-primary)",
                }}>
                <span
                  style={{
                    fontFamily: "var(--font-fraunces), serif",
                    fontWeight: 700,
                    fontSize: 18,
                    letterSpacing: "-0.01em",
                  }}>
                  {other.name}
                </span>
                <span style={{ fontSize: 12, color: "var(--trimly-text-muted)", letterSpacing: "0.02em" }}>
                  {other.blurb}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section style={{ marginTop: 96, marginBottom: 96, textAlign: "center" }}>
          <h2 className="t-section-title" style={{ maxWidth: "22ch", margin: "0 auto 32px" }}>
            Book a cut in <em>{n.name}</em>.
          </h2>
          <Link href={`/book?city=${encodeURIComponent(n.city)}`} className="t-btn t-btn--primary t-btn--lg">
            Book a cut · from {formatKES(isStandard ? SERVICE_CATALOG.beard.priceKESNakuru : SERVICE_CATALOG.beard.priceKESNairobi)}
          </Link>
        </section>
      </main>
    </>
  );
}
