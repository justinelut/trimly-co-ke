/**
 * Header + tab bar shared across all /operator/* pages.
 * Server component — active-tab state comes from the `current` prop.
 */
import Link from "next/link";

import { ThemeToggle } from "../../_components/ThemeToggle";

type TabKey = "today" | "calendar" | "clients" | "payments" | "availability";

const TABS: Array<{ key: TabKey; label: string; href: string }> = [
  { key: "today", label: "Today", href: "/operator/today" },
  { key: "calendar", label: "Calendar", href: "/operator/calendar" },
  { key: "clients", label: "Clients", href: "/operator/clients" },
  { key: "payments", label: "Payments", href: "/operator/payments" },
  { key: "availability", label: "Availability", href: "/operator/availability" },
];

export function OperatorHeader({
  operatorName,
  current,
}: {
  operatorName: string;
  current: TabKey;
}) {
  const firstName = operatorName.split(/\s+/)[0];
  return (
    <>
      <header className="t-header is-scrolled">
        <div className="t-header__inner">
          <Link href="/" className="t-wordmark">
            Trim<em>ly</em>
          </Link>
          <nav className="t-nav" aria-label="Primary">
            <Link href="/operator/today">Operator</Link>
            <Link href="/account">Customer</Link>
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
          <p className="t-eyebrow">Operator console</p>
          <h1 className="t-dash__title">
            Today's <em>run</em>, {firstName}.
          </h1>
        </div>
      </div>

      <nav className="t-tab-bar" aria-label="Operator sections">
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
