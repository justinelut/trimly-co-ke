/**
 * Single booking row. Used by /account/upcoming and /account/past.
 *
 * - "Date" column on the left in big Fraunces numerals (the brief calls
 *   for prices and dates to be set with editorial weight).
 * - Service + meta in the middle.
 * - Status badge + total + actions on the right.
 *
 * Action set differs by tense (upcoming vs past) — drive it via the
 * `tense` prop instead of branching inside this component (small enough
 * branch to keep here; if it grows, split into TenseUpcoming / TensePast
 * components).
 */
import { formatKES } from "@lib/trimly/pricing";
import type { BookingDto } from "../_lib/account-types";
import { CancelBookingButton } from "./CancelBookingButton";
import { BookingStatusBadge } from "./StatusBadge";

const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface Props {
  booking: BookingDto;
  tense: "upcoming" | "past";
}

export function BookingCard({ booking, tense }: Props) {
  const date = new Date(booking.scheduledFor);
  const timeLabel = date.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const dayLabel = `${DOW_SHORT[date.getDay()]} · ${timeLabel}`;
  const canCancel = tense === "upcoming" && booking.bookingStatus === "confirmed";

  return (
    <article className="t-booking">
      <div className="t-booking__date">
        <span className="t-booking__dom">{date.getDate()}</span>
        <span className="t-booking__month">{MONTH_SHORT[date.getMonth()]}</span>
      </div>

      <div className="t-booking__main">
        <h3 className="t-booking__service">
          {booking.serviceName} <span className="t-booking__sub-meta">· {booking.durationMin} min</span>
        </h3>
        <p className="t-booking__meta">
          {booking.addressLine1}
          {booking.addressLine2 ? `, ${booking.addressLine2}` : ""} ·{" "}
          <span className="t-booking__sub-meta">{booking.estate}, {booking.city}</span>
        </p>
        <p className="t-booking__sub-meta">
          {dayLabel} · {booking.paymentChannel === "mobile_money" ? "M-Pesa" : "Card"}
          {booking.paystackReference ? ` · ${booking.paystackReference}` : ""}
        </p>
      </div>

      <div className="t-booking__aside">
        <BookingStatusBadge status={booking.bookingStatus} />
        <span className="t-booking__price">{formatKES(booking.totalKES)}</span>
        <div className="t-booking__actions">
          {canCancel ? <CancelBookingButton bookingId={booking.id} /> : null}
          {tense === "past" && booking.paymentStatus === "succeeded" ? (
            <a
              className="t-btn-sm"
              href={`/api/account/bookings/${booking.id}/receipt`}
              target="_blank"
              rel="noopener noreferrer">
              Receipt
            </a>
          ) : null}
          <a
            className="t-btn-sm"
            href={`https://wa.me/254700000000?text=${encodeURIComponent(
              `Hi, about booking ${booking.id}`
            )}`}
            target="_blank"
            rel="noopener noreferrer">
            WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}
