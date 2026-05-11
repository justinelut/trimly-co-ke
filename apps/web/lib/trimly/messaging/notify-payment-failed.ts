/**
 * Compose + send the "payment didn't go through" email.
 * Called by settle-payment.settleFailed() AFTER the DB writes commit.
 */
import prisma from "@calcom/prisma";

import { sendTransactionalEmail } from "./resend-client";
import { PaymentFailedEmail } from "./templates/PaymentFailedEmail";
import { buildClickToChatUrl } from "./whatsapp-client";

const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDateLocal(d: Date): string {
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${DOW_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]} · ${time}`;
}

export async function notifyPaymentFailed(
  bookingId: string,
  reason: string
): Promise<void> {
  const booking = await prisma.trimlyBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      scheduledFor: true,
      totalKES: true,
      service: { select: { name: true } },
      user: { select: { email: true, name: true } },
    },
  });
  if (!booking || !booking.user.email) {
    // eslint-disable-next-line no-console
    console.warn("[notify-payment-failed] booking or user.email not found", { bookingId });
    return;
  }

  const webUrl = process.env.NEXT_PUBLIC_WEBAPP_URL ?? "https://trimly.co.ke";
  const customerName = booking.user.name ?? booking.user.email.split("@")[0];
  const scheduledForLocal = formatDateLocal(booking.scheduledFor);

  const result = await sendTransactionalEmail({
    to: { email: booking.user.email, name: customerName },
    subject: `Payment for ${booking.service.name} didn't go through`,
    text: [
      `Hi ${customerName.split(/\s+/)[0]},`,
      ``,
      `Your payment for ${booking.service.name} on ${scheduledForLocal} didn't complete.`,
      `Gateway said: ${reason}`,
      ``,
      `Retry: ${webUrl}/book`,
      `Or message us on WhatsApp.`,
      ``,
      `— Trimly`,
    ].join("\n"),
    tag: "payment_failed",
    react: PaymentFailedEmail({
      customerName,
      serviceName: booking.service.name,
      scheduledForLocal,
      totalKES: booking.totalKES,
      reason,
      retryPaymentUrl: `${webUrl}/book`,
      whatsappReplyUrl: buildClickToChatUrl(`Hi, payment for booking ${booking.id} didn't go through.`),
    }),
  });

  if (!result.ok && !result.skipped) {
    // eslint-disable-next-line no-console
    console.error("[notify-payment-failed] send failed", { bookingId, error: result.error });
  }
}
