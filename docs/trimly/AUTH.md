# Trimly — Authentication

Customer-facing auth lives at `/login` and `/signup`. Both are fully Trimly-branded server components under the `(marketing)` route group, with the same warm-charcoal/brass palette and Fraunces display type as the rest of the public surface.

Under the hood, NextAuth still drives the actual session. Trimly hooks into two extension points:

1. The **EmailProvider `sendVerificationRequest` callback** (`packages/features/auth/lib/sendVerificationRequest.ts`) is replaced with a Trimly-first router that calls Resend + a React Email magic-link template. If `RESEND_API_KEY` is unset or the Trimly send fails, it falls back to cal's original Handlebars + nodemailer path — cal contributors who haven't run `yarn install` after the Trimly deps were added are not blocked.

2. The **signup flow** captures `name` + `phone` upfront via `/api/auth/trimly-signup` (a Zod-validated Prisma upsert that normalises the phone), then the client calls `signIn("email")` to fire the magic-link email. NextAuth's standard email provider only takes an email — by upserting first, we don't lose the name and phone.

## Routes

| URL | What it does | Calls |
|---|---|---|
| `/login` | Email magic-link + Google OAuth (if cal has it). Already-signed-in users redirect to `/account` (customer) or `/operator/today` (operator). | `signIn("email" \| "google")` |
| `/signup` | Name + Email + (optional) Phone. Upserts the User, then sends the magic link. | `POST /api/auth/trimly-signup` → `signIn("email")` |
| `/api/auth/trimly-signup` | Server-side User upsert with normalised phone. Returns 200 OK; client then triggers `signIn`. | `prisma.user.upsert` |
| `/auth/login`, `/auth/signup` | Cal's original pages. Still routable but no Trimly link points here anymore — every Trimly redirect goes to `/login` instead. |

## Magic-link email

| Layer | File |
|---|---|
| Template (JSX) | `apps/web/lib/trimly/messaging/templates/MagicLinkEmail.tsx` |
| Notify function | `apps/web/lib/trimly/messaging/notify-magic-link.ts` |
| Override entry point | `packages/features/auth/lib/sendVerificationRequest.ts` |

The template auto-switches between `sign_in` and `sign_up` copy by checking whether the email already exists in the User table. If the lookup throws, we default to `sign_in` copy (less alarming than greeting a returning customer as new).

## Why the fallback path exists

Cal.diy's `sendVerificationRequest.ts` is shared infrastructure. Three reasons to keep its nodemailer path:

1. **Cal contributors** (or anyone running cal's auth tests in CI without Trimly's `RESEND_API_KEY`) shouldn't be blocked. The original Handlebars + nodemailer path still works.
2. **Resend outage resilience.** If Resend's API is down, magic links degrade to nodemailer instead of failing entirely.
3. **Dynamic import** — the Trimly module is `await import()`'d at call time, so if the file doesn't exist in this checkout (e.g. mid-cherry-pick), cal's path still runs.

## Wiring map

```
Customer clicks "Email me a sign-in link" on /login
   ↓
signIn("email", { email, callbackUrl })            (next-auth/react, client-side)
   ↓
NextAuth fires its Email provider sendVerificationRequest callback
   ↓
packages/features/auth/lib/sendVerificationRequest.ts
   ↓
sendViaTrimly()        → notifyMagicLink()                 (Resend + MagicLinkEmail)
   │ fail-soft
   └─→ sendViaNodemailerFallback()                          (cal's original Handlebars path)
   ↓
Customer receives email, taps link
   ↓
NextAuth callback URL verifies token + creates session
   ↓
Customer lands on /account/upcoming (or /operator/today)
```

## Signup flow

```
Customer fills /signup form (name, email, phone)
   ↓
POST /api/auth/trimly-signup
   ↓
prisma.user.upsert by email — stores name + normalised trimlyPhone
   ↓
Client calls signIn("email", { email, callbackUrl: "/account/upcoming" })
   ↓
(same path as login from here)
```

## Required env vars

| Var | Where | Purpose |
|---|---|---|
| `RESEND_API_KEY` | Server | Activates the Resend path. Without it every magic link falls back to cal's nodemailer. |
| `RESEND_FROM` | Server | Defaults to `Trimly <bookings@trimly.co.ke>`. |
| `EMAIL_FROM`, SMTP creds | Server | Cal's existing nodemailer config. Kept as fallback — set the same way you would in upstream cal. |

## What still routes to cal's old pages

Customers will never see `/auth/login` or `/auth/signup` via Trimly's UI — every link and redirect now points at `/login` and `/signup`. The cal-branded pages still exist at their original paths (cal's own admin flows reach them directly) and continue to function. If you want to neutralise them entirely, drop a `redirect()` server component into `apps/web/app/(use-page-wrapper)/auth/login/page.tsx` (and signup) that bounces to `/login` / `/signup`.

## Local test recipe

```bash
# 1. Set env (one-time)
echo "RESEND_API_KEY=re_test_xxxxxxxxxxxxxxx" >> apps/web/.env.local
echo "RESEND_FROM='Trimly <bookings@trimly.co.ke>'" >> apps/web/.env.local

# 2. Run dev
yarn workspace @calcom/web dev

# 3. Visit /login — type a fresh email
# 4. Visit Resend dashboard or check console — magic link should arrive via Resend, not nodemailer
# 5. Visit /signup — fill out name + email + phone
# 6. Open .env.local without RESEND_API_KEY and repeat — magic link should now arrive via nodemailer
```

## Verification — branding audit

| Surface | After this turn |
|---|---|
| `/`, `/book`, `/account/*`, `/operator/*` | 100% Trimly |
| `/login`, `/signup` | **100% Trimly (NEW)** |
| Magic-link email | **100% Trimly via Resend (NEW)**, with cal nodemailer fallback |
| Post-login redirect | Goes to `/account/upcoming` or `/operator/today`, never to cal's `/event-types` |
| `/auth/login`, `/auth/signup` | Still cal-chrome but **no Trimly link reaches them** — only old bookmarks would |
| Cal's `/event-types`, `/availability`, `/settings` | Still cal-chrome; not customer-visible because of the redirect |
| Cal's other transactional emails (booking attendee notifications, etc.) | Out of scope — Trimly's bookings don't go through cal's booking pipeline |
