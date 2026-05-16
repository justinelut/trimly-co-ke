import type { Payload } from "payload";

export async function seedPlans(payload: Payload) {
  const data = [
    { name: "Starter", tagline: "Two cuts a month for clients who keep it tight.", monthlyPrice: 3200, yearlyPrice: 32000, monthlyWas: 4000, yearlyWas: 48000, features: [{ feature: "2 standard cuts per month" }, { feature: "Saturday + one weekday slot" }, { feature: "Priority over walk-up bookings" }, { feature: "WhatsApp confirmation, every visit" }], ctaLabel: "Start with Starter", popular: false, order: 1 },
    { name: "Regular", tagline: "Weekly cuts. The best per-cut rate Trimly offers.", monthlyPrice: 5600, yearlyPrice: 56000, monthlyWas: 8000, yearlyWas: 96000, features: [{ feature: "4 standard cuts per month" }, { feature: "Reserved weekly slot of your choice" }, { feature: "Beard touch-up between cuts on request" }, { feature: "Free reschedule up to 4 hours before" }, { feature: "WhatsApp confirmation, every visit" }], ctaLabel: "Start with Regular", popular: true, order: 2 },
    { name: "Executive", tagline: "Weekly executive cut + beard maintenance.", monthlyPrice: 7800, yearlyPrice: 78000, monthlyWas: 10000, yearlyWas: 120000, features: [{ feature: "4 executive cuts per month" }, { feature: "2 beard touch-ups in between" }, { feature: "Hot-towel + scalp treatment, every visit" }, { feature: "First slot of the week, guaranteed" }, { feature: "Concierge WhatsApp line" }], ctaLabel: "Start with Executive", popular: false, order: 3 },
  ];
  for (const d of data) await payload.create({ collection: "plans", data: { ...d, isActive: true } });
  payload.logger.info(`[seed] ${data.length} plans`);
}
