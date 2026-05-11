/**
 * /book — Trimly booking wizard.
 *
 * Server component. Renders the page chrome and delegates the multi-step
 * wizard to the BookingWizard client component. We do NOT require an
 * authenticated cal.diy session — Trimly customers can book without
 * signing up first. Customer email/name/phone are collected in Step 4.
 *
 * The route inherits the (marketing) layout: Fraunces font + dark theme.
 */
import Link from "next/link";

import { BookingWizard } from "./_components/BookingWizard";

export const metadata = {
  title: "Book a cut · Trimly",
  description:
    "Book a Trimly cut in five steps — city, service, time, address, payment. M-Pesa or card. No surprises.",
};

export default function BookPage() {
  return (
    <>
      <header className="t-header is-scrolled">
        <div className="t-header__inner">
          <Link href="/" className="t-wordmark">
            Trim<em>ly</em>
          </Link>
          <nav className="t-nav" aria-label="Primary">
            <Link href="/#services">Services</Link>
            <Link href="/#subscriptions">Pricing</Link>
            <Link href="/#areas">Areas</Link>
          </nav>
          <div className="t-header__cta">
            <Link href="/" className="t-btn t-btn--secondary" style={{ padding: "8px 16px", fontSize: 13 }}>
              Back to home
            </Link>
          </div>
        </div>
      </header>

      <BookingWizard />
    </>
  );
}
