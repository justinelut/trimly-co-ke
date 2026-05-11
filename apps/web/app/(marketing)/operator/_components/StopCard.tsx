/**
 * Single row on /operator/today. The route between stops is implied via
 * the `travelHint` field (e.g. "9 min · Naka") rather than a heavy map
 * embed — the operator's phone has Maps already, this view just plans
 * the day.
 */
import { formatKES } from "@lib/trimly/pricing";

import { BookingStatusBadge } from "../../account/_components/StatusBadge";
import type { StopDto } from "../_lib/operator-types";

import { MarkCompleteButton } from "./MarkCompleteButton";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function buildWhatsappLink(phone: string, name: string): string {
  // Build E.164 from the normalised "07..." form.
  const e164 = phone.startsWith("0") ? `254${phone.slice(1)}` : phone;
  const text = encodeURIComponent(`Hi ${name.split(" ")[0]}, on my way — 15 min out.`);
  return `https://wa.me/${e164}?text=${text}`;
}

export function StopCard({ stop }: { stop: StopDto }) {
  return (
    <article className="t-stop">
      <div className="t-stop__time">
        <span className="t-stop__time-value">{formatTime(stop.scheduledFor)}</span>
        <span className="t-stop__time-duration">{stop.durationMin} min</span>
      </div>

      <div className="t-stop__main">
        <h3 className="t-stop__customer">{stop.customer.name}</h3>
        <p className="t-stop__service">
          {stop.serviceName} · {formatKES(stop.totalKES)}
        </p>
        <p className="t-stop__address">
          {stop.address.line1}
          {stop.address.line2 ? `, ${stop.address.line2}` : ""} · {stop.address.estate}, {stop.address.city}
        </p>
        {stop.travelHint ? <p className="t-stop__travel">→ {stop.travelHint}</p> : null}
      </div>

      <div className="t-stop__aside">
        <BookingStatusBadge status={stop.status} />
        <div className="t-stop__actions">
          <a
            className="t-btn-sm"
            href={buildWhatsappLink(stop.customer.phone, stop.customer.name)}
            target="_blank"
            rel="noopener noreferrer">
            15-min WhatsApp
          </a>
          <a className="t-btn-sm" href={`tel:${stop.customer.phone}`}>
            Call
          </a>
          {stop.status === "confirmed" || stop.status === "in_progress" ? (
            <MarkCompleteButton bookingId={stop.bookingId} />
          ) : null}
        </div>
      </div>
    </article>
  );
}
