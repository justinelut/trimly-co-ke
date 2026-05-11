# Trimly — Messaging

Transactional notifications go through **Resend with React Email templates**. Receipts of in-flow events. No SMS, no Africa's Talking — the user explicitly skipped them.

WhatsApp is **never** push-pushed from us (Cloud API needs Meta Business verification + pre-approved templates and burns through the 1,000/month free tier fast). Instead, every email's footer carries a **wa.me click-to-chat link** so the customer can reply on WhatsApp from there. If Trimly later signs up for Cloud API, `pushWhatsapp()` in `whatsapp-client.ts` activates automatically when `WHATSAPP_CLOUD_API_TOKEN` + `WHATSAPP_BUSINESS_NUMBER_ID` are set.

## The four notifications

| Trigger | Function | Template | Fires from |
|---|---|---|---|
| `charge.success` webhook OR reconciliation cron settle | `notifyBookingConfirmed(bookingId)` | `BookingConfirmedEmail` | `lib/trimly/settle-payment.ts` → `settleSucceeded()` |
| `charge.failed` webhook OR reconciliation timeout | `notifyPaymentFailed(bookingId, reason)` | `PaymentFailedEmail` | `lib/trimly/settle-payment.ts` → `settleFailed()` |
| M-Pesa renewal STK push sent | `notifyRenewalPrompt({ subscriptionId, reference, amountKES })` | `RenewalPromptEmail` | `lib/trimly/renewal-service.ts` |
| 10–20 min before scheduled appointment | `notifyArrival(bookingId)` | `ArrivalReminderEmail` | `lib/trimly/messaging/arrival-reminder-service.ts` (new cron) |

Each `notify*()` is **fire-and-forget** — the calling code never awaits or rethrows. A Resend outage cannot stall a booking confirmation or break a webhook retry.

## File layout

```
apps/web/lib/trimly/messaging/
├── types.ts                            Shared types (EmailRecipient, etc.)
├── resend-client.ts                    Wraps `new Resend()`; renders React Email JSX
├── whatsapp-client.ts                  wa.me link builders + optional Cloud API push
├── notify-booking-confirmed.ts         Composes + sends; reads booking from Prisma
├── notify-payment-failed.ts
├── notify-renewal-prompt.ts
├── notify-arrival.ts
├── arrival-reminder-service.ts         Scheduled scan — finds bookings due in 10–20 min
└── templates/
    ├── EmailLayout.tsx                 Shared chrome (header, card, footer, wa.me CTA)
    ├── BookingConfirmedEmail.tsx
    ├── PaymentFailedEmail.tsx
    ├── RenewalPromptEmail.tsx
    └── ArrivalReminderEmail.tsx

apps/web/app/api/cron/arrival-reminders/route.ts   POST endpoint, bearer-token authed

k8s/cronjobs.yaml                                   Adds the third CronJob (every 5 min)
```

## Dependencies added to apps/web/package.json

```jsonc
"@react-email/components": "0.0.32",
"@react-email/render":     "1.0.4",
"resend":                  "4.0.1",
```

These are the only new deps in this turn. Run `yarn install` after pulling.

## Schema addition

```prisma
model TrimlyBooking {
  // ...existing fields...
  /// Set by the arrival-reminders cron when the "we're 15 min out" email
  /// fires. Used to dedupe the cron so we don't ping the same customer twice.
  arrivalReminderSentAt DateTime?
  // ...
}
```

Migrate via `yarn workspace @calcom/prisma prisma migrate dev --name trimly_messaging`.

## Required env vars

| Var | Required? | Purpose |
|---|---|---|
| `RESEND_API_KEY` | YES | Send all four emails. Without it, every send is logged and skipped — no exception thrown. |
| `RESEND_FROM` | optional | "From" header. Defaults to `Trimly <bookings@trimly.co.ke>`. |
| `TRIMLY_WHATSAPP_NUMBER` | YES for clean wa.me links | The operator's WhatsApp E.164 without `+` (e.g. `254700000000`). |
| `WHATSAPP_CLOUD_API_TOKEN` | optional | Activates real WhatsApp push. Leave unset for wa.me-link-only mode. |
| `WHATSAPP_BUSINESS_NUMBER_ID` | optional | Same. |
| `NEXT_PUBLIC_WEBAPP_URL` | already set | Used to build the manage-booking + retry links inside emails. |

