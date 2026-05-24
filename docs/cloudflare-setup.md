# Cloudflare (free tier) in front of trimly.co.ke

The site already runs on the K3s box behind Traefik with Let's Encrypt certs.
Putting Cloudflare's free CDN in front of it gives you free DDoS protection,
free SSL termination at the edge, and — most usefully — page caching for
the marketing pages so the origin only sees a fraction of traffic.

This doc is the **operator runbook**. The steps below the **"Already done
via API"** marker have been applied automatically using the Zone Settings
API token in `~/.bashrc` (`CLOUDFLARE_API_TOKEN`). The remaining steps need
the dashboard because the token doesn't have `Rulesets:Edit` permission.

The application code already does the half that has to live in code:

- `apps/web/next.config.ts` sends both `Cache-Control` and `CDN-Cache-Control`
  headers for static assets (`/img/*`, `/fonts/*`, `/_next/static/*`,
  `/sitemap.xml`, `/robots.txt`). `CDN-Cache-Control` is honoured by
  Cloudflare independently of `Cache-Control`, so we cache aggressively at
  the edge while letting browsers revalidate sooner.
- Every authenticated route already returns `private, no-cache, no-store,
  max-age=0, must-revalidate` (cal.diy default), so Cloudflare will never
  cache logged-in HTML even if the Cache Rule below isn't applied yet.

## 1. Add the zone — DONE

Zone `trimly.co.ke` is on Cloudflare Free, status `active`,
zone_id `abd8507d0d4c4955105f38d5fdc4ecb6`.

## 2. SSL / TLS — DONE via API

Already applied with the `CLOUDFLARE_API_TOKEN` (Zone Settings:Edit):

| setting                    | value    |
|----------------------------|----------|
| ssl                        | strict   |
| always_use_https           | on       |
| automatic_https_rewrites   | on       |
| min_tls_version            | 1.2      |
| tls_1_3                    | on       |
| opportunistic_encryption   | on       |
| brotli                     | on       |
| early_hints                | on       |
| http3                      | on       |
| rocket_loader              | off      |
| browser_cache_ttl          | 0 (Respect Existing Headers) |
| security_level             | medium   |

Re-run with the snippet at the end of this file if you ever need to reset.

## 3. Caching rules — STILL MANUAL

The Zone Settings API token doesn't have `Rulesets:Edit`. Either elevate the
token (Account → API Tokens → edit, add **Zone › Rulesets › Edit**), or
apply these two rules in the dashboard at **Caching → Cache Rules**:

### Rule 1 — bypass cache for authenticated and API routes

- **Name**: `Bypass cache for app routes`
- **If incoming requests match** URI Path matches one of:
  `/account/*`, `/api/*`, `/auth/*`, `/event-types`, `/event-types/*`,
  `/availability`, `/availability/*`, `/bookings`, `/bookings/*`,
  `/booking/*`, `/settings/*`, `/video/*`
- **Then**: Eligible for cache: **No**

### Rule 2 — cache marketing HTML at the edge for 1 hour

- **Name**: `Cache marketing HTML`
- **If incoming requests match**:
  - URI Path matches one of: `/`, `/services`, `/services/*`, `/areas`,
    `/areas/*`, `/pricing`, `/stories`, `/legal/*`
- **Then**:
  - Eligible for cache: **Yes**
  - Edge TTL: **Override origin → 1 hour**
  - Browser TTL: **Respect existing headers**

Order matters in Cache Rules — Rule 1 (bypass) must be **above** Rule 2 in
the list, because Cache Rules short-circuit on first match.

## 4. Performance niceties — DONE via API

Brotli, Early Hints, HTTP/3, Rocket Loader off, Min TLS 1.2 — all set.

Two extras that aren't API-controllable, do them in the dashboard once:

- **Speed → Optimization → Image Optimization**:
  - **Polish**: Lossy (free for the apex domain)
  - **WebP** is included with Polish.
  - Note: this does not replace Next.js's built-in `next/image` optimisation;
    `next.config.ts` has `images.unoptimized = true` because the static export
    runs in a Docker image with no sharp binary, so Polish is a useful belt
    on top of that.
- **Network → 0-RTT Connection Resumption**: On (free, helps repeat visits).

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


## Appendix — re-apply zone settings via API

The token stored at `~/.bashrc` as `CLOUDFLARE_API_TOKEN` covers Zone Settings.
Run this any time you need to reset the settings to the documented baseline:

```bash
CF_TOKEN=$(bash -c 'eval "$(grep "^export CLOUDFLARE_API_TOKEN=" ~/.bashrc)"; echo "$CLOUDFLARE_API_TOKEN"')
ZONE="abd8507d0d4c4955105f38d5fdc4ecb6"
CF="https://api.cloudflare.com/client/v4/zones/$ZONE"

apply() {
  curl -s -X PATCH "$CF/settings/$1" \
    -H "Authorization: Bearer $CF_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$2" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print('  $1:', d['result']['value'] if d.get('success') else d.get('errors'))"
}

apply ssl                       '{"value":"strict"}'
apply always_use_https          '{"value":"on"}'
apply automatic_https_rewrites  '{"value":"on"}'
apply min_tls_version           '{"value":"1.2"}'
apply tls_1_3                   '{"value":"on"}'
apply opportunistic_encryption  '{"value":"on"}'
apply brotli                    '{"value":"on"}'
apply early_hints               '{"value":"on"}'
apply http3                     '{"value":"on"}'
apply rocket_loader             '{"value":"off"}'
apply browser_cache_ttl         '{"value":0}'
apply security_level            '{"value":"medium"}'
```
