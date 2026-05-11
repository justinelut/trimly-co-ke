# Trimly — Operator console

`/operator` is the founder's view of the business. Five tabs covering today's run, the week ahead, the client roster, revenue, and availability.

## Routes

| URL | Tab | What |
|---|---|---|
| `/operator` | — | Redirects to `/operator/today` |
| `/operator/today` | Today | Chronological stops with WhatsApp + Call + "Cut done" actions and a top KPI strip |
| `/operator/calendar` | Calendar | 7-day grid with each day's bookings as pills, today highlighted, Sundays blocked by default |
| `/operator/clients` | Clients | Searchable customer list (name / email / phone / estate) with totals + last cut |
| `/operator/payments` | Payments | Four KPIs (today / week / month / pending) + 30-day inline-SVG revenue chart |
| `/operator/availability` | Availability | 28-day block-or-open strip |

## Auth

Different from the customer side. The operator gate is in `_lib/require-operator.ts` (and `_utils/require-operator-from-headers.ts` for API routes), and checks the signed-in user's email against the `TRIMLY_OPERATOR_EMAILS` env var (comma-separated, set in the trimly-co-ke Kubernetes Secret).

- Not signed in → redirect to `/auth/login?callbackUrl=/operator/...`
- Signed in but email not in the allowed list → redirect to `/account` (the customer's own dashboard)
- Signed in AND in the allowed list → render

Long-term: replace the env-var check with a `TrimlyUser.role = "operator"` column. The helper's signature doesn't change.

```bash
# Add to the trimly-co-ke-secret on the cluster:
kubectl patch secret trimly-co-ke-secret -n trimly-co-ke \
  --type='json' \
  -p='[{"op":"add","path":"/data/TRIMLY_OPERATOR_EMAILS","value":"'"$(echo -n 'founder@trimly.co.ke,ops@trimly.co.ke' | base64 -w0)"'"}]'
kubectl rollout restart deployment/trimly-co-ke-deployment -n trimly-co-ke
```

## File map

```
apps/web/app/(marketing)/operator/
├── page.tsx                      redirect → /today
├── today/page.tsx                today's stops + KPI strip
├── calendar/page.tsx             7-day week view
├── clients/page.tsx              searchable client list
├── payments/page.tsx             KPIs + 30-day chart
├── availability/page.tsx         28-day block-or-open strip
├── _lib/
│   ├── operator-types.ts         DTOs (StopDto, ClientSummaryDto, RevenuePoint, AvailabilityDay, WeekViewDay, RevenueSnapshot)
│   ├── require-operator.ts       auth gate for pages (redirects on miss)
│   └── operator-data.ts          adapter — mock today, Prisma-shaped TODOs inline
└── _components/
    ├── OperatorHeader.tsx        header + tab nav (server)
    ├── StopCard.tsx              one stop (server) — uses customer's BookingStatusBadge
    ├── RevenueChart.tsx          inline SVG line/area chart (server, no recharts)
    ├── MarkCompleteButton.tsx    two-step confirm "Cut done" (client)
    ├── BlockDayToggle.tsx        optimistic flip with rollback (client)
    └── ClientSearch.tsx          debounced URL-driven search (client)

apps/web/app/api/operator/
├── _utils/require-operator-from-headers.ts   auth gate for routes (returns 401/403)
├── bookings/[id]/complete/route.ts           POST — mark booking completed
└── availability/block/route.ts               POST — block or unblock a date
```

## Stop card actions

Each `StopCard` exposes four actions:

| Button | What |
|---|---|
| **15-min WhatsApp** | Opens `wa.me/<E164>` with a pre-filled "on my way" message — one tap from the operator's phone to give the customer notice |
| **Call** | `tel:` link — opens the dialler |
| **Cut done** | Two-step inline confirm → `POST /api/operator/bookings/[id]/complete` → marks `bookingStatus="completed"`, decrements subscription `cutsRemaining` if applicable |

The "15-min WhatsApp" link is the brief's §10.4 promise made operational. It's not configurable — the same template fires every time, by design.

## Travel hints

Per stop, the data adapter populates `travelHint` (e.g. "9 min · Naka") describing the move to the NEXT stop. Today these are hardcoded in the mock; the Prisma swap will compute them via Google Maps Distance Matrix (the `GOOGLE_MAPS_API_KEY` env var is already in the secret template), with results cached per (origin, destination) pair to stay under the free-tier quota.

The brief mentioned an embedded map. We deliberately deferred that — the operator's phone has Google Maps; this view's job is the schedule, not the map.

## Revenue chart

`RevenueChart.tsx` renders an inline SVG line + filled area in brass over a 1px dashed grid. ~100 lines, zero JS at runtime (it's a server component), no `recharts` dependency.

Axis ticks pick a clean step (2k / 5k / 10k / 20k) based on the max value. Five X-axis labels evenly spaced across the series. The very last data point gets a 3.5px filled brass dot.

To add another chart (e.g. revenue by service for `/operator/payments`), copy this file and swap the `series` shape. Resist `recharts` until the chart count genuinely justifies a third-party dep.

## Search semantics

`ClientSearch` is debounced (300ms) and pushes the query into the URL as `?q=...`:

- The URL is shareable + refresh-safe
- The server component reads `searchParams.q` and re-filters
- No client-side fetching, no loading states — the page renders the result directly

Search matches against name, email, phone, and estate (case-insensitive substring).

## Availability semantics

`BlockDayToggle` flips optimistically — the UI updates instantly, then we POST to `/api/operator/availability/block`, and roll back on failure. Each tile shows the scheduled-bookings-count in the title tooltip so the operator can see "blocking Saturday will affect 4 customers" before clicking.

Blocking does NOT cancel existing bookings on the day — silent mass-cancellation is never a feature here. The operator has to ring the customer first, then cancel from `/operator/calendar` manually.

Per-city blocking (`Nakuru` vs `Nairobi`) is supported by the API (`POST` body's `city` field) but not yet exposed in the UI. Add a small segmented control inside `BlockDayToggle` when needed.

## Local trigger

```bash
# 1. Make yourself an operator (in .env.local)
echo "TRIMLY_OPERATOR_EMAILS=you@example.com" >> apps/web/.env.local

# 2. Restart the dev server
yarn workspace @calcom/web dev

# 3. Sign in as that account and visit:
http://localhost:3000/operator/today
http://localhost:3000/operator/calendar
http://localhost:3000/operator/clients?q=mwangi   # search-friendly URL
http://localhost:3000/operator/payments
http://localhost:3000/operator/availability
```

A signed-in customer who isn't in `TRIMLY_OPERATOR_EMAILS` gets bounced from `/operator/*` to `/account` — they never see a 403, just their own dashboard.

## What's NOT included yet

- Real Prisma reads + writes — every fetch / POST has a `TODO(trimly-port)` block ready to uncomment after `yarn prisma migrate dev --name trimly_initial`
- Embedded map on `/operator/today` — the brief mentioned one; deferred. Today's view relies on the operator's phone for routing.
- Per-stop reschedule from the calendar — the calendar is read-only for now
- Per-day-of-week recurring blocks (e.g. "every Sunday") — today's UI is one-tile-at-a-time
- A `/operator/clients/[id]` detail page showing every booking by one customer — the list is shipped, the detail page is next
- Refund queue UI on `/operator/payments` — currently we surface refund-eligible payments only via the `pending` KPI count; the dedicated refund-management UI is deferred until the Paystack refund API integration lands
- Operator notifications (new booking, M-Pesa renewal failed, etc.) — needs the Resend wire-up

All gaps marked `TODO(trimly-port)` and `rg`-findable.
