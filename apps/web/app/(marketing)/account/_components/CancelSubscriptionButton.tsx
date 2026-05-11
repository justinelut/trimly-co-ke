"use client";

/**
 * Cancels a subscription at the end of its current period (NOT immediate —
 * the customer keeps the cuts they've paid for). Same two-step inline
 * confirm pattern as CancelBookingButton.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelSubscriptionButton({
  subscriptionId,
  cancelAtPeriodEnd,
}: {
  subscriptionId: string;
  cancelAtPeriodEnd: boolean;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<"idle" | "confirm" | "pending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function doCancel() {
    setStage("pending");
    setError(null);
    try {
      const res = await fetch(`/api/account/subscription/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, immediate: false }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Cancel failed (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Could not cancel.");
    }
  }

  if (cancelAtPeriodEnd) {
    return (
      <span className="t-btn t-btn--secondary" aria-live="polite">
        Cancellation scheduled
      </span>
    );
  }
  if (stage === "idle") {
    return (
      <button type="button" className="t-btn t-btn--secondary" onClick={() => setStage("confirm")}>
        Cancel subscription
      </button>
    );
  }
  if (stage === "confirm") {
    return (
      <>
        <button type="button" className="t-btn t-btn--secondary" onClick={() => setStage("idle")}>
          Keep it
        </button>
        <button type="button" className="t-btn t-btn--primary" onClick={doCancel} style={{ background: "var(--trimly-danger)", borderColor: "var(--trimly-danger)" }}>
          Yes, cancel at period end
        </button>
      </>
    );
  }
  if (stage === "pending") return <span className="t-btn t-btn--secondary">Cancelling…</span>;
  return (
    <>
      <span className="t-btn t-btn--secondary" title={error ?? ""}>
        Couldn&rsquo;t cancel
      </span>
      <button type="button" className="t-btn t-btn--secondary" onClick={() => setStage("idle")}>
        Try again
      </button>
    </>
  );
}
