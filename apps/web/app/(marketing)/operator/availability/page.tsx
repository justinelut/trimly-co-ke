/**
 * /operator/availability — 28-day strip. Each tile is a click-to-toggle
 * "block this day" button. Blocked days disappear from the customer
 * booking wizard (handled by the booking-quote/slot endpoints once
 * Prisma is wired).
 */
import { fetchAvailabilityStrip } from "../_lib/operator-data";
import { requireOperator } from "../_lib/require-operator";
import { BlockDayToggle } from "../_components/BlockDayToggle";
import { OperatorHeader } from "../_components/OperatorHeader";

export const metadata = { title: "Availability · Trimly operator" };
export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const operator = await requireOperator("/operator/availability");
  const strip = await fetchAvailabilityStrip();

  const blockedCount = strip.filter((d) => d.blocked).length;
  const bookedDays = strip.filter((d) => d.scheduledCount > 0).length;

  return (
    <main className="t-dash">
      <OperatorHeader operatorName={operator.name} current="availability" />

      <div className="t-section-row">
        <h2>
          The next <em>four weeks</em>
        </h2>
        <p style={{ margin: 0, color: "var(--trimly-text-muted)", fontSize: 13 }}>
          {blockedCount} blocked · {bookedDays} day{bookedDays === 1 ? "" : "s"} with bookings
        </p>
      </div>

      <div className="t-avail-strip">
        {strip.map((day) => (
          <BlockDayToggle
            key={day.date}
            date={day.date}
            initialBlocked={day.blocked}
            scheduledCount={day.scheduledCount}
          />
        ))}
      </div>

      <p
        style={{
          marginTop: 32,
          maxWidth: "70ch",
          fontSize: 13,
          color: "var(--trimly-text-muted)",
          lineHeight: 1.6,
        }}>
        Blocking a day removes it from the customer booking wizard's date picker. It does NOT
        cancel bookings already scheduled — those need an explicit call to the customer first
        and a manual cancel from <a href="/operator/calendar" style={{ color: "var(--trimly-accent)" }}>Calendar</a>.
        Sundays are blocked by default; you can open them per-week.
      </p>
    </main>
  );
}
