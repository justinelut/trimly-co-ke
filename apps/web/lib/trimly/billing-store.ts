"use client";

/**
 * Trimly billing period store.
 *
 * Zustand + persist, so the user's choice of monthly ⇄ yearly survives
 * navigation between the homepage's pricing section and /pricing, and
 * survives a refresh. localStorage is fine — there's no PII here, just
 * "monthly" or "yearly".
 *
 * Why a store: the original implementation rewrote `el.href` on every
 * Link inside a useEffect when the toggle flipped. That mutates the DOM
 * `href` attribute, but Next.js's `<Link>` routes via its `href` PROP,
 * not the DOM, so clicking the CTA always sent the user to the
 * monthly checkout. With this store, every <PlanCardCTA> reactively
 * computes its `href` from the current `period`, so Next routes to the
 * right URL.
 *
 * SSR note: this store is only used by client components ("use client"
 * is enforced by zustand/react). Server components keep rendering the
 * monthly price as the default; client components hydrate from the
 * persisted value and re-render if it differs.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type BillingPeriod = "monthly" | "yearly";

interface BillingState {
  period: BillingPeriod;
  setPeriod: (period: BillingPeriod) => void;
}

export const useBillingStore = create<BillingState>()(
  persist(
    (set) => ({
      period: "monthly",
      setPeriod: (period) => set({ period }),
    }),
    {
      name: "trimly-billing",
      // Only persist the field we care about. If the shape ever grows
      // we'll add a `partialize` here to keep storage compact.
      storage: createJSONStorage(() => localStorage),
      // Bump on schema change to invalidate stale entries.
      version: 1,
    }
  )
);
