/**
 * Single-card view of the customer's subscription. Shows plan, status,
 * cycle progress, next renewal, and primary actions (cancel, change plan).
 *
 * The brass-bordered surface matches the "most popular" plan card on the
 * landing — same component vocabulary, used here as the singular focus.
 */
import { formatKES } from "@lib/trimly/pricing";
import { CancelSubscriptionButton } from "./CancelSubscriptionButton";
import { SubscriptionStatusBadge } from "./StatusBadge";
import type { SubscriptionDto } from "../_lib/account-types";

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SubscriptionCard({ sub }: { sub: SubscriptionDto }) {
  const cutsUsed = sub.cutsPerCycle - sub.cutsRemaining;
  const progressPct = Math.round((cutsUsed / sub.cutsPerCycle) * 100);
  const renewalLabel =
    sub.status === "active"
      ? `Renews ${formatDateLong(sub.currentPeriodEnd)}`
      : sub.status === "past_due"
        ? "Renewal failed — needs your action"
        : `Ends ${formatDateLong(sub.currentPeriodEnd)}`;

  return (
    <div className="t-sub">
      <div className="t-sub__head">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p className="t-eyebrow t-eyebrow--accent">{sub.intervalLabel === "yearly" ? "Yearly" : "Monthly"} plan</p>
          <h2 className="t-sub__plan">
            The <em>{sub.planName}</em>
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: "var(--trimly-text-secondary)" }}>
            {sub.cutsPerCycle} cuts per cycle ·{" "}
            {sub.paymentMethod === "mpesa" ? "M-Pesa renewal" : "Auto-renews on card"}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <SubscriptionStatusBadge status={sub.status} />
          <p className="t-sub__price">
            {formatKES(sub.priceKES)}
            <span className="t-sub__price-unit">/ {sub.intervalLabel === "yearly" ? "year" : "month"}</span>
          </p>
        </div>
      </div>

      <div className="t-sub__grid">
        <div>
          <p className="t-sub__stat-label">Cuts used</p>
          <p className="t-sub__stat-value">
            {cutsUsed} / {sub.cutsPerCycle}
          </p>
          <div className="t-sub__progress" aria-hidden>
            <div className="t-sub__progress-bar" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div>
          <p className="t-sub__stat-label">Started</p>
          <p className="t-sub__stat-value" style={{ fontSize: 16, fontWeight: 500, fontFamily: "var(--font-sans), sans-serif", letterSpacing: 0 }}>
            {formatDateLong(sub.currentPeriodStart)}
          </p>
        </div>
        <div>
          <p className="t-sub__stat-label">{sub.status === "cancelled" || sub.status === "non_renewing" ? "Ends" : "Renews"}</p>
          <p className="t-sub__stat-value" style={{ fontSize: 16, fontWeight: 500, fontFamily: "var(--font-sans), sans-serif", letterSpacing: 0 }}>
            {formatDateLong(sub.currentPeriodEnd)}
          </p>
        </div>
      </div>

      {sub.status === "past_due" ? (
        <p style={{ margin: 0, color: "var(--trimly-danger)", fontSize: 14, lineHeight: 1.5 }}>
          Your last M-Pesa renewal prompt expired without confirmation. {renewalLabel}. Booking access is paused until you renew.
        </p>
      ) : null}

      <div className="t-sub__actions">
        {sub.status === "active" || sub.status === "past_due" ? (
          <CancelSubscriptionButton subscriptionId={sub.id} cancelAtPeriodEnd={sub.cancelAtPeriodEnd} />
        ) : null}
        {sub.status === "past_due" ? (
          <a href="/account/payment-methods" className="t-btn t-btn--primary">
            Renew now
          </a>
        ) : null}
        <a href="/pricing" className="t-btn t-btn--secondary">
          Change plan
        </a>
      </div>
    </div>
  );
}
