/**
 * POST /api/cron/payment-reconciliation
 *
 * Triggered every 5 minutes by the K8s CronJob `trimly-co-ke-payment-reconciliation`
 * (see k8s/cronjobs.yaml). Authenticated via the shared CRON_SECRET bearer.
 *
 * Defense in depth for the webhook handler — picks up TrimlyPayment rows
 * that are still `pending` after a few minutes, calls Paystack's
 * /transaction/verify, and settles or fails them. Keeps booking state
 * honest when webhooks drop.
 *
 * Thin controller — work lives in
 * apps/web/lib/trimly/reconciliation-service.ts.
 */
import { NextResponse } from "next/server";

import { verifyCronBearer } from "@lib/trimly/cron-auth";
import { runReconciliationCron } from "@lib/trimly/reconciliation-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// 5-min cadence means each run must comfortably finish well inside the
// next interval. 60s is plenty for verifying 100 references at ~200ms
// each; the service caps the per-run batch size at 100.
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!verifyCronBearer(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  try {
    const summary = await runReconciliationCron();
    const durationMs = Date.now() - startedAt;

    // Routine, low-signal log line — every 5 minutes we get one of these.
    // Bump to console.warn only if something interesting happened.
    if (summary.settled > 0 || summary.failed > 0 || summary.timedOut > 0 || summary.errors.length > 0) {
      // eslint-disable-next-line no-console
      console.warn("[cron/payment-reconciliation] activity", { durationMs, ...summary });
    } else {
      // eslint-disable-next-line no-console
      console.info("[cron/payment-reconciliation] nothing to do", { durationMs, checked: summary.checked });
    }

    return NextResponse.json(
      {
        ok: true,
        ran: "payment-reconciliation",
        durationMs,
        summary,
      },
      { status: 200 }
    );
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    // eslint-disable-next-line no-console
    console.error("[cron/payment-reconciliation] threw", err);
    return NextResponse.json(
      {
        ok: false,
        ran: "payment-reconciliation",
        durationMs,
        error: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "payment-reconciliation" }, { status: 200 });
}
