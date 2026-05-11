/**
 * Schema.org JSON-LD builders for Trimly's public pages.
 *
 * Every page that wants rich Google search results pulls one of these,
 * stringifies it, and renders it in a <script type="application/ld+json">.
 *
 * Reference: https://schema.org/HairSalon
 */
import { NEIGHBORHOODS } from "./neighborhoods";
import { SERVICE_CATALOG } from "./pricing";

const SITE = process.env.NEXT_PUBLIC_WEBAPP_URL ?? "https://trimly.co.ke";
const TELEPHONE = process.env.TRIMLY_WHATSAPP_NUMBER
  ? `+${process.env.TRIMLY_WHATSAPP_NUMBER}`
  : "+254700000000";

/**
 * The canonical LocalBusiness node. Every other schema (Service, Area)
 * references it via `provider.@id` so Google can stitch the graph back to
 * one business entity rather than treating each page as a separate org.
 */
export function buildLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": `${SITE}/#trimly`,
    name: "Trimly",
    description:
      "Premium house-call barber for Nakuru and Nairobi. Booked to your home. M-Pesa or card.",
    url: SITE,
    image: `${SITE}/opengraph-image`,
    telephone: TELEPHONE,
    email: "hello@trimly.co.ke",
    priceRange: "KES 1,500–9,000",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Nakuru",
      addressRegion: "Nakuru County",
      addressCountry: "KE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -0.303,
      longitude: 36.08,
    },
    areaServed: NEIGHBORHOODS.map((n) => ({
      "@type": "Place",
      name: n.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: n.city,
        addressCountry: "KE",
      },
      geo: { "@type": "GeoCoordinates", latitude: n.geo.lat, longitude: n.geo.lng },
    })),
    paymentAccepted: ["M-Pesa", "Visa", "Mastercard"],
    currenciesAccepted: "KES",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "17:00",
      },
    ],
    makesOffer: Object.values(SERVICE_CATALOG).map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.name },
      priceCurrency: "KES",
      priceSpecification: [
        {
          "@type": "UnitPriceSpecification",
          price: s.priceKESNakuru,
          priceCurrency: "KES",
          eligibleQuantity: { "@type": "QuantitativeValue", value: 1 },
          description: `Nakuru rate · ${s.durationMin} min`,
        },
        {
          "@type": "UnitPriceSpecification",
          price: s.priceKESNairobi,
          priceCurrency: "KES",
          eligibleQuantity: { "@type": "QuantitativeValue", value: 1 },
          description: `Nairobi rate · ${s.durationMin} min`,
        },
      ],
    })),
  } as const;
}

/** Service-specific schema for /services/[slug] pages. */
export function buildServiceJsonLd(serviceSlug: keyof typeof SERVICE_CATALOG) {
  const service = SERVICE_CATALOG[serviceSlug];
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    provider: { "@id": `${SITE}/#trimly` },
    serviceType: "House-call barber",
    areaServed: [
      { "@type": "City", name: "Nakuru", address: { "@type": "PostalAddress", addressCountry: "KE" } },
      { "@type": "City", name: "Nairobi", address: { "@type": "PostalAddress", addressCountry: "KE" } },
    ],
    offers: [
      {
        "@type": "Offer",
        priceCurrency: "KES",
        price: service.priceKESNakuru,
        eligibleRegion: { "@type": "City", name: "Nakuru" },
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        priceCurrency: "KES",
        price: service.priceKESNairobi,
        eligibleRegion: { "@type": "City", name: "Nairobi" },
        availability: "https://schema.org/InStock",
      },
    ],
    image: `${SITE}/services/${serviceSlug}/opengraph-image`,
    url: `${SITE}/services/${serviceSlug}`,
  } as const;
}

/** Area-specific schema for /areas/[area] pages. */
export function buildAreaJsonLd(slug: string) {
  const n = NEIGHBORHOODS.find((nb) => nb.slug === slug);
  if (!n) return null;
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE}/areas/${slug}#business`,
    name: `Trimly · ${n.name}`,
    description: `Trimly's house-call barber service in ${n.name}, ${n.city}.`,
    parentOrganization: { "@id": `${SITE}/#trimly` },
    url: `${SITE}/areas/${slug}`,
    image: `${SITE}/areas/${slug}/opengraph-image`,
    telephone: TELEPHONE,
    priceRange: n.tier === "standard" ? "KES 1,500–3,500" : "KES 4,000–9,000",
    address: {
      "@type": "PostalAddress",
      addressLocality: n.city,
      addressCountry: "KE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: n.geo.lat,
      longitude: n.geo.lng,
    },
    areaServed: {
      "@type": "Place",
      name: n.name,
      address: { "@type": "PostalAddress", addressLocality: n.city, addressCountry: "KE" },
    },
  } as const;
}
