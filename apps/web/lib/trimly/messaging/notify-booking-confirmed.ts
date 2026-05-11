/**
 * Compose + send the "your cut is confirmed" email.
 *
 * Called by settle-payment.settleSucceeded() AFTER the database mutations
 * are committed. Fire-and-forget — never throws back into the caller.
 */
import prisma from "@calcom/prisma";

import { sendTransactionalEmail } from "./resend-client";
import { BookingConfirmedEmail } from "./templates/BookingConfirmedEmail";
import { buildClickToChatUrl } from "./whatsapp-client";

const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDateLocal(d: Date): string {
  // "Sat 17 May · 10:30"
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${DOW_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]} · ${time}`;
}

export async function notifyBookingConfirmed(bookingId: string): Promise<void> {
  const booking = await prisma.trimlyBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      scheduledFor: true,
      addressLine1: true,
      addressLine2: true,
      estate: true,
      city: true,
      totalKES: true,
      service: { select: { name: true, durationMin: true } },
      user: { select: { email: true, name: true } },
      payment: { select: { providerReference: true } },
    },
  });
  if (!booking || !booking.user.email) {
    // eslint-disable-next-line no-console
    console.warn("[notify-booking-confirmed] booking or user.email not found", { bookingId });
    return;
  }

  const webUrl = process.env.NEXT_PUBLIC_WEBAPP_URL ?? "https://trimly.co.ke";
  const customerName = booking.user.name ?? booking.user.email.split("@")[0];
  const addressOneLine = [
    booking.addressLine1,
    booking.addressLine2,
    `${booking.estate}, ${booking.city}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const result = await sendTransactionalEmail({
    to: { email: booking.user.email, name: customerName },
    subject: `Confirmed: ${booking.service.name} on ${formatDateLocal(booking.scheduledFor)}`,
    text: [
      `Hi ${customerName.split(/\s+/)[0]},`,
      ``,
      `Your ${booking.service.name} on ${formatDateLocal(booking.scheduledFor)} is confirmed.`,
      ``,
      `Address: ${addressOneLine}`,
      `Total: KES ${booking.totalKES.toLocaleString("en-KE")}`,
      `Reference: ${booking.payment?.providerReference ?? booking.id}`,
      ``,
      `Manage your booking: ${webUrl}/account/upcoming`,
      ``,
      `— Trimly`,
    ].join("\n"),
    tag: "booking_confirmed",
    react: BookingConfirmedEmail({
      customerName,
      serviceName: booking.service.name,
      durationMin: booking.service.durationMin,
      scheduledForLocal: formatDateLocal(booking.scheduledFor),
      addressOneLine,
      totalKES: booking.totalKES,
      reference: booking.payment?.providerReference ?? booking.id,
      manageBookingUrl: `${webUrl}/account/upcoming`,
      whatsappReplyUrl: buildClickToChatUrl(`Hi, about booking ${booking.id}.`),
    }),
  });

  if (!result.ok && !result.skipped) {
    // eslint-disable-next-line no-console
    console.error("[notify-booking-confirmed] send failed", { bookingId, error: result.error });
  }
}
