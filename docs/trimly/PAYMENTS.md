# Trimly — Payments architecture

> One sentence: **everything routes through Paystack `/charge`. Daraja is not used. Paystack-hosted checkout chrome is never shown.**

## Decisions

1. **Single provider — Paystack Kenya.** Handles both M-Pesa and cards from one set of credentials.
2. **No Daraja, no direct M-Pesa API.** Even the M-Pesa STK push is initiated via Paystack `/charge` with `mobile_money` payload.
3. **No Paystack-hosted UI.** No redirect to Paystack's checkout page, no Inline.js modal. Our own forms, our own waiting screens, our own 3DS modal.
4. **Card details never touch our servers.** Encrypted client-side via Paystack's `@paystack/inline-js` `encrypt()` helper using `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`. We only ever see opaque ciphertext, keeping Trimly out of PCI-DSS scope.

## Component map

| Layer | File | Job |
|---|---|---|
| Server lib | `apps/web/lib/trimly/paystack.ts` | Wrapper around Paystack REST API — `chargeMobileMoney()`, `chargeCard()`, `submitOtp()`, `verify()`. **Only file that knows about `https://api.paystack.co`.** |
| Server lib | `apps/web/lib/trimly/phone.ts` | Normalises 0712.../+254712.../254712... → `0712345678` form (Paystack's M-Pesa expectation) |
| Server lib | `apps/web/lib/trimly/pricing.ts` | Server-authoritative price resolver — client never computes price |
| Server lib | `apps/web/lib/trimly/types.ts` | Shared types: `City`, `ServiceSlug`, `PriceQuote`, `ChargeResponse`, `PaymentStatus`, `BookingDraft`, `NEIGHBORHOODS` |
| Route | `apps/web/app/api/bookings/quote/route.ts` | `POST` — Zod-validated `{ serviceSlug, city }` → `PriceQuote` |
| Route | `apps/web/app/api/bookings/create/route.ts` | `POST` — creates `TrimlyBooking` in `pending` status (currently stubbed pending migration) |
| Route | `apps/web/app/api/payments/charge/route.ts` | `POST` — discriminated union body (`mobile_money` \| `card`), calls Paystack via the wrapper |
| Route | `apps/web/app/api/payments/status/route.ts` | `GET` — polled every 3 s by the front-end; calls `verify(reference)` |
| Page | `apps/web/app/(marketing)/book/page.tsx` | Server component, renders the wizard |
| Client | `apps/web/app/(marketing)/book/_components/BookingWizard.tsx` | State machine for 5-step flow; URL-mirrored step pointer |
| Client | `_components/PaymentMpesa.tsx` | Custom M-Pesa UI: phone input → STK send → animated waiting screen with 3 s polling for up to 200 s |
| Client | `_components/PaymentCard.tsx` | Custom card form, in-page client-side encryption, custom OTP collector, custom 3DS modal IFRAME |
| Client | `_components/StepPayment.tsx` | Tab switch between the two payment UIs |
| Page | `_components/../confirmation/page.tsx` | Success screen with bookingId + Paystack reference |

## Flows

### M-Pesa STK push

```
1. Customer reviews summary on Step 5, taps "Pay KES 2,000 with M-Pesa"
   ↓
2. Browser POST → /api/payments/charge { channel: "mobile_money", phone, email, bookingId, serviceSlug, city }
   ↓
3. Route normalises phone, asserts amount ≤ KES 150,000, calls paystack.chargeMobileMoney()
   which hits https://api.paystack.co/charge with mobile_money payload
   ↓
4. Paystack issues STK push to the handset, returns { reference, status: "pay_offline", display_text }
   ↓
5. Browser renders our animated WaitingScreen with phone-icon-pulse animation
   ↓
6. Every 3 s, GET /api/payments/status?reference=...
   → route calls paystack.verify(reference)
   → returns status in our PaymentStatus DTO
   ↓
7a. status === "success" → wizard navigates to /book/confirmation?bookingId=...&reference=...&method=mpesa
7b. status === "failed" → "Try again" CTA, reset state
7c. timeout (>200 s) → expired message
```

### Card with 3-D Secure

```
1. Customer types card details into our form (cardnumber/expiry/cvv only — never sent yet)
   ↓
2. On submit, browser uses window.PaystackPop().encrypt(PUBLIC_KEY, { number, cvv, expiry_month, expiry_year })
   → opaque ciphertext blob, raw card details NEVER leave the browser
   ↓
3. Browser POST → /api/payments/charge { channel: "card", encryptedCard, email, bookingId, serviceSlug, city }
   ↓
4. Route calls paystack.chargeCard() → POST https://api.paystack.co/charge with `card: <ciphertext>`
   ↓
5. Paystack response carries one of:
   - status === "success"   → settled in one shot, rare for KE cards
   - status === "send_otp"  → bank wants an OTP; we render OUR OWN 6-digit input row
   - status === "open_url"  → full 3-D Secure challenge → we render the redirectUrl
                              INSIDE our own t-3ds-modal IFRAME (sandboxed)
   - status === "failed"    → error UI with retry
   ↓
6. While inside 3DS, we both:
   - Listen for window.postMessage from the iframe (some 3DS pages support it)
   - Poll /api/payments/status every 3 s (defense in depth)
   ↓
7. On verified success, close the modal and navigate to confirmation. The IFRAME is
   sandboxed with allow-forms allow-scripts allow-same-origin allow-top-navigation-by-user-activation
   so it works for the 3DS challenge but can't navigate the outer Trimly page away.
```

## Required env vars (already declared in k8s/configmap.yaml + k8s/secret.yaml)

| Var | Used by | Notes |
|---|---|---|
| `PAYSTACK_SECRET_KEY` | Server (Paystack wrapper) | `sk_live_...` — never exposed to the browser |
| `PAYSTACK_WEBHOOK_SECRET` | Server (webhook handler, TODO) | HMAC verification |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Browser (card encryption) | `pk_live_...` — safe to expose; required for the encrypt() helper |
| `CRON_SECRET` | Server + K8s CronJobs | Bearer token for `/api/cron/*` (not used by booking flow but shared with renewal/reconciliation) |

## What this implementation does NOT include yet

- Real `prisma.trimlyBooking.create()` in `/api/bookings/create` — currently returns a synthetic ID. Activates after `yarn prisma migrate dev --name trimly_initial` is run.
- Real `prisma.trimlyWebhookEvent.create()` for idempotency — the route's `recordWebhookEvent()` helper is stubbed with the exact swap-in commented inline. Activates after the same migration.
- Persistence of `TrimlyPayment` row when each event lands — handlers in `webhook-handlers.ts` have the full Prisma block commented and ready to uncomment.
- `/api/cron/mpesa-renewal` and `/api/cron/payment-reconciliation` — the K8s CronJobs in `k8s/cronjobs.yaml` already POST to these endpoints with the `CRON_SECRET` bearer token; the route handlers themselves are next phase.

All gaps are marked with `TODO(trimly-port)` comments in the source files so they're discoverable by `rg "TODO\(trimly-port\)"`.

## "Never show Paystack chrome" — verification checklist

- [x] No `<script src="https://js.paystack.co/v1/inline.js">` used in `setup()` mode (we only load v2 for the encrypt helper)
- [x] No `window.PaystackPop().setup()` call anywhere (would open Paystack's modal)
- [x] No `redirect()` to Paystack's authorisation URL anywhere (3DS lives in OUR iframe)
- [x] No iframe whose src is `paystack.com/checkout` (only the per-transaction 3DS challenge URL Paystack returns dynamically)
- [x] All buttons, inputs, labels, error messages styled by `trimly.css` — zero Paystack CSS shipped

---

## Webhook handler

`POST /api/webhooks/paystack` is the **authoritative confirmation source** for Trimly payments. Status polling (`/api/payments/status`) is for UX only — the webhook is what mutates booking state.

### Security model

| Step | What |
|---|---|
| 1 | Read raw body via `req.text()` — **never JSON.parse first**. Paystack signs the exact byte stream. |
| 2 | Read `x-paystack-signature` header. |
| 3 | Compute HMAC-SHA512(rawBody, `PAYSTACK_SECRET_KEY`). |
| 4 | Constant-time compare via `crypto.timingSafeEqual`. Reject (401) on miss. |
| 5 | Parse the body with Zod (envelope schema), reject (400) on shape mismatch. |
| 6 | Look up `TrimlyWebhookEvent(provider="paystack", eventId=data.id)`. If exists, return 200 OK without re-processing. |
| 7 | Insert the event row (the unique index gives us atomic dedupe). |
| 8 | Dispatch to the per-event handler from `EVENT_HANDLERS`. |
| 9 | **Always return 200** after step 4 — non-2xx makes Paystack retry, which spams customers. |

Defense in depth: the `charge.success` handler RE-CALLS Paystack's `/transaction/verify` before mutating booking state. Even if a forged webhook bypassed HMAC, it would fail this second check.

### Events we handle

| Event | What we do |
|---|---|
| `charge.success` | Verify via `/transaction/verify` → mark `TrimlyBooking.paymentStatus="succeeded"`, insert `TrimlyPayment`, enqueue email + WhatsApp |
| `charge.failed` | Mark booking failed, insert TrimlyPayment with status=failed |
| `subscription.create` | Persist `paystackSubscriptionCode` + `paystackCustomerCode` on `TrimlySubscription` |
| `subscription.disable` (+ `subscription.not_renew`) | Mark subscription `cancelled` |
| `invoice.create` / `invoice.update` | Log only (used for upcoming-renewal UI) |
| `invoice.payment_failed` | Mark subscription `past_due`, send email — Paystack does NOT auto-retry |
| Any other event | Acknowledge 200 OK without action — Trimly doesn't care about transfer.*, customeridentification.*, etc. |

### Adding a new event type

One entry in `EVENT_HANDLERS` (in `apps/web/lib/trimly/webhook-handlers.ts`) and one focused handler function. No `if/else if` chains in the route — the route is a thin controller (per Cal's `api-thin-controllers.md`).

### Local testing

```bash
# 1. Generate an HMAC signature for a sample event
BODY='{"event":"charge.success","data":{"id":12345,"reference":"ref_test","status":"success","amount":200000,"metadata":{"bookingId":"bk_local"}}}'
SIG=$(node -e "console.log(require('crypto').createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update('$BODY').digest('hex'))")

# 2. Post to the local route
curl -X POST http://localhost:3000/api/webhooks/paystack \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: $SIG" \
  -d "$BODY"

# Expected: {"ok":true,"action":"booking_confirmed"}
```

### Configuring Paystack

In the Paystack dashboard → Settings → API Keys & Webhooks:
- Webhook URL: `https://trimly.co.ke/api/webhooks/paystack`
- Health check: a `GET` to the same URL returns `{ ok: true, service: "trimly-paystack-webhook" }` — useful in the "Test webhook URL" button.

### Unit tests

`apps/web/app/api/webhooks/paystack/route.test.ts` covers the HMAC verification surface with 9 test cases — accepted signature, missing header, tampered body, single-char flip, wrong length, non-hex input, wrong secret, missing secret, and length-mismatch behaviour. Run with:

```bash
TZ=UTC yarn vitest run apps/web/app/api/webhooks/paystack/
```
