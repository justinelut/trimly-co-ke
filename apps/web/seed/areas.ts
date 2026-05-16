import type { Payload } from "payload";

export async function seedAreas(payload: Payload) {
  const data = [
    { name: "Section 58 / Milimani", slug: "section-58-milimani", city: "Nakuru" as const, priceTier: "standard" as const, basePrice: 2000, order: 1 },
    { name: "Naka", slug: "naka", city: "Nakuru" as const, priceTier: "standard" as const, basePrice: 2000, order: 2 },
    { name: "Kiamunyi", slug: "kiamunyi", city: "Nakuru" as const, priceTier: "standard" as const, basePrice: 2000, order: 3 },
    { name: "Pipeline", slug: "pipeline", city: "Nakuru" as const, priceTier: "standard" as const, basePrice: 2000, order: 4 },
    { name: "Lanet", slug: "lanet", city: "Nakuru" as const, priceTier: "standard" as const, basePrice: 2000, order: 5 },
    { name: "Bahati", slug: "bahati", city: "Nakuru" as const, priceTier: "standard" as const, basePrice: 2000, order: 6 },
    { name: "Nakuru CBD", slug: "nakuru-cbd", city: "Nakuru" as const, priceTier: "standard" as const, basePrice: 2000, order: 7 },
    { name: "Westlands", slug: "westlands", city: "Nairobi" as const, priceTier: "travel-premium" as const, basePrice: 5000, order: 8 },
    { name: "Kilimani", slug: "kilimani", city: "Nairobi" as const, priceTier: "travel-premium" as const, basePrice: 5000, order: 9 },
    { name: "Karen", slug: "karen", city: "Nairobi" as const, priceTier: "travel-premium" as const, basePrice: 5000, order: 10 },
    { name: "Lavington", slug: "lavington", city: "Nairobi" as const, priceTier: "travel-premium" as const, basePrice: 5000, order: 11 },
    { name: "Runda", slug: "runda", city: "Nairobi" as const, priceTier: "travel-premium" as const, basePrice: 5000, order: 12 },
    { name: "Kileleshwa", slug: "kileleshwa", city: "Nairobi" as const, priceTier: "travel-premium" as const, basePrice: 5000, order: 13 },
  ];
  for (const d of data) await payload.create({ collection: "areas", data: d });
  payload.logger.info(`[seed] ${data.length} areas`);
}
