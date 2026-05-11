"use client";

/**
 * BillingToggle — monthly ⇄ yearly switch for the Subscriptions section.
 *
 * State lives here; the plan price elements are still rendered by the parent
 * (server component) but carry data-monthly / data-yearly attributes that this
 * client component rewrites in place when the period changes. This keeps the
 * SSR content correct (search engines see real prices) and only the period
 * toggle requires JS to enhance.
 */
import { useEffect, useState } from "react";

type Period = "monthly" | "yearly";

export function BillingToggle() {
  const [period, setPeriod] = useState<Period>("monthly");

  // When the period changes, walk every [data-monthly][data-yearly] node and
  // rewrite its textContent to the matching attribute.
  useEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-monthly][data-yearly]").forEach((el) => {
      const value = el.dataset[period];
      if (value) el.textContent = value;
    });
  }, [period]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      <div className="t-billing" role="tablist" aria-label="Billing period">
        <button
          type="button"
          className={period === "monthly" ? "is-active" : ""}
          onClick={() => setPeriod("monthly")}>
          Monthly
        </button>
        <button
          type="button"
          className={period === "yearly" ? "is-active" : ""}
          onClick={() => setPeriod("yearly")}>
          Yearly
        </button>
      </div>
      <span className="t-billing__save">Save 17 % yearly</span>
    </div>
  );
}
