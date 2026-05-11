# Trimly — Customer account dashboard

`/account` is the signed-in customer's home. Five tabs covering bookings (upcoming + past), the active subscription, profile editing, and saved payment methods.

## Routes

| URL | What | Notes |
|---|---|---|
| `/account` | Redirect | Goes to `/account/upcoming` |
| `/account/upcoming` | List of confirmed + in-progress bookings | Server component, fetches via account-data adapter |
| `/account/past` | Completed / cancelled / no-show bookings | Same shape, reverse-chronological |
| `/account/subscription` | Single subscription card with cycle progress + actions | Empty state pushes to `/#subscriptions` if no sub |
| `/account/profile` | Editable form (name, phone, preferred city, preferred contact) | Phone is normalised server-side before persistence |
| `/account/payment-methods` | Saved M-Pesa numbers + tokenised cards | Card "tokens" are Paystack authorization codes; we only show last4 + brand |

## Auth

Every `page.tsx` calls `requireCustomer()` from `_lib/require-customer.ts` as its first line. That helper:

1. Calls `getServerSession` (cal.diy's NextAuth wrapper)
2. If no session → `redirect("/auth/login?callbackUrl=/account/...")`
3. Returns `{ id, email, name }` to the page

Page-level auth, never layout-level — per cal's `architecture-page-level-auth.md`. The `AccountHeader` component is a layout-LIKE shared chrome but lives as a regular component imported into each page, so the auth check still runs before any data fetch.

The same threat model applies to the API routes (`/api/account/*`). They use a sister helper, `_utils/require-customer-from-headers.ts`, that returns a discriminated union instead of redirecting — so the route can serialise a 401/403.

## Data flow

```
page.tsx
  ↓
requireCustomer()  ← session check + redirect-or-return
  ↓
fetchBookings / fetchSubscription / fetchProfile / fetchPaymentMethods
  ↓
returns DTOs (account-types.ts) — never Prisma row types
  ↓
BookingCard / SubscriptionCard / ProfileForm render
```

Per cal's `data-dto-boundaries.md` the page components only ever see `BookingDto`, `SubscriptionDto`, `PaymentMethodDto`, `CustomerProfileDto`. The adapter in `_lib/account-data.ts` is the boundary — today it returns mock data, after migration it'll do real Prisma reads with `select` projections (per `data-prefer-select-over-include.md`) and map the rows to DTOs.

## Component map

```
apps/web/app/(marketing)/account/
├── page.tsx                                  redirect to /upcoming
├── upcoming/page.tsx                         tab 1
├── past/page.tsx                             tab 2
├── subscription/page.tsx                     tab 3
├── profile/page.tsx                          tab 4
├── payment-methods/page.tsx                  tab 5
├── _lib/
│   ├── account-types.ts                      DTOs (all the page sees)
│   ├── require-customer.ts                   auth helper for pages
│   └── account-data.ts                       adapter — mock today, Prisma next
└── _components/
    ├── AccountHeader.tsx                     header + tab bar (server)
    ├── BookingCard.tsx                       one booking row (server)
    ├── SubscriptionCard.tsx                  the sub card (server)
    ├── PaymentMethodList.tsx                 (inlined in payment-methods page for now)
    ├── ProfileForm.tsx                       editable form (client)
    ├── CancelBookingButton.tsx               two-step inline confirm (client)
    ├── CancelSubscriptionButton.tsx          same pattern, sub-scoped (client)
    ├── StatusBadge.tsx                       small reusable badge
    └── EmptyState.tsx                        "no data yet" block

apps/web/app/api/account/
├── _utils/require-customer-from-headers.ts   shared auth for routes
├── profile/route.ts                          PATCH — update name/phone/prefs
├── bookings/[id]/cancel/route.ts             POST — cancel a booking
└── subscription/cancel/route.ts              POST — cancel sub at period end
```

## Booking cancellation rules

| Lead time before appointment | Outcome |
|---|---|
| > 4 hours | Free cancellation |
| ≤ 4 hours | 50 % late fee (we keep the deposit; rest is refunded) |
| No-show | 100 % charged; operator-handled |
| Subscribers | One free late cancel per cycle (counted on `TrimlySubscription.lateCancelsUsed`) |

These rules will live in the `prisma` block of `apps/web/app/api/account/bookings/[id]/cancel/route.ts` once the migration is applied — they're commented in place there now.

## Subscription cancellation

Two modes, controlled by the `immediate` flag in the POST body:

- `immediate: false` (default — the only mode the UI exposes): set `cancelAtPeriodEnd = true`. The customer keeps their remaining cuts; the subscription lapses at the end of the current cycle without renewing.
- `immediate: true`: cancel now (operator-only, not exposed in UI).

For card subscriptions, we ALSO call Paystack `/subscription/disable` so Paystack stops trying to auto-debit. M-Pesa subscriptions have no Paystack-side subscription object, so we just skip them in the renewal cron.

## Empty states

Every tab renders an `<EmptyState>` when there's nothing to show — single icon, headline, body, optional CTA. Avoids the "0 cuts · 0 hours · 0 KES" stat-grid trope that makes dashboards feel empty in a sad way.

## Local trigger

After running `yarn workspace @calcom/web dev` and signing in (or visiting `/auth/login` first if you're not), visit:

- http://localhost:3000/account → redirects to upcoming
- http://localhost:3000/account/upcoming → mock bookings render
- http://localhost:3000/account/subscription → mock active "Regular" sub
- http://localhost:3000/account/profile → editable form (POST 200 stub)
- http://localhost:3000/account/payment-methods → mock M-Pesa + Visa

If you're not signed in you get bounced to `/auth/login?callbackUrl=/account/upcoming` (cal's existing login flow), then back here on success.

## What's NOT included yet

- Real Prisma reads + writes — every `fetchX` / `POST` / `PATCH` has inline TODO blocks ready to uncomment after `yarn prisma migrate dev --name trimly_initial`
- Receipt PDF generation (the "Receipt" link on past bookings will 404 today)
- `/api/account/payment-methods/[id]/default` and `/remove` — the UI links are wired but the routes don't exist yet
- Reschedule a booking — uses the same booking wizard but pre-populated; deferred
- "Claim my anonymous bookings" — if a customer booked without an account, sign-up with the same email could attach those bookings retroactively. Needs an email-confirmation flow; deferred

All gaps marked `TODO(trimly-port)` and `rg`-findable.
