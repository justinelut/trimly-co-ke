/**
 * Small empty-state block used when a tab has no data to show.
 * Editorial restraint — single icon, headline, body, optional CTA.
 */
import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  title: string;
  body: string;
  cta?: { label: string; href: string };
  icon?: ReactNode;
}

export function EmptyState({ title, body, cta, icon }: Props) {
  return (
    <div className="t-empty">
      <div className="t-empty__icon">
        {icon ?? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 9h18M8 3v4M16 3v4" />
          </svg>
        )}
      </div>
      <h3 className="t-empty__title">{title}</h3>
      <p className="t-empty__body">{body}</p>
      {cta ? (
        <Link href={cta.href} className="t-btn t-btn--primary">
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
