/**
 * Public sitemap — every Trimly marketing route a search engine should index.
 *
 * The cal.diy authenticated dashboards (/event-types, /availability, /settings,
 * /bookings, /apps, /auth, /api) are intentionally excluded because they're
 * not customer-facing — robots.ts blocks them anyway, but listing them here
 * would just waste crawl budget.
 *
 * Next.js App Router serves this automatically at /sitemap.xml.
 *
 * Lastmod is set to the current build time, which is "good enough" given how
 * static the marketing copy is. If the marketing copy starts changing per
 * commit, swap to reading the per-route file mtime via fs.stat.
 */
import type { MetadataRoute } from "next";

import { NEIGHBORHOODS } from "@lib/trimly/neighborhoods";
import { SERVICE_CATALOG } from "@lib/trimly/pricing";
import process from "node:process";

const SITE = process.env.NEXT_PUBLIC_WEBAPP_URL ?? "https://trimly.co.ke";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const monthly = "monthly" as const;
  const weekly = "weekly" as const;
  const yearly = "yearly" as const;

  // ---- Top-of-funnel marketing pages (highest priority) -------------------
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: weekly, priority: 1.0 },
    { url: `${SITE}/book`, lastModified: now, changeFrequency: monthly, priority: 0.95 },
    { url: `${SITE}/services`, lastModified: now, changeFrequency: monthly, priority: 0.85 },
    { url: `${SITE}/areas`, lastModified: now, changeFrequency: monthly, priority: 0.85 },
    { url: `${SITE}/pricing`, lastModified: now, changeFrequency: monthly, priority: 0.8 },
    { url: `${SITE}/stories`, lastModified: now, changeFrequency: monthly, priority: 0.7 },
  ];

  // ---- Service landing pages (per cut) ------------------------------------
  const serviceRoutes: MetadataRoute.Sitemap = Object.keys(SERVICE_CATALOG).map((slug) => ({
    url: `${SITE}/services/${slug}`,
    lastModified: now,
    changeFrequency: monthly,
    priority: 0.75,
  }));

  // ---- Area landing pages (per neighborhood, key local-SEO surface) -------
  const areaRoutes: MetadataRoute.Sitemap = NEIGHBORHOODS.map((n) => ({
    url: `${SITE}/areas/${n.slug}`,
    lastModified: now,
    changeFrequency: monthly,
    priority: 0.75,
  }));

  // ---- Account creation entry points (lower priority) ---------------------
  const authRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/login`, lastModified: now, changeFrequency: yearly, priority: 0.4 },
    { url: `${SITE}/register`, lastModified: now, changeFrequency: yearly, priority: 0.5 },
    { url: `${SITE}/forgot-password`, lastModified: now, changeFrequency: yearly, priority: 0.2 },
  ];

  // ---- Legal pages (must be in sitemap for trust + GDPR/E-A-T signals) ----
  const legalRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/legal/terms`, lastModified: now, changeFrequency: yearly, priority: 0.3 },
    { url: `${SITE}/legal/privacy`, lastModified: now, changeFrequency: yearly, priority: 0.3 },
    { url: `${SITE}/legal/refund-policy`, lastModified: now, changeFrequency: yearly, priority: 0.3 },
  ];

  return [
    ...staticRoutes,
    ...serviceRoutes,
    ...areaRoutes,
    ...authRoutes,
    ...legalRoutes,
  ];
}
