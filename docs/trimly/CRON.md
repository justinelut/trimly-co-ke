# Trimly — Cron architecture

Two scheduled jobs keep Trimly's payment state consistent. Both run inside the K8s cluster as `CronJob` resources defined in `k8s/cronjobs.yaml`, both POST to internal endpoints on the Trimly Next.js app, and both authenticate with the shared `CRON_SECRET` bearer token.

## The two jobs

| K8s CronJob | Schedule (Africa/Nairobi) | Endpoint | Purpose |
|---|---|---|---|
| `trimly-co-ke-mpesa-renewal` | `0 8 * * *` — daily at 08:00 EAT | `POST /api/cron/mpesa-renewal` | Issues fresh M-Pesa STK pushes for subscriptions renewing in the next 24h; sweeps yesterday's failed renewals to `past_due` |
| `trimly-co-ke-payment-reconciliation` | `*/5 * * * *` — every 5 min | `POST /api/cron/payment-reconciliation` | Settles `pending` payments via Paystack `/transaction/verify`. Defense in depth for missed webhooks. |

## Why we need both

| Failure mode | Caught by |
|---|---|
| Paystack webhook delivered, our pod processed it | webhook handler → done |
| Webhook delivered, our pod was rolling/restarting | Paystack retries (1m / 5m / 30m / 1h / 6h) — eventually caught by webhook |
| Webhook delivered all retries failed (rare, ~few per million) | **reconciliation cron** |
| Customer closed the tab; webhook delivery permanently dropped | **reconciliation cron** |
| Customer M-Pesa STK approved off-screen, customer never refreshed | **reconciliation cron** |
| M-Pesa subscription renewal day | **renewal cron** (issues STK) → webhook (settles on approval) → reconciliation (catches webhook drops) |

## File layout

```
apps/web/lib/trimly/
├── cron-auth.ts                  Shared bearer verifier (timing-safe, fail-closed)
├── renewal-service.ts            M-Pesa renewal logic (two-phase: past-due sweep + fresh STK)
├── reconciliation-service.ts     Payment reconciliation logic (verify-and-settle)
└── cron-auth.test.ts             Unit tests for the bearer verifier

apps/web/app/api/cron/
├── mpesa-renewal/route.ts        Thin POST controller — calls runMpesaRenewalCron()
└── payment-reconciliation/route.ts   Thin POST controller — calls runReconciliationCron()
```

## Security

- **Bearer auth only.** No mTLS, no per-request signature — the endpoints live behind a ClusterIP service with no Ingress, so the threat model is "rogue pod inside the cluster." Bearer is sufficient.
- **Timing-safe comparison.** `crypto.timingSafeEqual` with length pre-check — same stance as the Paystack webhook verifier.
- **Fail-closed.** If `CRON_SECRET` is unset or empty, every request returns 401. No silent acceptance of unauthenticated triggers.
- **Same secret on both sides.** Lives in `trimly-co-ke-secret` and is mounted into both the Next.js Deployment pod and the CronJob pods.

## Runtime behaviour

### `runMpesaRenewalCron()`

```
Phase 1 — past-due sweep
  Find TrimlySubscription where
    paymentMethod = "mpesa"
    AND status    = "active"
    AND currentPeriodEnd < now()
    AND NO succeeded TrimlyPayment within the last 24 hours
  UPDATE status = "past_due" on the matches.

Phase 2 — fresh STK push
  Find TrimlySubscription where
    paymentMethod = "mpesa"
    AND status    = "active"
    AND currentPeriodEnd between now() and now() + 24h
  For each:
    paystack.chargeMobileMoney({ email, phone, amountKobo, bookingId: `sub:${id}` })
    Insert TrimlyPayment { subscriptionId, providerReference, status: "pending" }
    Enqueue email + WhatsApp ("Approve the M-Pesa STK on your phone.")
  Errors per subscription are caught + logged; the rest of the run continues.
```

`bookingId` for sub renewals is prefixed `sub:` so the webhook handler can disambiguate "this charge.success is a subscription renewal, not a one-off booking."

### `runReconciliationCron()`

