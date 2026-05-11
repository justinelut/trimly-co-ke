/**
 * Per-neighborhood metadata for the /areas/[area] SEO landing pages and
 * the LocalBusiness JSON-LD on every Trimly page.
 *
 * The slug is the URL segment. The name is the editorial display. The
 * blurb is a single sentence that anchors the page in real-world context
 * (used in the hero copy and the OG image's tagline). geo coordinates
 * power the LocalBusiness "geo" + "areaServed" properties.
 */
import type { City } from "./types";

export interface Neighborhood {
  slug: string;
  name: string;
  city: City;
  /** "Standard" (Nakuru) or "Travel premium" (Nairobi). */
  tier: "standard" | "travel_premium";
  /** Editorial one-liner used in hero copy + OG tagline. */
  blurb: string;
  /** Approximate centre — used for the LocalBusiness `geo` property. */
  geo: { lat: number; lng: number };
}

export const NEIGHBORHOODS: Neighborhood[] = [
  // Nakuru
  {
    slug: "section-58-milimani",
    name: "Section 58 / Milimani",
    city: "Nakuru",
    tier: "standard",
    blurb: "The quiet streets above Nakuru CBD where bankers, doctors, and lawyers live.",
    geo: { lat: -0.305, lng: 36.075 },
  },
  {
    slug: "naka",
    name: "Naka",
    city: "Nakuru",
    tier: "standard",
    blurb: "The leafy estate east of CBD — gated compounds, family homes, weekend mornings.",
    geo: { lat: -0.295, lng: 36.082 },
  },
  {
    slug: "kiamunyi",
    name: "Kiamunyi",
    city: "Nakuru",
    tier: "standard",
    blurb: "The hillside off the Nairobi-Nakuru highway — newer estates, professional households.",
    geo: { lat: -0.286, lng: 36.04 },
  },
  {
    slug: "pipeline",
    name: "Pipeline",
    city: "Nakuru",
    tier: "standard",
    blurb: "A mixed-use suburb west of CBD — old houses with new owners.",
    geo: { lat: -0.314, lng: 36.06 },
  },
  {
    slug: "lanet",
    name: "Lanet",
    city: "Nakuru",
    tier: "standard",
    blurb: "The eastern gateway to Nakuru — military families, schools, growing estates.",
    geo: { lat: -0.336, lng: 36.16 },
  },
  {
    slug: "bahati",
    name: "Bahati",
    city: "Nakuru",
    tier: "standard",
    blurb: "Greener and quieter, north of the city centre.",
    geo: { lat: -0.241, lng: 36.119 },
  },
  {
    slug: "nakuru-cbd",
    name: "Nakuru CBD",
    city: "Nakuru",
    tier: "standard",
    blurb: "The heart of the city — apartments above shopfronts, hotels along Kenyatta Avenue.",
    geo: { lat: -0.303, lng: 36.08 },
  },
  // Nairobi
  {
    slug: "westlands",
    name: "Westlands",
    city: "Nairobi",
    tier: "travel_premium",
    blurb: "The corporate-and-residential heart of Nairobi — penthouses above the noise.",
    geo: { lat: -1.265, lng: 36.81 },
  },
  {
    slug: "kilimani",
    name: "Kilimani",
    city: "Nairobi",
    tier: "travel_premium",
    blurb: "Apartment-dense, professional, walkable — Nairobi's UN-and-NGO district.",
    geo: { lat: -1.293, lng: 36.79 },
  },
  {
    slug: "karen",
    name: "Karen",
    city: "Nairobi",
    tier: "travel_premium",
    blurb: "Acres of garden, horses in the paddock, the suburb that gave Out of Africa its title.",
    geo: { lat: -1.319, lng: 36.708 },
  },
  {
    slug: "lavington",
    name: "Lavington",
    city: "Nairobi",
    tier: "travel_premium",
    blurb: "Diplomatic residences, embassy chefs, the quietest dinner parties in town.",
    geo: { lat: -1.282, lng: 36.768 },
  },
  {
    slug: "runda",
    name: "Runda",
    city: "Nairobi",
    tier: "travel_premium",
    blurb: "Forested compounds, half-acre plots, the Nairobi most foreign films pretend to be.",
    geo: { lat: -1.211, lng: 36.832 },
  },
  {
    slug: "kileleshwa",
    name: "Kileleshwa",
    city: "Nairobi",
    tier: "travel_premium",
    blurb: "The leafy spine between Kilimani and Westlands — old apartments, slow weekend traffic.",
    geo: { lat: -1.279, lng: 36.776 },
  },
];

export function findNeighborhoodBySlug(slug: string): Neighborhood | undefined {
  return NEIGHBORHOODS.find((n) => n.slug === slug);
}

export function neighborhoodsByCity(city: City): Neighborhood[] {
  return NEIGHBORHOODS.filter((n) => n.city === city);
}
