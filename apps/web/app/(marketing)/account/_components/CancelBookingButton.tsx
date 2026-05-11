"use client";

/**
 * Two-step cancel: first click expands an inline confirm row; second
 * click POSTs to /api/account/bookings/:id/cancel. We deliberately do
 * NOT use a full modal — for a single irreversible action the inline
 * confirm is more honest and matches Aman/Aesop's tonal restraint.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [stage, setStage] = useState<"idle" | "confirm" | "pending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function doCancel() {
    setStage("pending");
    setError(null);
    try {
      const res = await fetch(`/api/account/bookings/${encodeURIComponent(bookingId)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Cancel failed (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Could not cancel the booking.");
    }
  }

  if (stage === "idle") {
    return (
      <button type="button" className="t-btn-sm t-btn-sm--danger" onClick={() => setStage("confirm")}>
        Cancel
      </button>
    );
  }
  if (stage === "confirm") {
    return (
      <>
        <button type="button" className="t-btn-sm" onClick={() => setStage("idle")}>
          Keep it
        </button>
        <button type="button" className="t-btn-sm t-btn-sm--danger" onClick={doCancel}>
          Yes, cancel
        </button>
      </>
    );
  }
  if (stage === "pending") {
    return (
      <span className="t-btn-sm" aria-live="polite">
        Cancelling…
      </span>
    );
  }
  // stage === "error"
  return (
    <>
      <span className="t-btn-sm t-btn-sm--danger" title={error ?? ""}>
        Couldn&rsquo;t cancel
      </span>
      <button type="button" className="t-btn-sm" onClick={() => setStage("idle")}>
        Try again
      </button>
    </>
  );
}
