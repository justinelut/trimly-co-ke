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
import process from "node:process";

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


/**
 * FAQ schema for the homepage's FAQ section. Google may surface the answers
 * directly in search results as rich snippets — only the questions/answers
 * actually rendered on the page should be included here, or you'll get a
 * structured-data warning in Search Console for "content not visible to
 * users".
 *
 * The exact strings here MUST stay in lockstep with the <Faq> components on
 * the homepage. If you edit one, edit the other.
 */
export function buildFaqJsonLd() {
  const faqs: Array<{ q: string; a: string }> = [
    {
      q: "How do I book?",
      a: "Pick a city, a service, a date, an address, and a payment method — five steps on a single page. The whole flow runs on your phone in about ninety seconds. No phone call, no email back-and-forth.",
    },
    {
      q: "What does a Nakuru standard cut actually include?",
      a: "Forty-five minutes of clipper and scissor work — line-up, fade, taper, and a clean neck shave-down. A hot-towel finish closes every cut. Beard work is included if your beard is part of the cut; full beard sculpting is the Executive service.",
    },
    {
      q: "Do you bring the chair?",
      a: "No. We work from any dining or kitchen chair in your home. A counter or window with daylight helps; we will move things gently into place. The whole setup leaves no trace — we sweep and pack out every visit.",
    },
    {
      q: "What happens if I need to cancel?",
      a: "Free reschedule up to four hours before the appointment. Inside four hours, we charge fifty percent if the slot can't be filled. No-shows are charged in full. Subscribers get one free late cancel per cycle.",
    },
    {
      q: "How does the M-Pesa payment work?",
      a: "We send an STK prompt to your phone via Paystack. You approve it with your M-Pesa PIN — no need to navigate the Lipa Na M-Pesa menu yourself. You receive an M-Pesa SMS receipt as confirmation, plus an emailed line-item receipt within the hour.",
    },
    {
      q: "Is paying by card secure?",
      a: "Yes. Card details are tokenised by Paystack — they never touch Trimly's servers. The form on this site sends an encrypted token to Paystack, who handle PCI-DSS compliance. We see only the last four digits and the card brand on your receipt.",
    },
    {
      q: "Do you serve outside Nakuru and Nairobi?",
      a: "Not yet. Nakuru is the home base; Nairobi is the only travel city. Nakuru-adjacent towns (Naivasha, Gilgil, Eldama Ravine) are case-by-case for executive subscribers — message the founder if you are in one.",
    },
    {
      q: "Can I put my household on one subscription?",
      a: "Yes — the Father & Son service is built for it, and any subscription can be shared between two members of the same household. Add a second profile under your account; we'll alternate the cuts.",
    },
    {
      q: "What if I don't like the cut?",
      a: "Tell the founder before we leave, and we fix it on the spot. Tell us in the next twenty-four hours, and we refund in full. The Standard commitment is unconditional — there's nothing to argue about.",
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  } as const;
}

/**
 * BreadcrumbList — gives Google the page-hierarchy chips it shows in mobile
 * search results. Build with the array of [name, path] tuples for the trail.
 *
 * @example
 *   buildBreadcrumbJsonLd([
 *     ["Home", "/"],
 *     ["Services", "/services"],
 *     ["The standard", "/services/standard"],
 *   ])
 */
export function buildBreadcrumbJsonLd(crumbs: Array<readonly [string, string]>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: `${SITE}${path}`,
    })),
  } as const;
}
