"use client";

/**
 * One-tap "Cut done" for the operator. POSTs to /api/operator/bookings/[id]/complete.
 * Two-step inline confirm same as the customer-side cancel pattern.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkCompleteButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [stage, setStage] = useState<"idle" | "confirm" | "pending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function doComplete() {
    setStage("pending");
    setError(null);
    try {
      const res = await fetch(`/api/operator/bookings/${encodeURIComponent(bookingId)}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Complete failed (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Couldn't mark complete.");
    }
  }

  if (stage === "idle") {
    return (
      <button type="button" className="t-btn-sm" onClick={() => setStage("confirm")}>
        Cut done
      </button>
    );
  }
  if (stage === "confirm") {
    return (
      <>
        <button type="button" className="t-btn-sm" onClick={() => setStage("idle")}>
          Back
        </button>
        <button type="button" className="t-btn-sm" style={{ borderColor: "var(--trimly-accent)", color: "var(--trimly-accent)" }} onClick={doComplete}>
          Confirm
        </button>
      </>
    );
  }
  if (stage === "pending") return <span className="t-btn-sm">Marking…</span>;
  return (
    <>
      <span className="t-btn-sm t-btn-sm--danger" title={error ?? ""}>
        Failed
      </span>
      <button type="button" className="t-btn-sm" onClick={() => setStage("idle")}>
        Try again
      </button>
    </>
  );
}
