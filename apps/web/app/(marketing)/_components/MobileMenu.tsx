"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useState } from "react";

import { ThemeToggle } from "./ThemeToggle";

export function MobileMenu({ isLoggedIn, isOperator }: { isLoggedIn: boolean; isOperator: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="t-mobile-menu-trigger" aria-label="Open menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="t-sheet-overlay" />
        <Dialog.Content className="t-sheet" aria-describedby={undefined}>
          <div className="t-sheet__header">
            <Dialog.Title className="t-wordmark">
              Trim<em>ly</em>
            </Dialog.Title>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <ThemeToggle />
              <Dialog.Close asChild>
                <button type="button" className="t-sheet__close" aria-label="Close menu">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </Dialog.Close>
            </div>
          </div>

          <nav className="t-sheet__nav">
            <Link href="/services" onClick={() => setOpen(false)}>Services</Link>
            <Link href="/pricing" onClick={() => setOpen(false)}>Pricing</Link>
            <Link href="/areas" onClick={() => setOpen(false)}>Areas</Link>
            <Link href="/stories" onClick={() => setOpen(false)}>Stories</Link>
            {isLoggedIn ? (
              <>
                <Link href={isOperator ? "/event-types" : "/account"} onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/api/auth/signout" onClick={() => setOpen(false)}>
                  Sign out
                </Link>
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)}>Login</Link>
            )}
          </nav>

          <div className="t-sheet__footer">
            <Link href="/book" className="t-btn t-btn--primary t-btn--lg" style={{ width: "100%", justifyContent: "center" }} onClick={() => setOpen(false)}>
              Book a cut
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
