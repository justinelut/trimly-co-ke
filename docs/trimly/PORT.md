# Trimly — Port into cal.diy

This document covers the Trimly customization layer that has been added to the
cal.diy monorepo. It is the bridge between the design prototypes (HTML) and
the running production app (Next.js).

## Activation status

**Prisma persistence is ACTIVATED.** Every API route, cron service, webhook handler, and
data adapter now talks to the real database. The path from "fresh clone" to "running app
with persistence" is:

```bash
# 1. Install deps (once)
yarn install

# 2. Generate Prisma client + create the migration
#    Schema additions: 3 new optional User columns, 1 new TrimlyPaymentMethod model,
#    1 new @@unique on TrimlyAvailability(date, city), plus all the Trimly models
#    appended earlier in the port.
yarn workspace @calcom/prisma prisma migrate dev --name trimly_initial
yarn prisma generate

# 3. Seed TrimlyService + TrimlyPlan catalogs (one-shot, idempotent)
yarn workspace @calcom/web tsx apps/web/scripts/seed-trimly.ts

# 4. Start the dev server
yarn workspace @calcom/web dev
```

After step 3 the booking wizard persists, the webhook handler dedupes via
`TrimlyWebhookEvent`, the renewal cron picks up real subscriptions, reconciliation sweeps
real pending payments, `/account` lists the customer's real bookings, and `/operator`
shows real revenue + clients.

