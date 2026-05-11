# Trimly — SEO surfaces

Per Trimly brief §10 and §7.6: a service-detail page per service and an area landing page per neighborhood, each with `LocalBusiness` structured data and a dynamic OG image. This is the long-tail funnel — "barber Karen Nairobi", "house call barber Section 58", "executive barber Nakuru" — landing customers on a page that's specifically about their context.

## Routes shipped

| Pattern | Pages | Static? |
|---|---|---|
| `/services/[slug]` | 4 (standard, executive, beard, household) | Yes — `generateStaticParams()` |
| `/areas/[area]` | 13 (7 Nakuru + 6 Nairobi) | Yes — `generateStaticParams()` |
| `/services/[slug]/opengraph-image` | 4 dynamic PNGs | Generated on first request, cached |
| `/areas/[area]/opengraph-image` | 13 dynamic PNGs | Generated on first request, cached |
| `/sitemap.xml` | 1 | Generated from the static lists |
| `/robots.txt` | 1 | Disallows authenticated routes + cal admin |

Total **17 new SEO landing pages** + 17 OG images + sitemap + robots.

## Files

```
apps/web/lib/trimly/
├── neighborhoods.ts          13 entries with slug, name, city, tier, blurb, geo
└── seo.ts                    buildLocalBusinessJsonLd() + buildServiceJsonLd() + buildAreaJsonLd()

apps/web/app/(marketing)/
├── services/[slug]/
│   ├── page.tsx              Service detail page (server, statically generated)
│   └── opengraph-image.tsx   1200×630 PNG (Next.js next/og)
└── areas/[area]/
    ├── page.tsx              Neighborhood landing page (server, static)
    └── opengraph-image.tsx   1200×630 PNG

apps/web/app/
├── sitemap.ts                Public sitemap of all marketing routes
└── robots.ts                 Crawl rules + sitemap reference
```

## JSON-LD architecture

Every public Trimly page renders the **canonical `HairSalon` node** with `@id: ${SITE}/#trimly` plus a page-specific schema. Google stitches them by the shared `@id` so all pages describe one business.

- **`buildLocalBusinessJsonLd()`** — full HairSalon entity with `geo`, `areaServed` (all 13 neighborhoods), `openingHoursSpecification`, `makesOffer` (all four services with both city prices via `UnitPriceSpecification`), payment methods, address.
- **`buildServiceJsonLd(slug)`** — `Service` with `provider: { @id }` + two `Offer` nodes (Nakuru rate + Nairobi rate as separate eligible regions).
- **`buildAreaJsonLd(slug)`** — `LocalBusiness` for the neighborhood with `parentOrganization: { @id }`, area-specific `priceRange`, and `geo` from the neighborhood centroid.

These get rendered as `<script type="application/ld+json">` inside each page. Google's Rich Results Test should pass for all three shapes.

## Dynamic OG images

`opengraph-image.tsx` files export a server component that returns an `ImageResponse` from `next/og`. Cal.diy already uses `next/og` for its booking-share cards (no new dep).

Each OG is **1200×630 PNG** with the Trimly brand chrome:

- Background: warm charcoal `#111110`
- Accent: brass `#C9A96E`
- Text: bone `#F0EDE6`
- Serif: Georgia (system fallback for Fraunces — loading the variable font in `next/og` is fragile, and OG cards display thumbnail-sized in Twitter/WhatsApp/LinkedIn previews where the difference is invisible)
- Layout: wordmark top-left, eyebrow + title + bottom price strip

**Caching:** Next.js caches OG images per param combo. First request renders, subsequent requests serve from cache. The cache is per-deploy.

## Sitemap + robots

Auto-generated from the static lists. `/sitemap.xml` includes:
- 4 static routes (`/`, `/book`, `/login`, `/signup`)
- 4 service routes
- 13 area routes
- **Total: 21 URLs**

`/robots.txt` disallows `/account`, `/operator`, `/api`, plus cal's `/event-types`, `/availability`, `/settings`, `/auth` (those should never be crawled). Sitemap URL is referenced so Google discovers the marketing pages automatically.

## Verification recipe

```bash
yarn workspace @calcom/web build

# Static generation runs at build time — should produce
# 17 prerendered routes:
#   ○ /services/standard, /services/executive, /services/beard, /services/household
#   ○ /areas/section-58-milimani, /areas/naka, ... (13 total)

yarn workspace @calcom/web start

# Verify the JSON-LD is renderable
curl -s http://localhost:3000/services/standard | grep -A1 'application/ld+json'

# Hit an OG image — first request renders, ~500 ms; subsequent are cached
curl -sI http://localhost:3000/services/standard/opengraph-image | head -5
curl -sI http://localhost:3000/areas/karen/opengraph-image | head -5

# Sitemap
curl -s http://localhost:3000/sitemap.xml | head -30
curl -s http://localhost:3000/robots.txt
```

## Google Rich Results validation

Once deployed, run each URL through:
- https://search.google.com/test/rich-results
- https://validator.schema.org/

Expected coverage:
- `/` → HairSalon
- `/services/[slug]` → HairSalon + Service
- `/areas/[area]` → HairSalon + LocalBusiness (sub-entity for the area)

## What's NOT shipped yet

- **Per-area photographs.** The OG images are typographic. A future pass can layer the local cipper-work photograph behind the dark vignette at 0.4 opacity, area by area, to make each card visually distinctive.
- **Hreflang.** Trimly is English-only today. If Swahili gets added later, the `alternates` block in each `generateMetadata()` will need `hreflang: { 'en-KE': ..., 'sw-KE': ... }`.
- **Breadcrumb schema.** Adding a `BreadcrumbList` JSON-LD to /services/[slug] and /areas/[area] is a 20-line addition; deferred until the routes ship and we see what Google does with them.
- **next-sitemap.** Cal's brief mentioned next-sitemap. We're using Next.js's built-in `sitemap.ts` instead — fewer deps, same output. If we ever need finer-grained control (sitemap chunking for hundreds of pages, image sitemaps), next-sitemap is the upgrade path.
