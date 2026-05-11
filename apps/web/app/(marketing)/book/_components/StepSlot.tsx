"use client";

/**
 * Step 3 — Date + time slot. Renders a 14-day strip starting tomorrow.
 *
 * Nairobi rules (per Trimly brief §7.2):
 *   - Only Saturdays and one configurable weekday are available (Tuesday by default)
 *   - 5-day minimum lead time, enforced server-side too
 *
 * Nakuru rules:
 *   - Monday–Saturday available
 *   - 24-hour minimum lead time
 *
 * Both cities use the same fixed slot list for the prototype. Real
 * implementation will read from `TrimlyAvailability` rows.
 */
import { useMemo, useState } from "react";

import type { City } from "@lib/trimly/types";

interface Props {
  city: City;
  value?: string; // ISO datetime
  onSelect: (iso: string) => void;
}

const NAIROBI_ALLOWED_DAYS = [2, 6]; // Tuesday + Saturday
const NAKURU_ALLOWED_DAYS = [1, 2, 3, 4, 5, 6]; // Mon–Sat
const SLOTS_PER_DAY = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];

const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function buildDayStrip(city: City) {
  const days: Array<{ iso: string; dow: string; dom: number; disabled: boolean }> = [];
  const allowed = city === "Nairobi" ? NAIROBI_ALLOWED_DAYS : NAKURU_ALLOWED_DAYS;
  const minLeadDays = city === "Nairobi" ? 5 : 1;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 1); // start tomorrow

  for (let i = 0; i < 14; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dayOfWeek = d.getDay();
    const enoughLead = i + 1 >= minLeadDays;
    const onAllowedDay = allowed.includes(dayOfWeek);
    days.push({
      iso: d.toISOString(),
      dow: DOW_SHORT[dayOfWeek],
      dom: d.getDate(),
      disabled: !(enoughLead && onAllowedDay),
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
        <p
          className="t-eyebrow"
          style={{ marginBottom: 12, fontSize: 11, color: "var(--trimly-text-muted)" }}>
          {MONTH_SHORT[new Date().getMonth()]}–{MONTH_SHORT[(new Date().getMonth() + 1) % 12]}
        </p>
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

        {pickedDate ? (
          <>
            <p
              className="t-eyebrow"
              style={{ margin: "28px 0 12px", fontSize: 11 }}>
              Pick a time
            </p>
            <div className="t-slots" role="radiogroup" aria-label="Pick a time">
              {SLOTS_PER_DAY.map((slot) => {
                const slotIso = (() => {
                  const [h, m] = slot.split(":").map(Number);
                  const d = new Date(pickedDate);
                  d.setHours(h, m, 0, 0);
                  return d.toISOString();
                })();
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
