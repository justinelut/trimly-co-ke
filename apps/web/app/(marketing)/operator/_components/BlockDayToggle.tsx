"use client";

/**
 * Single button on the /operator/availability strip. Optimistic flip
 * with rollback on failure.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  date: string; // YYYY-MM-DD
  initialBlocked: boolean;
  scheduledCount: number;
}

export function BlockDayToggle({ date, initialBlocked, scheduledCount }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [blocked, setBlocked] = useState(initialBlocked);
  const [error, setError] = useState<string | null>(null);

  const d = new Date(date);
  const dow = DOW_SHORT[d.getDay()];
  const dom = d.getDate();

  async function toggle() {
    setError(null);
    // If unblocking a day with bookings, no confirm needed. If blocking
    // a day with bookings, the operator probably means it (they can see
    // the count next to the toggle).
    const next = !blocked;
    setBlocked(next); // optimistic
    try {
      const res = await fetch("/api/operator/availability/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, blocked: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? "Failed");
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setBlocked(initialBlocked); // rollback
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <button
      type="button"
      className={blocked ? "t-avail-day t-avail-day--blocked" : "t-avail-day"}
      onClick={toggle}
      aria-pressed={blocked}
      title={
        blocked
          ? "Blocked — click to open back up"
          : `${scheduledCount} booking${scheduledCount === 1 ? "" : "s"} scheduled${
              scheduledCount > 0 ? " — blocking won't cancel them" : ""
            }`
      }>
      <span className="t-avail-day__dow">{dow}</span>
      <span className="t-avail-day__dom">{dom}</span>
      {error ? <span style={{ fontSize: 10, color: "var(--trimly-danger)" }}>{error}</span> : null}
    </button>
  );
}
