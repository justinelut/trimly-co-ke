"use client";

/**
 * PlanCardCTA — the "Start with X" link on each pricing plan card.
 *
 * Reads the current billing period from the zustand store so the href
 * always reflects what the user picked on the toggle (monthly vs yearly),
 * across BOTH the homepage and /pricing. Replaces the previous DOM-href
 * mutation hack which was silently broken on Next.js's <Link> (the prop
 * controls routing, not the DOM attribute).
 */
import Link from "next/link";

import { useBillingStore } from "@lib/trimly/billing-store";

interface PlanCardCTAProps {
  slug: string;
  label: string;
  variant: "primary" | "secondary";
}

export function PlanCardCTA({ slug, label, variant }: PlanCardCTAProps) {
  const period = useBillingStore((s) => s.period);

  return (
    <Link
      href={`/account/subscription?plan=${slug}&billing=${period}`}
      className={`t-btn t-btn--${variant} t-plan__cta`}
      style={{ width: "100%", justifyContent: "center" }}
      data-billing={period}>
      {label}
    </Link>
  );
}
