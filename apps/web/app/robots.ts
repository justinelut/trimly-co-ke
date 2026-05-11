/**
 * Robots policy for Trimly. Allows all marketing routes; disallows
 * authenticated surfaces and webhooks. The sitemap is auto-referenced.
 *
 * Served at /robots.txt by Next.js App Router.
 */
import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_WEBAPP_URL ?? "https://trimly.co.ke";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/account",
          "/operator",
          "/api",
          // Cal's authenticated dashboards — never useful to crawl.
          "/event-types",
          "/availability",
          "/settings",
          "/auth",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
