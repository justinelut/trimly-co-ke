/**
 * (marketing)/layout.tsx
 *
 * Wraps every page in the marketing route group with:
 *   1. Fraunces (display) via next/font/google, exposed as --font-fraunces
 *   2. A `data-trimly-theme="dark"` attribute that scopes every Trimly CSS rule
 *   3. The Trimly stylesheet (separate from Cal's globals — zero collisions)
 *   4. A single global SiteHeader (every page picks it up; pages MUST NOT
 *      render their own header or you'll stack two of them)
 *   5. A mobile-only sticky bottom CTA (Call / WhatsApp / Book) for fast
 *      conversion on phones — the highest-intent surface for a barber site
 *
 * Cal's existing fonts (--font-sans for Inter, --font-cal for CalSans) come
 * from the root layout.tsx and are still available here — we just add Fraunces.
 */
import { Fraunces } from "next/font/google";
import type { ReactNode } from "react";

import "../../styles/trimly.css";

import { MobileStickyCTA } from "./_components/MobileStickyCTA";
import { SiteHeader } from "./_components/SiteHeader";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
  preload: true,
});

// E.164 minus the leading "+" — used for tel: and wa.me links. Override per
// environment via TRIMLY_WHATSAPP_NUMBER (the same one buildLocalBusinessJsonLd
// reads in lib/trimly/seo.ts), so the contact number stays in one place.
const PHONE_E164 = process.env.TRIMLY_WHATSAPP_NUMBER ?? "254700000000";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className={fraunces.variable} data-trimly-theme="dark">
      <SiteHeader />
      {children}
      <MobileStickyCTA phoneE164={PHONE_E164} />
    </div>
  );
}
