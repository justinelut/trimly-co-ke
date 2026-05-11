/**
 * /operator/calendar — 7-day week view. Each cell shows the day's
 * bookings as small pills. Blocked days are dimmed with a "Blocked" tag.
 */
import { fetchWeek } from "../_lib/operator-data";
import { requireOperator } from "../_lib/require-operator";
import { OperatorHeader } from "../_components/OperatorHeader";

const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const metadata = { title: "Calendar · Trimly operator" };
export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const operator = await requireOperator("/operator/calendar");
  const days = await fetchWeek();

  return (
    <main className="t-dash">
      <OperatorHeader operatorName={operator.name} current="calendar" />

      <div className="t-section-row">
        <h2>The next <em>seven</em> days.</h2>
        <p style={{ margin: 0, color: "var(--trimly-text-muted)", fontSize: 13 }}>
          Click any day on{" "}
          <a href="/operator/availability" className="t-tab" style={{ display: "inline", padding: 0, color: "var(--trimly-accent)" }}>
            Availability
          </a>{" "}
          to block it.
        </p>
      </div>

      <div className="t-week">
        {days.map((day) => {
          const d = new Date(day.date);
          const cls = `t-week__day${day.isToday ? " t-week__day--today" : ""}${day.blocked ? " t-week__day--blocked" : ""}`;
          return (
            <div key={day.date} className={cls}>
              <div className="t-week__day-head">
                <span className="t-week__dow">{DOW_SHORT[d.getDay()]}</span>
                <span className="t-week__dom">{d.getDate()}</span>
              </div>
              {day.bookings.length === 0 ? (
                <p style={{ margin: 0, color: "var(--trimly-text-muted)", fontSize: 12 }}>
                  {day.blocked ? "—" : "No bookings"}
                </p>
              ) : (
                <div className="t-week__bookings">
                  {day.bookings.map((b, idx) => (
                    <div key={idx} className="t-week__pill">
                      <strong>{b.time}</strong> · {b.customer}
                      <br />
                      {b.serviceName} · {b.city}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