Zero `TODO(trimly-port)` comments remain — verify with
`rg "TODO\(trimly-port\)" apps/web`. The remaining `TODO:` markers point to follow-on
work (Resend emails, Africa's Talking SMS, Google Maps Distance Matrix travel hints).

## What changed in cal.diy

Everything below is **additive** except for `apps/web/app/page.tsx`, which was a
29-line login-redirect file replaced by the new marketing route.

### New files

```
apps/web/
├── styles/trimly.css                                Trimly design tokens (scoped, --trimly-*)
├── app/api/health/route.ts                          200/503 probe for K8s manifests
└── app/(marketing)/
    ├── layout.tsx                                   Loads Fraunces font, sets data-trimly-theme
    ├── page.tsx                                     Public landing — all 11 sections from brief §7.1
    └── _components/
        ├── ThemeToggle.tsx                          Dark ⇄ light toggle (localStorage-persisted)
        ├── ScrollHeader.tsx                         Adds .is-scrolled to header past 24px
        └── BillingToggle.tsx                        Monthly ⇄ yearly price swap

packages/prisma/schema.prisma                        Appended 7 Trimly models + User inverse relations

k8s/                                                 9 manifests — namespace, configmap, secret template,
                                                     postgres, minio, deploy, cronjobs, migrate-job,
                                                     ghcr-pull-secret. See docs/trimly/DEPLOYMENT.md.

.github/workflows/trimly-deploy.yml                  Build → push to GHCR → SSH apply to K3s
docs/trimly/                                         DEPLOYMENT.md, APP-INTEGRATION.md, this file
```

### Modified files

| File | Change |
|---|---|
| `apps/web/app/page.tsx` | **Deleted.** Replaced by `app/(marketing)/page.tsx` which handles both unauthenticated visitors (renders marketing) and authenticated users (redirects to `/event-types`, preserving cal's original behaviour). |
| `packages/prisma/schema.prisma` | Appended Trimly models + 2 inverse relations on the existing `User` model (`trimlyBookings`, `trimlySubscriptions`). No existing model was modified or removed. |
| `.dockerignore` | Trimly-specific exclusions appended (workspaces, build artifacts). |

### Untouched

- `Dockerfile` — cal's existing multi-stage build handles the Trimly app just fine. The workflow passes Trimly-specific build args (`NEXT_PUBLIC_WEBAPP_URL=https://trimly.co.ke`, `BUILD_STANDALONE=true`).
- All other cal routes, auth, app-store, i18n, providers — unchanged.
- The shared theme tokens in `packages/config/theme/` — unchanged. Trimly tokens are namespaced `--trimly-*` and scoped via `[data-trimly-theme]`.

---

## How the marketing layer coexists with cal

### Style scoping

Trimly's CSS is in `apps/web/styles/trimly.css`. Every rule begins with
`[data-trimly-theme]` — meaning the rules **only apply when the wrapping
element has that attribute**. The wrapping element is the route-group div
rendered by `app/(marketing)/layout.tsx`.

Cal's existing UI never sets `data-trimly-theme`, so Trimly's styles cannot
leak into Cal's pages. Likewise, Trimly's tokens are prefixed `--trimly-*` so
they cannot collide with Cal's `--cal-*` tokens.

### Routing

| URL | Resolves to | Notes |
|---|---|---|
| `/` (visitor) | `app/(marketing)/page.tsx` | Renders the Trimly landing |
| `/` (signed in) | `app/(marketing)/page.tsx` → redirects to `/event-types` | Preserves cal's original behaviour |
| `/event-types`, `/availability`, `/settings`, etc. | Cal's existing routes (unchanged) | Cal dashboards still work |
| `/auth/login`, `/auth/signup` | Cal's existing auth routes (unchanged) | Trimly customers will use these too |
| `/api/health` | Trimly addition | 200 if DB reachable, used by K8s probes |
| `/api/cron/mpesa-renewal`, `/api/cron/payment-reconciliation` | **Not yet implemented** — required by `k8s/cronjobs.yaml` |
| `/api/webhooks/paystack` | **Not yet implemented** — required by Paystack |
| `/book`, `/services/[slug]`, `/areas/[area]` | **Not yet implemented** — referenced by marketing page CTAs |

### Fonts

Cal loads Inter as `--font-sans` (root layout). Trimly's marketing layout
adds **Fraunces** via `next/font/google` and exposes it as `--font-fraunces`.
Both variables coexist on the marketing route group; outside of it, only
Cal's fonts are loaded (Fraunces is not pulled in for cal's dashboards).

---

## First-run checklist

Run these commands locally to verify the port compiles and renders before
pushing to GitHub.

### 1. Install dependencies

```bash
yarn install
```

### 2. Generate the Prisma client (re-pick up Trimly models)

```bash
yarn prisma generate
```

If you see "Cannot find module '@prisma/client'" errors after this step, run
`yarn install` again — the postinstall hook usually fixes it.

### 3. Create the migration locally (development DB)

```bash
yarn workspace @calcom/prisma prisma migrate dev --name trimly_initial
```

This creates a migration file under `packages/prisma/migrations/<timestamp>_trimly_initial/`
and applies it to your local development database.

> **Production migrations are NOT run automatically.** Per the build brief and
> AGENTS.md, schema migrations run manually via `kubectl apply -f k8s/migrate-job.yaml`
> after deployment. See `docs/trimly/DEPLOYMENT.md` §4 for the exact commands.

### 4. Run the dev server

```bash
yarn workspace @calcom/web dev
```

Visit:
- http://localhost:3000 — Trimly marketing (as a signed-out visitor)
- http://localhost:3000/auth/login — Cal's login (sign in, hit `/` again, get redirected to `/event-types`)
- http://localhost:3000/api/health — should return `{ "status": "ok" }`

### 5. Type-check and lint before pushing

```bash
yarn type-check:ci --force
yarn biome check --write .
```

These are the standard cal.diy checks per `agents/rules/ci-type-check-first.md`.

### 6. Commit (conventional commits, per cal's rules)

```bash
git add .
git commit -m "feat: trimly marketing landing + k8s deploy"
```

### 7. Push to GitHub

```bash
git push origin main
```

The workflow `.github/workflows/trimly-deploy.yml` triggers automatically.

---

## Outstanding work — known gaps

The marketing layer is done. The rest of the Trimly product surface is **not**:

| Surface | Status | Next step |
|---|---|---|
| Public marketing | ✅ Done | — |
| `/api/health` | ✅ Done | — |
| Prisma schema | ✅ Done | Run migration via `migrate-job.yaml` after first deploy |
| K8s manifests | ✅ Done | Run bootstrap commands in `docs/trimly/DEPLOYMENT.md` §1 |
| GitHub Actions workflow | ✅ Done | Set `SSH_PRIVATE_KEY` and `SERVER_IP` repo secrets |
| `/book` booking wizard | ❌ Not started | Customize cal's existing booking grid (brief §7.2) |
| Custom Paystack UI (M-Pesa + cards) | ❌ Not started | Server: `POST /charge` with `mobile_money` and tokenized card. Client: our own waiting screen + 3DS handler. Never show Paystack chrome. |
| `/api/webhooks/paystack` | ❌ Not started | HMAC signature verification + idempotency log via `TrimlyWebhookEvent` |
| `/api/cron/mpesa-renewal`, `/api/cron/payment-reconciliation` | ❌ Not started | Required by `k8s/cronjobs.yaml`; bearer-token auth via `CRON_SECRET` |
| `/services/[slug]`, `/areas/[area]` | ❌ Not started | SEO landing pages per service and area |
| `/account` customer dashboard | ❌ Not started | Tabs: Upcoming, Past, Subscription, Profile, Payment methods |
| `/operator/*` dashboards | ❌ Not started | Today schedule, calendar, clients, payments, availability |
| Resend transactional emails | ❌ Not started | React Email templates |
| Africa's Talking SMS confirmations | ❌ Not started | 1-hour-before booking trigger |
| Playwright E2E for the booking flow | ❌ Not started | `apps/web/playwright/tests/trimly-*.e2e.ts` |
| Per-area SEO landing pages | ❌ Not started | Generate at build time from a static neighborhoods list |
| Paystack plan seeding script | ❌ Not started | `scripts/seed-paystack-plans.ts` |

The Working Doc's plan tasks track these as separate phases.

---

## Engineering standards already absorbed from `agents/rules/`

Future work in this repo must follow cal.diy's standards. Relevant rules
already informing the port:

- **Page-level auth** (`architecture-page-level-auth.md`): the session check
  in `app/(marketing)/page.tsx` lives in the page, not the layout. ✅
- **Conventional commits** (`ci-git-workflow.md`): commits should use
  `feat:`, `fix:`, `refactor:`. ✅
- **No barrel imports** (`quality-avoid-barrel-imports.md`): all imports are
  direct from source paths. ✅
- **Prisma `select` not `include`** (`data-prefer-select-over-include.md`):
  will apply when building Trimly repositories.
- **DTOs at boundaries** (`data-dto-boundaries.md`): every Trimly API route
  will validate input via Zod and return Zod-validated response DTOs.
- **Vertical slices** (`architecture-vertical-slices.md`): future Trimly
  business logic lands under `packages/features/trimly/` (booking, payment,
  subscription, availability — each a self-contained slice).
- **Repository pattern** (`data-repository-pattern.md`): no Prisma calls in
  services or routes — only inside `packages/features/trimly/*/repositories/`.

---

## Quick verification commands

```bash
# Confirm marketing files exist and parse
ls apps/web/app/\(marketing\)
ls apps/web/styles/trimly.css

# Confirm Prisma schema is well-formed
yarn prisma format

# Confirm migration plan is sane (does not apply, just reports)
yarn prisma migrate diff \
  --from-schema-datasource packages/prisma/schema.prisma \
  --to-schema-datamodel packages/prisma/schema.prisma \
  --script

# Render the marketing page in your browser
yarn workspace @calcom/web dev
```
