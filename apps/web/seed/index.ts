import type { Payload } from "payload";

import { seedServices } from "./services";
import { seedPlans } from "./plans";
import { seedAreas } from "./areas";
import { seedTestimonials } from "./testimonials";
import { seedFAQ } from "./faq";
import { seedGlobals } from "./globals";

export async function seedTrimly(payload: Payload, log?: (msg: string) => void) {
  const info = log || ((msg: string) => payload.logger.info(msg));

  // Skip if already seeded (check for any existing service)
  const existing = await payload.find({ collection: "services", limit: 1 });
  if (existing.docs.length > 0) {
    info("[seed] Data already exists — skipping seed.");
    return;
  }

  info("[seed] Starting Trimly seed...");

  // Collections
  await seedServices(payload);
  await seedPlans(payload);
  await seedAreas(payload);
  await seedTestimonials(payload);
  await seedFAQ(payload);

  // Globals
  await seedGlobals(payload);

  info("[seed] Trimly seed complete.");
}
