/**
 * "We're 15 minutes out" — sent by the arrival-reminders cron.
 * Looks up the booking fresh to make sure we send to the right address
 * (the customer may have updated it after booking).
 */
import prisma from "@calcom/prisma";

import { sendTransactionalEmail } from "./resend-client";
import { ArrivalReminderEmail } from "./templates/ArrivalReminderEmail";
import { buildClickToChatUrl } from "./whatsapp-client";

export async function notifyArrival(bookingId: string): Promise<void> {
  const booking = await prisma.trimlyBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      scheduledFor: true,
      addressLine1: true,
      addressLine2: true,
      estate: true,
      city: true,
      service: { select: { name: true } },
      user: { select: { email: true, name: true } },
    },
  });
  if (!booking || !booking.user.email) {
    // eslint-disable-next-line no-console
    console.warn("[notify-arrival] booking or user.email not found", { bookingId });
    return;
  }

  const customerName = booking.user.name ?? booking.user.email.split("@")[0];
  const time = `${String(booking.scheduledFor.getHours()).padStart(2, "0")}:${String(booking.scheduledFor.getMinutes()).padStart(2, "0")}`;
  const addressOneLine = [
    booking.addressLine1,
    booking.addressLine2,
    `${booking.estate}, ${booking.city}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const result = await sendTransactionalEmail({
    to: { email: booking.user.email, name: customerName },
    subject: `On the way — ETA ${time}`,
    text: [
      `Hi ${customerName.split(/\s+/)[0]},`,
      ``,
      `The barber is leaving the previous stop and will arrive at ${time}.`,
      ``,
      `Address on file: ${addressOneLine}`,
      ``,
      `Address change? Tap WhatsApp in the email — fastest way to reach the barber.`,
      ``,
      `— Trimly`,
    ].join("\n"),
    tag: "arrival_reminder",
    react: ArrivalReminderEmail({
      customerName,
      serviceName: booking.service.name,
      scheduledTimeLocal: time,
      addressOneLine,
      estate: booking.estate,
      whatsappReplyUrl: buildClickToChatUrl(`Hi, last-minute address update for booking ${booking.id}.`),
    }),
  });

  if (!result.ok && !result.skipped) {
    // eslint-disable-next-line no-console
    console.error("[notify-arrival] send failed", { bookingId, error: result.error });
  }
}