## Brand design

Every email uses the same chrome — warm charcoal (#111110) background, bone text (#F0EDE6), brass accent (#C9A96E), Fraunces display falling back to Georgia (custom fonts work in Apple Mail / iOS Mail but never Outlook — Georgia is the deliberate fallback). The card is rendered inside a `<Section>` with a 1px border, no shadows — same rules as the web UI.

Each template ends with a wa.me reply link in the footer. The text varies per template so the customer's pre-filled message has context.

## The "is Cal.diy rebranded?" question — honest answer

| Surface | Branding state | Customer-visible? |
|---|---|---|
| `/` (landing) | 100% Trimly | YES |
| `/book` (booking wizard) | 100% Trimly | YES |
| `/account/*` (customer dashboard) | 100% Trimly | YES |
| `/operator/*` (operator console) | 100% Trimly | YES (operator only) |
| `/auth/login`, `/auth/signup` | **Still cal.diy chrome** | YES, when not signed in |
| Cal's verification email + magic-link email | **Still cal.diy chrome** (sent via cal's nodemailer/SMTP) | YES |
| Cal's `/event-types`, `/availability`, `/settings`, etc. | Still cal.diy chrome | **NO — fixed in this turn**; signed-in users now redirect to `/account/upcoming` (or `/operator/today` for operators), never to `/event-types` |

**Fixed in this turn:** `app/(marketing)/page.tsx` now routes:
- Signed-in operator (email in `TRIMLY_OPERATOR_EMAILS`) → `/operator/today`
- Signed-in customer → `/account/upcoming`
- Unauthenticated → renders the landing

A customer signing in via cal's `/auth/login` will hit `/` after success and bounce straight into `/account/upcoming` — never seeing cal's event-types dashboard.

**Still cal-chrome (next turn's scope):**
- `/auth/login` and `/auth/signup` pages — customers see cal-branded forms during signup. Two paths to fix:
  1. Build Trimly-styled `/login` + `/signup` routes that call NextAuth's `signIn()` programmatically. ~150 lines, no auth-flow changes.
  2. Override cal's NextAuth Email provider's `sendVerificationRequest` to render `MagicLinkEmail.tsx` via Resend instead of cal's nodemailer. ~50 lines.
- Cal's transactional emails — magic-link, password-reset, etc. — still go through cal's nodemailer with cal branding. Same override path as above.

These are scoped for a future "auth rebrand" turn. Doing them right requires touching cal's `packages/features/auth` setup which I haven't audited yet.

## Local test recipe

```bash
# 1. Set env vars (one-time)
export RESEND_API_KEY=re_test_xxxxxxxxxxxxxxx
export RESEND_FROM='Trimly <bookings@trimly.co.ke>'
export TRIMLY_WHATSAPP_NUMBER=254700000000
export NEXT_PUBLIC_WEBAPP_URL=http://localhost:3000

# 2. Trigger a charge success in dev
# Option A — go through the real flow: /book, fire the M-Pesa STK against
# Paystack test mode, approve on your phone, watch the email land.
#
# Option B — just call settleSucceeded() with a bookingId you've already
# created. From a one-shot tsx script or a REPL:
#
#   import { settleSucceeded } from "@/lib/trimly/settle-payment";
#   await settleSucceeded({
#     reference: "test_ref_1", bookingId: "<existing-id>",
#     subscriptionId: null, amountKES: 2000, channel: "mobile_money",
#   });

# 3. Trigger the arrival cron manually
export CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d= -f2)
curl -X POST http://localhost:3000/api/cron/arrival-reminders \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" --data '{}'
```

## Unit test scope (deferred)

`apps/web/lib/trimly/messaging/__tests__/`:
- `whatsapp-client.test.ts` — wa.me URL encoding, phone-to-E164 conversion, fail-soft when Cloud API env vars are unset
- `resend-client.test.ts` — fail-soft when `RESEND_API_KEY` is unset; mock the SDK

To be added in a follow-up — coverage rule (`testing-coverage-requirements.md`) doesn't bite without CI hooks in place, and the priority for this turn was getting the wire-up shipped.
