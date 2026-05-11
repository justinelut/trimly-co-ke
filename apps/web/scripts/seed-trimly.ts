/**
 * seed-trimly.ts — one-shot script to populate TrimlyService and
 * TrimlyPlan rows from the in-memory catalogs the front-end already
 * uses.
 *
 * Run AFTER the migration has been applied:
 *   yarn workspace @calcom/prisma prisma migrate dev --name trimly_initial
 *   yarn prisma generate
 *   yarn workspace @calcom/web tsx apps/web/scripts/seed-trimly.ts
 *
 * Idempotent — uses upsert by slug, so repeated runs are no-ops or
 * non-destructive updates if the catalog has drifted.
 */
import prisma from "@calcom/prisma";

import { SERVICE_CATALOG } from "../lib/trimly/pricing";

interface PlanSeed {
  slug: "starter" | "regular" | "executive";
  name: string;
  cutsPerMonth: number;
  priceKES: number;
  intervalMonths: number;
}

const PLAN_SEEDS: PlanSeed[] = [
  { slug: "starter", name: "Starter", cutsPerMonth: 2, priceKES: 3200, intervalMonths: 1 },
  { slug: "regular", name: "Regular", cutsPerMonth: 4, priceKES: 5600, intervalMonths: 1 },
  { slug: "executive", name: "Executive", cutsPerMonth: 4, priceKES: 7800, intervalMonths: 1 },
];

async function main() {
  // Services
  for (const svc of Object.values(SERVICE_CATALOG)) {
    await prisma.trimlyService.upsert({
      where: { slug: svc.slug },
      update: {
        name: svc.name,
        description: svc.description,
        durationMin: svc.durationMin,
        priceKESNakuru: svc.priceKESNakuru,
        priceKESNairobi: svc.priceKESNairobi,
        isActive: true,
      },
      create: {
        slug: svc.slug,
        name: svc.name,
        description: svc.description,
        durationMin: svc.durationMin,
        priceKESNakuru: svc.priceKESNakuru,
        priceKESNairobi: svc.priceKESNairobi,
        isActive: true,
      },
    });
    // eslint-disable-next-line no-console
    console.log(`[seed] service upserted: ${svc.slug}`);
  }

  // Plans
  for (const plan of PLAN_SEEDS) {
    await prisma.trimlyPlan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        cutsPerMonth: plan.cutsPerMonth,
        priceKES: plan.priceKES,
        intervalMonths: plan.intervalMonths,
        isActive: true,
      },
      create: {
        slug: plan.slug,
        name: plan.name,
        cutsPerMonth: plan.cutsPerMonth,
        priceKES: plan.priceKES,
        intervalMonths: plan.intervalMonths,
        isActive: true,
      },
    });
    // eslint-disable-next-line no-console
    console.log(`[seed] plan upserted: ${plan.slug}`);
  }

  // eslint-disable-next-line no-console
  console.log("[seed] done.");
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[seed] failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