```
Find TrimlyPayment where
  status     = "pending"
  AND createdAt < now() - 3 min      (RECONCILE_AFTER_MS — give webhooks time)
ORDER BY createdAt ASC
LIMIT 100                            (bounded — large backlogs spread across runs)

For each:
  v = paystack.verify(payment.providerReference)

  v.status === "success"  → mark TrimlyPayment.succeeded
                           → if bookingId, mark TrimlyBooking.{paymentStatus,bookingStatus}
                           → enqueue confirmation email
  v.status === "failed"   → mark TrimlyPayment.failed, mark TrimlyBooking.cancelled
  v.status === "pending":
    age > 10 min for mobile_money → mark failed (timeout)
    age > 30 min for card         → mark failed (timeout)
    otherwise                      → leave for the next run
```

Idempotent: re-running over the same row is a no-op once status has been updated.

## Local testing

The CronJobs hit internal URLs (`trimly-co-ke-service.trimly-co-ke.svc.cluster.local`) — those won't resolve outside the cluster. To test locally:

```bash
# 1. Make sure CRON_SECRET is set in your .env (same secret as the K8s side):
export CRON_SECRET=$(openssl rand -hex 32)

# 2. Hit the endpoint with curl:
curl -X POST http://localhost:3000/api/cron/mpesa-renewal \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  --data '{"source":"local-test"}'

# Expected response (with the Prisma stubs still in place):
# {"ok":true,"ran":"mpesa-renewal","durationMs":N,"summary":{"pastDueSweep":{"checked":0,"marked":0},"renewalAttempts":{"found":0,"stkSent":0,"failed":0},"errors":[]}}
```

Auth failure check:

```bash
curl -X POST http://localhost:3000/api/cron/mpesa-renewal -H "Authorization: Bearer wrong"
# → 401 {"error":"unauthorized"}
```

## Triggering ad-hoc against a real cluster

If the operator needs to force a sweep without waiting for the schedule:

```bash
# Spawn a one-off Job from the CronJob template
kubectl create job --from=cronjob/trimly-co-ke-payment-reconciliation \
  manual-recon-$(date +%s) -n trimly-co-ke

# Tail the resulting pod
kubectl logs -f -n trimly-co-ke job/manual-recon-<timestamp>
```

## Unit tests

`apps/web/lib/trimly/cron-auth.test.ts` covers the verifier with 9 cases:
- Accepts the exact secret
- Rejects missing header
- Rejects wrong scheme (`Basic`, lowercase `bearer`)
- Rejects same-length wrong secret
- Rejects different-length wrong secret without throwing
- Whitespace handling (token is trimmed)
- Fail-closed on missing CRON_SECRET env
- Fail-closed on empty-string CRON_SECRET env
- Never throws on partial inputs

```bash
TZ=UTC yarn vitest run apps/web/lib/trimly/cron-auth.test.ts
```

## Future hardening

| Concern | Direction |
|---|---|
| Cron lock to prevent overlapping runs | K8s `concurrencyPolicy: Forbid` (already set in cronjobs.yaml) |
| Per-run timeout | Routes set `maxDuration` (300s for renewal, 60s for reconciliation) |
| Notification fan-out | Currently logged with `console.info` — replace stubs with Resend + Africa's Talking calls once the messaging package lands |
| Cron metrics | Emit Prometheus counters (`trimly_renewals_total`, `trimly_reconciliation_settled_total`) via cal's instrumentation if/when we add Prometheus scraping to the K3s cluster |
| Alerting on consecutive failures | K8s `failedJobsHistoryLimit: 5` keeps the last five failed job logs; an Alertmanager rule on those would pre-empt silent outages |

## What this implementation does NOT include yet

- Real Prisma queries — every DB block is commented inline (`TODO(trimly-port)`), ready to uncomment after `yarn prisma migrate dev --name trimly_initial`.
- Email + WhatsApp side-effects — handlers log instead of calling Resend / Africa's Talking. The dispatch points are clearly marked with `TODO(trimly-port)` so they're easy to find with `rg "TODO\(trimly-port\)" apps/web/lib/trimly/`.
- Extraction of the "settle a charge" effect into a shared helper used by BOTH the webhook handler AND the reconciliation service. For now both inline the same TODO blocks; once activated, hoist into `apps/web/lib/trimly/settle-payment.ts`.
