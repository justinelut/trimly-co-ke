/**
 * POST /api/cron/mpesa-renewal
 *
 * Triggered daily at 08:00 EAT by the K8s CronJob `trimly-co-ke-mpesa-renewal`
 * (see k8s/cronjobs.yaml). Authenticated via the shared CRON_SECRET bearer.
 *
 * This is a thin controller — all the work is in
 * apps/web/lib/trimly/renewal-service.ts. The route's job is auth +
 * timing + logging the summary.
 */
import { NextResponse } from "next/server";

import { verifyCronBearer } from "@lib/trimly/cron-auth";
import { runMpesaRenewalCron } from "@lib/trimly/renewal-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Longest acceptable wall time for one run. M-Pesa renewals fan out per
// subscription; if the day has 500 active mpesa subs we still want to
// finish well inside the K8s startingDeadlineSeconds (600).
export const maxDuration = 300;

export async function POST(req: Request) {
  if (!verifyCronBearer(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  try {
    const summary = await runMpesaRenewalCron();
    const durationMs = Date.now() - startedAt;

    // eslint-disable-next-line no-console
    console.info("[cron/mpesa-renewal] complete", { durationMs, ...summary });

    return NextResponse.json(
      {
        ok: true,
        ran: "mpesa-renewal",
        durationMs,
        summary,
      },
      { status: 200 }
    );
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    // eslint-disable-next-line no-console
    console.error("[cron/mpesa-renewal] threw", err);
    return NextResponse.json(
      {
        ok: false,
        ran: "mpesa-renewal",
        durationMs,
        error: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}

/** Health probe for the CronJob pod so K8s can liveness-check the route. */
export async function GET() {
  return NextResponse.json({ ok: true, route: "mpesa-renewal" }, { status: 200 });
}
