/**
 * AccountHeader — top chrome + tab bar shared by every /account/* page.
 * Server component; the active-tab styling comes from the `current` prop
 * passed by each page (so the page's URL drives the highlight, no
 * client-side routing needed).
 */
import Link from "next/link";

import { ThemeToggle } from "../../_components/ThemeToggle";

type TabKey = "upcoming" | "past" | "subscription" | "profile" | "payment-methods";

const TABS: Array<{ key: TabKey; label: string; href: string }> = [
  { key: "upcoming", label: "Upcoming", href: "/account/upcoming" },
  { key: "past", label: "Past", href: "/account/past" },
  { key: "subscription", label: "Subscription", href: "/account/subscription" },
  { key: "profile", label: "Profile", href: "/account/profile" },
  { key: "payment-methods", label: "Payment methods", href: "/account/payment-methods" },
];

export interface AccountHeaderProps {
  customerName: string;
  current: TabKey;
}

export function AccountHeader({ customerName, current }: AccountHeaderProps) {
  const firstName = customerName.split(/\s+/)[0];
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
            <Link href="/book">Book a cut</Link>
          </nav>
          <div className="t-header__cta">
            <ThemeToggle />
            <Link href="/api/auth/signout" className="t-btn t-btn--secondary" style={{ padding: "8px 16px", fontSize: 13 }}>
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <div className="t-dash__head">
        <div className="t-dash__greeting">
          <p className="t-eyebrow">Your account</p>
          <h1 className="t-dash__title">
            Welcome back, <em>{firstName}</em>.
          </h1>
        </div>
        <Link href="/book" className="t-btn t-btn--primary">
          Book another cut
        </Link>
      </div>

      <nav className="t-tab-bar" aria-label="Account sections">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={t.key === current ? "t-tab t-tab--active" : "t-tab"}
            aria-current={t.key === current ? "page" : undefined}>
            {t.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

export type { TabKey };
