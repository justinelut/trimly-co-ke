/**
 * Server-side pricing for Trimly.
 *
 * The client NEVER computes price. It asks /api/bookings/quote with
 * { serviceSlug, city } and renders whatever the server returns. This
 * prevents a client-side bypass of the Nairobi travel premium.
 */
import type { City, ServiceSlug, TrimlyServiceCatalog, PriceQuote } from "./types";

/**
 * Canonical service catalog. In production this lives in the database
 * (TrimlyService model). Hard-coded here for the prototype — swap with a
 * `prisma.trimlyService.findUnique()` call once the migration has run and
 * the table has been seeded.
 */
export const SERVICE_CATALOG: Readonly<Record<ServiceSlug, TrimlyServiceCatalog>> = {
  standard: {
    slug: "standard",
    name: "The standard",
    durationMin: 45,
    priceKESNakuru: 2000,
    priceKESNairobi: 5000,
    description:
      "Clippers, scissors, line-up, finish. Best for clients booking us monthly.",
    unit: "/ cut",
  },
  executive: {
    slug: "executive",
    name: "The executive",
    durationMin: 75,
    priceKESNakuru: 2500,
    priceKESNairobi: 6000,
    description: "Hot towel, beard sculpting, scalp treatment. The standard, with time.",
    unit: "/ cut",
  },
  beard: {
    slug: "beard",
    name: "The beard",
    durationMin: 30,
    priceKESNakuru: 1500,
    priceKESNairobi: 4000,
    description: "Beard alone — shape, edge, oil. For weeks the cut still holds.",
    unit: "/ session",
  },
  household: {
    slug: "household",
    name: "Father & son",
    durationMin: 75,
    priceKESNakuru: 3500,
    priceKESNairobi: 9000,
    description:
      "Two cuts, one visit. Standard tier each, same home, same chair.",
    unit: "/ household",
  },
};

/**
 * Returns the server-validated quote for { serviceSlug, city }. Throws on
 * unknown service. Pricing rules live ONLY in this function — no other
 * module should compute Trimly prices.
 */
export function quote(serviceSlug: ServiceSlug, city: City): PriceQuote {
  const service = SERVICE_CATALOG[serviceSlug];
  if (!service) {
    throw new Error(`Unknown Trimly service: ${serviceSlug}`);
  }
  const amountKES = city === "Nakuru" ? service.priceKESNakuru : service.priceKESNairobi;
  return {
    serviceSlug,
    city,
    amountKES,
    amountKobo: amountKES * 100,
    currency: "KES",
    serviceName: service.name,
    durationMin: service.durationMin,
  };
}

/**
 * Format a KES amount the way Trimly displays it everywhere: "KES 2,000".
 * Locale-aware via the en-KE locale.
 */
export function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}
