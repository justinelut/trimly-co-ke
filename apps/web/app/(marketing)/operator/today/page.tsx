/**
 * /operator/today — chronological list of today's stops with travel hints,
 * WhatsApp + call + Cut-done actions per stop, and a top summary strip.
 */
import { formatKES } from "@lib/trimly/pricing";

import { fetchTodayStops } from "../_lib/operator-data";
import { requireOperator } from "../_lib/require-operator";
import { EmptyState } from "../../account/_components/EmptyState";
import { OperatorHeader } from "../_components/OperatorHeader";
import { StopCard } from "../_components/StopCard";

export const metadata = { title: "Today · Trimly operator" };
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const operator = await requireOperator("/operator/today");
  const stops = await fetchTodayStops();

  const totalKES = stops.reduce((s, x) => s + x.totalKES, 0);
  const totalMinutes = stops.reduce((s, x) => s + x.durationMin, 0);
  const cityCount = new Set(stops.map((s) => s.address.city)).size;

  return (
    <main className="t-dash">
      <OperatorHeader operatorName={operator.name} current="today" />

      {stops.length === 0 ? (
        <EmptyState
          title="Nothing on the calendar today."
          body="A day off, or just bookings haven't landed yet — either way, the calendar is yours."
        />
      ) : (
        <>
          <div className="t-today-summary">
            <div>
              <span className="t-kpi__label">Stops</span>
              <span className="t-kpi__value" style={{ fontSize: 24 }}>{stops.length}</span>
            </div>
            <div>
              <span className="t-kpi__label">Revenue today</span>
              <span className="t-kpi__value" style={{ fontSize: 24 }}>{formatKES(totalKES)}</span>
            </div>
            <div>
              <span className="t-kpi__label">Time on the chair</span>
              <span className="t-kpi__value" style={{ fontSize: 24 }}>
                {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
              </span>
            </div>
          </div>
          {cityCount > 1 ? (
            <p style={{ marginBottom: 24, color: "var(--trimly-accent)", fontSize: 13, letterSpacing: "0.04em" }}>
              Today's run crosses both Nakuru and Nairobi — double-check the travel buffers.
            </p>
          ) : null}
          <div className="t-stops">
            {stops.map((stop) => (
              <StopCard key={stop.bookingId} stop={stop} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
