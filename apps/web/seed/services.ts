import type { Payload } from "payload";

export async function seedServices(payload: Payload) {
  const data = [
    { name: "The standard", slug: "standard", description: "Clippers, scissors, line-up, finish. Best for clients booking us monthly.", duration: "45 minutes", priceNakuru: 2000, priceNairobi: 5000, unit: "/ cut", iconPath: "M7 4l10 16M17 4L7 20", order: 1 },
    { name: "The executive", slug: "executive", description: "Hot towel, beard sculpting, scalp treatment. The standard, with time.", duration: "75 minutes", priceNakuru: 2500, priceNairobi: 6000, unit: "/ cut", iconPath: "M3 7h18M5 7v12h14V7M9 11h6M9 15h6", order: 2 },
    { name: "The beard", slug: "beard", description: "Beard alone — shape, edge, oil. For weeks the cut still holds.", duration: "30 minutes", priceNakuru: 1500, priceNairobi: 4000, unit: "/ session", iconPath: "M4 20l8-16 8 16M8 14h8", order: 3 },
    { name: "Father & son", slug: "household", description: "Two cuts, one visit. Standard tier each, same home, same chair.", duration: "75 minutes", priceNakuru: 3500, priceNairobi: 9000, unit: "/ household", iconPath: "M12 4a4 4 0 100 8 4 4 0 000-8zM6 20a6 6 0 0112 0", order: 4 },
  ];
  for (const d of data) await payload.create({ collection: "services", data: { ...d, isActive: true } });
  payload.logger.info(`[seed] ${data.length} services`);
}
