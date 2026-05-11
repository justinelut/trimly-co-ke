/**
 * POST /api/cron/arrival-reminders
 *
 * Triggered every 5 minutes by the K8s CronJob trimly-co-ke-arrival-reminders.
 * Bearer-token authenticated via CRON_SECRET (same auth helper as the other
 * crons). Sends "we're 15 min out" emails for bookings starting in 10–20 min.
 */
import { NextResponse } from "next/server";

import { verifyCronBearer } from "@lib/trimly/cron-auth";
import { runArrivalReminderCron } from "@lib/trimly/messaging/arrival-reminder-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!verifyCronBearer(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  try {
    const summary = await runArrivalReminderCron();
    const durationMs = Date.now() - startedAt;
    if (summary.sent > 0 || summary.errors.length > 0) {
      // eslint-disable-next-line no-console
      console.warn("[cron/arrival-reminders] activity", { durationMs, ...summary });
    } else {
      // eslint-disable-next-line no-console
      console.info("[cron/arrival-reminders] nothing to send", { durationMs, checked: summary.checked });
    }
    return NextResponse.json(
      { ok: true, ran: "arrival-reminders", durationMs, summary },
      { status: 200 }
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[cron/arrival-reminders] threw", err);
    return NextResponse.json(
      { ok: false, ran: "arrival-reminders", error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "arrival-reminders" }, { status: 200 });
}
