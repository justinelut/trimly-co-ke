/**
 * (marketing)/layout.tsx
 *
 * Wraps every page in the marketing route group with:
 *   1. Fraunces (display) via next/font/google, exposed as --font-fraunces
 *   2. A `data-trimly-theme="dark"` attribute that scopes every Trimly CSS rule
 *   3. The Trimly stylesheet (separate from Cal's globals — zero collisions)
 *
 * Cal's existing fonts (--font-sans for Inter, --font-cal for CalSans) come
 * from the root layout.tsx and are still available here — we just add Fraunces.
 */
import { Fraunces } from "next/font/google";
import type { ReactNode } from "react";

import "../../styles/trimly.css";

import { SiteHeader } from "./_components/SiteHeader";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
  preload: true,
});

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className={fraunces.variable} data-trimly-theme="dark">
      <SiteHeader />
      {children}
    </div>
  );
}
