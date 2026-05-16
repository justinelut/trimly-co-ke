"use client";

/**
 * Step 3 — Date + time slot. Fetches real availability from
 * /api/bookings/slots which checks the operator's Cal.diy schedule
 * and existing bookings.
 */
import { useEffect, useMemo, useState } from "react";

import type { City } from "@lib/trimly/types";

interface Props {
  city: City;
  value?: string;
  onSelect: (iso: string) => void;
}

const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildDayStrip(city: City) {
  const days: Array<{ iso: string; dateStr: string; dow: string; dom: number; disabled: boolean }> = [];
  const minLeadDays = city === "Nairobi" ? 5 : 1;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 1);

  for (let i = 0; i < 14; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dayOfWeek = d.getDay();
    const enoughLead = i + 1 >= minLeadDays;
    // Only disable if lead time is insufficient; availability is checked server-side
    const dateStr = d.toISOString().split("T")[0];
    days.push({
      iso: d.toISOString(),
      dateStr,
      dow: DOW_SHORT[dayOfWeek],
      dom: d.getDate(),
      disabled: !enoughLead,
    });
  }
  return days;
}

export function StepSlot({ city, value, onSelect }: Props) {
  const days = useMemo(() => buildDayStrip(city), [city]);
  const [pickedDate, setPickedDate] = useState<string | null>(() => {
    if (!value) return null;
    const d = new Date(value);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  });
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch available slots when a date is picked
  useEffect(() => {
    if (!pickedDate) return;
    const dateStr = new Date(pickedDate).toISOString().split("T")[0];
    setLoading(true);
    fetch(`/api/bookings/slots?city=${city}&date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [pickedDate, city]);

  function pickSlot(timeHHMM: string) {
    if (!pickedDate) return;
    const [h, m] = timeHHMM.split(":").map(Number);
    const composed = new Date(pickedDate);
    composed.setHours(h, m, 0, 0);
    onSelect(composed.toISOString());
  }

  return (
    <div className="t-step">
      <div className="t-step__head">
        <p className="t-eyebrow">Step 03</p>
        <h2 className="t-step__title">When works for you?</h2>
        <p className="t-step__intro">
          {city === "Nairobi"
            ? "Nairobi visits run on Tuesdays and Saturdays only — we batch trips to keep prices fair. Minimum five days notice."
            : "Pick any Monday through Saturday in the next two weeks."}
        </p>
      </div>

      <div>
        <div className="t-date-strip" role="radiogroup" aria-label="Pick a date">
          {days.map((d) => (
            <button
              key={d.iso}
              type="button"
              role="radio"
              aria-checked={pickedDate === d.iso}
              disabled={d.disabled}
              className={`t-date${pickedDate === d.iso ? " t-date--selected" : ""}`}
              onClick={() => setPickedDate(d.iso)}>
              <span className="t-date__dow">{d.dow}</span>
              <span className="t-date__dom">{d.dom}</span>
            </button>
          ))}
        </div>

        {pickedDate && loading ? (
          <p className="t-field__hint" style={{ marginTop: 20 }}>Loading available slots…</p>
        ) : null}

        {pickedDate && !loading && slots.length === 0 ? (
          <p className="t-field__hint" style={{ marginTop: 20 }}>No slots available on this day. Try another date.</p>
        ) : null}

        {pickedDate && !loading && slots.length > 0 ? (
          <>
            <p className="t-eyebrow" style={{ margin: "28px 0 12px", fontSize: 11 }}>
              Pick a time
            </p>
            <div className="t-slots" role="radiogroup" aria-label="Pick a time">
              {slots.map((slot) => {
                const [h, m] = slot.split(":").map(Number);
                const d = new Date(pickedDate);
                d.setHours(h, m, 0, 0);
                const slotIso = d.toISOString();
                return (
                  <button
                    key={slot}
                    type="button"
                    role="radio"
                    aria-checked={value === slotIso}
                    className={`t-slot${value === slotIso ? " t-slot--selected" : ""}`}
                    onClick={() => pickSlot(slot)}>
                    {slot}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
