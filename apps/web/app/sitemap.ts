/**
 * Public sitemap — Trimly's marketing routes only. Cal's authenticated
 * dashboards are intentionally excluded; they're not customer-facing.
 *
 * Next.js App Router serves this at /sitemap.xml automatically.
 */
import type { MetadataRoute } from "next";

import { NEIGHBORHOODS } from "@lib/trimly/neighborhoods";
import { SERVICE_CATALOG } from "@lib/trimly/pricing";

const SITE = process.env.NEXT_PUBLIC_WEBAPP_URL ?? "https://trimly.co.ke";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const monthly = "monthly" as const;
  const weekly = "weekly" as const;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: weekly, priority: 1.0 },
    { url: `${SITE}/book`, lastModified: now, changeFrequency: monthly, priority: 0.9 },
    { url: `${SITE}/login`, lastModified: now, changeFrequency: monthly, priority: 0.4 },
    { url: `${SITE}/signup`, lastModified: now, changeFrequency: monthly, priority: 0.5 },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = Object.keys(SERVICE_CATALOG).map((slug) => ({
    url: `${SITE}/services/${slug}`,
    lastModified: now,
    changeFrequency: monthly,
    priority: 0.7,
  }));

  const areaRoutes: MetadataRoute.Sitemap = NEIGHBORHOODS.map((n) => ({
    url: `${SITE}/areas/${n.slug}`,
    lastModified: now,
    changeFrequency: monthly,
    priority: 0.7,
  }));

  return [...staticRoutes, ...serviceRoutes, ...areaRoutes];
}
