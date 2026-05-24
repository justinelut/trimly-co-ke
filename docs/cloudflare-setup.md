# Cloudflare (free tier) in front of trimly.co.ke

The site already runs on the K3s box behind Traefik with Let's Encrypt certs.
Putting Cloudflare's free CDN in front of it gives you free DDoS protection,
free SSL termination at the edge, and — most usefully — page caching for
the marketing pages so the origin only sees a fraction of traffic.

This doc is the **operator runbook**. Every step is done by hand once, in
the Cloudflare dashboard. There's no Terraform / IaC for this — the steps
below are intentionally short so you can follow them without cross-checking.

The application code already does the half that has to live in code:

- `apps/web/next.config.ts` sends `Cache-Control: public, max-age=86400,
  s-maxage=604800, stale-while-revalidate=2592000` for `/img/*` so
  Cloudflare caches images at the edge for a week.
- `/fonts/*` get `public, max-age=31536000, immutable`.
- `/sitemap.xml` and `/robots.txt` get `public, max-age=300, s-maxage=3600`.
- Every authenticated route already returns `private, no-cache, no-store,
  max-age=0, must-revalidate` (cal.diy default), so Cloudflare will never
  cache logged-in HTML.

You only need to do the steps below the first time, plus the cache-purge
when you ship a new image / asset version.

## 1. Add the zone

1. Sign in at <https://dash.cloudflare.com>.
2. **Add a Site** → enter `trimly.co.ke` → pick the **Free** plan.
3. Cloudflare scans the existing DNS records. Confirm the `A`/`AAAA` records
   for the apex and `www` are pointing at the K3s server's public IP, and
   that the orange cloud (proxy) is **on** for both.
4. Cloudflare gives you two nameservers (e.g. `kira.ns.cloudflare.com`,
   `walt.ns.cloudflare.com`). Update the nameservers at your registrar
   (Truehost / Safaricom / wherever the domain was bought). Propagation is
   usually under an hour but can take up to 24h.

## 2. SSL / TLS

In the dashboard:

1. **SSL/TLS → Overview** → set to **Full (strict)**. The K3s ingress already
   serves valid Let's Encrypt certs at the origin, so "Flexible" would
   actually downgrade end-to-end security. Use "Full (strict)".
2. **SSL/TLS → Edge Certificates**:
   - **Always Use HTTPS** → On.
   - **Automatic HTTPS Rewrites** → On.
   - **Minimum TLS Version** → 1.2.
   - **TLS 1.3** → On.
   - **HSTS** → enable, max-age 6 months to start, include subdomains, no
     preload yet (turn preload on after a month of clean operation).

## 3. Caching rules

The defaults are too cautious for a marketing site. Open
**Caching → Cache Rules** and add:

### Rule 1 — cache HTML for the marketing pages

- **Name**: `Cache marketing HTML`
- **If incoming requests match**:
  - Hostname equals `trimly.co.ke`
  - **AND** URI Path matches one of:
    `/`, `/services`, `/services/*`, `/areas`, `/areas/*`, `/pricing`,
    `/stories`, `/legal/*`
- **Then**:
  - Eligible for cache: **Yes**
  - Edge TTL: **Override origin → 1 hour**
  - Browser TTL: **Respect existing headers**

This caches public marketing HTML at the edge for an hour. The origin's
own `Cache-Control` headers still apply to logged-in routes, which sit
under different paths (`/account/*`, `/event-types`, etc.), so they're
never accidentally cached.

### Rule 2 — never cache anything authenticated or API

- **Name**: `Bypass cache for app routes`
- **If incoming requests match** URI Path matches one of:
  `/account/*`, `/api/*`, `/auth/*`, `/event-types`, `/event-types/*`,
  `/availability`, `/availability/*`, `/bookings/*`, `/settings/*`, `/booking/*`
- **Then**: Eligible for cache: **No**

Order matters in Cache Rules — drag this rule **above** Rule 1 in the list.

## 4. Performance niceties

- **Speed → Optimization → Content Optimization**:
  - **Auto Minify** (HTML/CSS/JS): On
  - **Brotli**: On
  - **Early Hints**: On (free, helps Core Web Vitals on the marketing pages)
- **Speed → Optimization → Image Optimization**:
  - **Polish**: Lossy (free for the apex domain)
  - **WebP** is included with Polish.
  - Note: this does not replace Next.js's built-in `next/image` optimisation;
    `next.config.ts` has `images.unoptimized = true` because the static export
    runs in a Docker image with no sharp binary, so Polish is a useful belt
    on top of that.
- **Network → HTTP/2**: On (default), **HTTP/3 (QUIC)**: On.

## 5. Page Rules — single redirect

Cloudflare's free plan gives 3 Page Rules. Use one for the apex/www redirect
that K3s already does — but doing it at the edge means the request never
even hits the origin:

- **URL**: `www.trimly.co.ke/*`
- **Setting**: Forwarding URL → 301 → `https://trimly.co.ke/$1`

## 6. Firewall / WAF (free tier defaults are fine)

- **Security → WAF → Managed Rules**: enable Cloudflare's free Managed
  Ruleset. It blocks the standard OWASP-Top-10 garbage at the edge.
- **Security → Bots**: Bot Fight Mode → On (free; blocks the dumbest bots,
  doesn't false-positive Googlebot).

## 7. Purging cache after a deploy

The build pushes to `ghcr.io/justinelut/trimly-co-ke:<sha>`. K3s rolls the
deployment, but Cloudflare's edge cache still holds the old HTML for up to
the Edge TTL you set (1h for marketing HTML).

For a regular deploy, the 1-hour TTL is fine — the cache catches up on its
own. For a hot-fix where you need the new HTML out instantly:

```bash
# From the dashboard: Caching → Configuration → "Purge Everything"
# Or via the API:
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

You can also purge a single URL — preferred over `purge_everything` because
it doesn't blow the whole edge cache:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://trimly.co.ke/","https://trimly.co.ke/pricing"]}'
```

If you want this automated on every deploy, add a step at the end of the
GitHub workflow that purges the marketing routes — but the 1h TTL is short
enough that automation isn't strictly necessary.

## 8. Sanity-check after the cutover

After nameservers propagate:

```bash
# DNS resolves to a Cloudflare IP (104.x or 172.x)
dig +short trimly.co.ke

# CF-Cache-Status header appears on responses
curl -sI https://trimly.co.ke/ | grep -i 'cf-cache-status\|cf-ray\|cache-control'

# A second request should hit the edge cache (HIT)
curl -sI https://trimly.co.ke/ | grep -i 'cf-cache-status'
curl -sI https://trimly.co.ke/ | grep -i 'cf-cache-status'
```

You should see `cf-cache-status: HIT` on the second request to a public
marketing route, and `cf-cache-status: BYPASS` on the response from
`/account/upcoming` after logging in. If you see HIT on an authenticated
route, the bypass rule is misconfigured — fix it before anything else.
