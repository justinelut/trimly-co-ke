"use client";

/**
 * BillingToggle — monthly ⇄ yearly switch for the Subscriptions section.
 *
 * State now lives in the zustand store (lib/trimly/billing-store.ts) so it's
 * shared with every <PlanCardCTA> on the page (and across pages — the
 * choice persists in localStorage). Server-rendered prices are still
 * patched in place via data-monthly / data-yearly attributes for SEO
 * (search engines see real prices in the SSR HTML); only the toggle's
 * client-side rewrite runs after hydration.
 *
 * Why DOM mutation for prices but a store for hrefs: the price elements
 * are static text inside server components, so we can't easily make them
 * subscribe to the store without making the parent server components
 * client. Mutating textContent is fine for a 10-element page. The CTA
 * hrefs HAVE to come from the store because <Link> routes via its prop,
 * not the DOM href attribute (the previous bug).
 */
import { useEffect } from "react";

import { useBillingStore, type BillingPeriod } from "@lib/trimly/billing-store";

export function BillingToggle() {
  const period = useBillingStore((s) => s.period);
  const setPeriod = useBillingStore((s) => s.setPeriod);

  // Reflect the period into every server-rendered price node on this page.
  // Runs once on mount (hydrating from the persisted store value) and again
  // every time the user flips the toggle.
  useEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-monthly][data-yearly]").forEach((el) => {
      const value = el.dataset[period];
      if (value) el.textContent = value;
    });
    document.querySelectorAll<HTMLElement>("[data-monthly-was][data-yearly-was]").forEach((el) => {
      const key = period === "monthly" ? "monthlyWas" : "yearlyWas";
      const value = el.dataset[key];
      if (value) el.textContent = `was ${value}`;
    });
    document.querySelectorAll<HTMLElement>(".t-plan__interval").forEach((el) => {
      el.textContent = period === "monthly" ? " / month" : " / year";
    });
    // CTA hrefs are NOT mutated here anymore — <PlanCardCTA> reads from
    // the store directly so Next.js routes correctly on click.
  }, [period]);

  const onSelect = (next: BillingPeriod) => () => setPeriod(next);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      <div className="t-billing" role="tablist" aria-label="Billing period">
        <button
          type="button"
          role="tab"
          aria-selected={period === "monthly"}
          className={period === "monthly" ? "is-active" : ""}
          onClick={onSelect("monthly")}>
          Monthly
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={period === "yearly"}
          className={period === "yearly" ? "is-active" : ""}
          onClick={onSelect("yearly")}>
          Yearly
        </button>
      </div>
      <span className="t-billing__save">Save 17 % yearly</span>
    </div>
  );
}
