/**
 * BookingSummary — sticky rail (right column on desktop, stacked on
 * mobile) that shows the current draft of the booking and the total.
 *
 * The price always comes from the server-side quote — we never compute
 * it client-side. The wizard fetches a new quote whenever city or
 * service changes.
 */
import { formatKES } from "@lib/trimly/pricing";

interface SummaryProps {
  city?: string;
  serviceName?: string;
  durationMin?: number;
  dateLabel?: string;
  slotLabel?: string;
  addressOneLine?: string;
  totalKES?: number;
}

export function BookingSummary(props: SummaryProps) {
  const rows: Array<{ label: string; value?: string; accent?: boolean }> = [
    { label: "City", value: props.city },
    {
      label: "Service",
      value: props.serviceName
        ? `${props.serviceName}${props.durationMin ? ` · ${props.durationMin} min` : ""}`
        : undefined,
    },
    {
      label: "When",
      value: props.dateLabel
        ? `${props.dateLabel}${props.slotLabel ? ` · ${props.slotLabel}` : ""}`
        : undefined,
    },
    { label: "Where", value: props.addressOneLine },
  ];

  return (
    <aside className="t-summary" aria-label="Your booking so far">
      <div className="t-summary__head">
        <p className="t-eyebrow">Your booking</p>
        <h3>Trimly · Cut at home</h3>
      </div>

      {rows.map((row) => (
        <div className="t-summary__row" key={row.label}>
          <span className="t-summary__label">{row.label}</span>
          <span
            className={
              row.accent ? "t-summary__value t-summary__value--accent" : "t-summary__value"
            }>
            {row.value ?? "—"}
          </span>
        </div>
      ))}

      <div className="t-summary__total-row">
        <span className="t-summary__total-label">Total</span>
        <span className="t-summary__total-amount t-price">
          {props.totalKES ? formatKES(props.totalKES) : "—"}
        </span>
      </div>
    </aside>
  );
}
