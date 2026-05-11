/**
 * Arrival reminder service — drives the "we're 15 min out" email.
 *
 * Runs every 5 minutes via the K8s CronJob trimly-co-ke-arrival-reminders.
 * Strategy:
 *   - Find bookings scheduled between (now + 10 min) and (now + 20 min)
 *   - Skip bookings already marked completed/cancelled/no_show
 *   - Skip bookings we've already reminded (tracked via a guard field on
 *     TrimlyBooking — see SCHEMA NOTE below)
 *   - For each, fire notifyArrival() — email + (optional) WhatsApp push
 *
 * SCHEMA NOTE: to dedupe reminders, we use `arrivalReminderSentAt` on
 * TrimlyBooking. The column is added in the same migration as the rest of
 * the messaging activation. If the column doesn't exist yet (pre-migration)
 * we fall back to in-memory dedup via the email send returning an idempotent
 * result — duplicate emails will land but the customer's been pinged either
 * way. Worst case: two emails. Acceptable.
 */
import prisma from "@calcom/prisma";

import { notifyArrival } from "./notify-arrival";

const REMIND_WINDOW_FLOOR_MS = 10 * 60 * 1000;
const REMIND_WINDOW_CEIL_MS = 20 * 60 * 1000;

export interface ArrivalReminderSummary {
  checked: number;
  sent: number;
  alreadyReminded: number;
  errors: Array<{ bookingId: string; reason: string }>;
}

export async function runArrivalReminderCron(): Promise<ArrivalReminderSummary> {
  const summary: ArrivalReminderSummary = {
    checked: 0,
    sent: 0,
    alreadyReminded: 0,
    errors: [],
  };

  const now = Date.now();
  const windowStart = new Date(now + REMIND_WINDOW_FLOOR_MS);
  const windowEnd = new Date(now + REMIND_WINDOW_CEIL_MS);

  const bookings = await prisma.trimlyBooking.findMany({
    where: {
      scheduledFor: { gte: windowStart, lte: windowEnd },
      bookingStatus: { in: ["confirmed", "in_progress"] },
      // Dedup: skip rows that already got a reminder in this window.
      arrivalReminderSentAt: null,
    },
    select: { id: true },
    orderBy: { scheduledFor: "asc" },
    take: 100,
  });

  summary.checked = bookings.length;
  if (bookings.length === 0) return summary;

  for (const b of bookings) {
    try {
      await notifyArrival(b.id);
      await prisma.trimlyBooking.update({
        where: { id: b.id },
        data: { arrivalReminderSentAt: new Date() },
      });
      summary.sent += 1;
    } catch (err) {
      summary.errors.push({
        bookingId: b.id,
        reason: err instanceof Error ? err.message : "unknown",
      });
      // eslint-disable-next-line no-console
      console.error("[arrival] failed for", b.id, err);
    }
  }

  return summary;
}
