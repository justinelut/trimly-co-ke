/**
 * /services/[slug] — SEO landing page per service.
 *
 * Statically generated (via generateStaticParams) for the four services
 * we ship. Each page renders LocalBusiness + Service JSON-LD, full
 * city-tiered pricing, the standard / sterilisation copy, and a primary
 * "Book this cut" CTA.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { SERVICE_CATALOG, formatKES } from "@lib/trimly/pricing";
import { buildBreadcrumbJsonLd, buildLocalBusinessJsonLd, buildServiceJsonLd } from "@lib/trimly/seo";
import type { ServiceSlug } from "@lib/trimly/types";
import process from "node:process";

const SITE = process.env.NEXT_PUBLIC_WEBAPP_URL ?? "https://trimly.co.ke";

export function generateStaticParams() {
  return Object.keys(SERVICE_CATALOG).map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = SERVICE_CATALOG[slug as ServiceSlug];
  if (!service) return { title: "Service not found · Trimly" };
  const description = `${service.description} ${formatKES(service.priceKESNakuru)} in Nakuru, ${formatKES(service.priceKESNairobi)} in Nairobi. Booked to your home.`;
  return {
    title: `${service.name} · ${service.durationMin} min · Trimly`,
    description,
    alternates: { canonical: `${SITE}/services/${slug}` },
    openGraph: {
      title: `${service.name} — Trimly`,
      description,
      url: `${SITE}/services/${slug}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: `${service.name} — Trimly`, description },
  };
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params;
  const service = SERVICE_CATALOG[slug as ServiceSlug];
  if (!service) notFound();

  const jsonLd = [
    buildLocalBusinessJsonLd(),
    buildServiceJsonLd(slug as ServiceSlug),
    buildBreadcrumbJsonLd([
      ["Home", "/"],
      ["Services", "/services"],
      [service.name, `/services/${slug}`],
    ]),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="t-section t-container" style={{ paddingTop: 140 }}>
        <p className="t-eyebrow t-eyebrow--accent" style={{ marginBottom: 16 }}>
          Service · {service.durationMin} minutes
        </p>
        <h1 className="t-display" style={{ maxWidth: "14ch", marginBottom: 32 }}>
          The <em>{service.name.replace(/^The\s+/, "")}</em>.
        </h1>
        <p className="t-lead" style={{ maxWidth: "52ch" }}>
          {service.description}
        </p>

        {/* Pricing in both cities */}
        <section className="t-areas" style={{ marginTop: 64 }}>
          <div className="t-area-tier">
            <div className="t-area-tier__head">
              <p className="t-eyebrow t-eyebrow--accent">Nakuru · Standard rate</p>
              <h2 className="t-area-tier__name">Home base</h2>
              <p className="t-area-tier__city-meta">
                Monday to Saturday across Section 58, Naka, Kiamunyi, Pipeline, Lanet, Bahati, and the CBD.
              </p>
            </div>
            <div className="t-area-tier__price-row">
              <p className="t-price t-area-tier__price">{formatKES(service.priceKESNakuru)}</p>
              <span className="t-area-tier__price-unit">{service.unit}</span>
            </div>
          </div>

          <div className="t-area-tier t-area-tier--travel">
            <div className="t-area-tier__head">
              <p className="t-eyebrow">Nairobi · Travel premium</p>
              <h2 className="t-area-tier__name">Travel visit</h2>
              <p className="t-area-tier__city-meta">
                Tuesdays and Saturdays only. Westlands, Kilimani, Karen, Lavington, Runda, Kileleshwa.
              </p>
            </div>
            <div className="t-area-tier__price-row">
              <p className="t-price t-area-tier__price">{formatKES(service.priceKESNairobi)}</p>
              <span className="t-area-tier__price-unit">{service.unit}</span>
            </div>
            <p className="t-area-tier__note">
              Travel from Nakuru is a 4–6 hour round trip. Most economical for households of two or more.
            </p>
          </div>
        </section>

        {/* What's included */}
        <section style={{ marginTop: 96 }}>
          <p className="t-eyebrow" style={{ marginBottom: 16 }}>
            What's included
          </p>
          <h2 className="t-section-title" style={{ marginBottom: 48, maxWidth: "20ch" }}>
            The standard, every <em>visit</em>.
          </h2>
          <ol className="t-standard">
            <li>
              <div>
                <p className="t-standard__statement">
                  Sterilised tools — clippers, scissors and combs in barbicide for the full ten-minute cycle.
                </p>
                <p className="t-standard__detail">
                  A fresh sealed pouch travels with the chair. You see it opened. If you ever do not, the cut is free.
                </p>
              </div>
            </li>
            <li>
              <div>
                <p className="t-standard__statement">
                  A new clipper guard, disposable neck strip, and fresh towel — every client, no exceptions.
                </p>
                <p className="t-standard__detail">Cost passes through; the line item never does.</p>
              </div>
            </li>
            <li>
              <div>
                <p className="t-standard__statement">
                  Hot-towel finish and clean shave-down of the neck — included in every {service.name.toLowerCase()}.
                </p>
                <p className="t-standard__detail">
                  Not an add-on. Not a "premium upgrade." The cut isn't finished without it.
                </p>
              </div>
            </li>
            {service.slug === "executive" || service.slug === "household" ? (
              <li>
                <div>
                  <p className="t-standard__statement">
                    Time for the <em>{service.slug === "executive" ? "beard sculpting" : "two-cut switch"}</em> — built into the 75 minutes, not rushed at the end.
                  </p>
                  <p className="t-standard__detail">
                    The Standard is 45 minutes for a reason. The Executive and Father &amp; Son are longer because they have more to do.
                  </p>
                </div>
              </li>
            ) : null}
          </ol>
        </section>

        {/* Related services */}
        <section style={{ marginTop: 96 }}>
          <p className="t-eyebrow" style={{ marginBottom: 16 }}>
            Other services
          </p>
          <h2 className="t-section-title" style={{ marginBottom: 32 }}>
            More from <em>Trimly</em>.
          </h2>
          <div className="t-services">
            {Object.values(SERVICE_CATALOG)
              .filter((s) => s.slug !== service.slug)
              .map((s) => (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  className="t-service"
                  style={{ textDecoration: "none" }}>
                  <h3 className="t-service__name">{s.name}</h3>
                  <p className="t-service__duration">{s.durationMin} minutes</p>
                  <p className="t-service__desc">{s.description}</p>
                  <p className="t-service__price">
                    {formatKES(s.priceKESNakuru)}
                    <span className="t-service__price-unit">{s.unit} · Nakuru</span>
                  </p>
                </Link>
              ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section style={{ marginTop: 96, marginBottom: 96, textAlign: "center" }}>
          <h2 className="t-section-title" style={{ maxWidth: "22ch", margin: "0 auto 32px" }}>
            Book <em>{service.name.toLowerCase()}</em> · from {formatKES(service.priceKESNakuru)}.
          </h2>
          <Link href={`/book?service=${service.slug}`} className="t-btn t-btn--primary t-btn--lg">
            Book this cut
          </Link>
        </section>
      </main>
    </>
  );
}
