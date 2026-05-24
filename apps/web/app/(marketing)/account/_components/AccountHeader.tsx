/**
 * AccountHeader — greeting + tab bar shared by every /account/* page.
 *
 * The site-wide chrome (wordmark / nav / theme toggle / sign-out) lives in
 * the (marketing) layout via <SiteHeader/>. This component is just the
 * dashboard greeting and the per-account tab strip — it must NOT render
 * its own <header> element or we'd stack two on top of each other.
 *
 * Server component; the active-tab styling comes from the `current` prop
 * passed by each page (so the page's URL drives the highlight, no
 * client-side routing needed).
 */
import Link from "next/link";

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
