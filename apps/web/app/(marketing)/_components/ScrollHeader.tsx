"use client";

/**
 * ScrollHeader — adds `is-scrolled` to the header element when the viewport
 * scrolls past 24px. The CSS in trimly.css picks up the class and applies the
 * blurred backdrop + bottom border.
 *
 * Wraps the header markup as a client component; the children prop receives
 * all the static markup (nav, wordmark, CTA) from the server component above.
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export function ScrollHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`t-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="t-header__inner">{children}</div>
    </header>
  );
}
