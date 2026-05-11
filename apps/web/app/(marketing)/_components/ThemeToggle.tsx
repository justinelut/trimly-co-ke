"use client";

/**
 * ThemeToggle — flips data-trimly-theme between "dark" and "light" on the
 * marketing wrapper div, and persists the choice in localStorage.
 *
 * We DO NOT touch html or body — Cal's root layout owns those, and Cal's
 * own dark-mode preference lives on html via class="dark". The Trimly theme
 * lives on the marketing wrapper only, so it never collides.
 */
import { useEffect, useState } from "react";

const STORAGE_KEY = "trimly-theme";

export function ThemeToggle() {
  // Initialise from localStorage on the client. Default "dark" until we know.
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      applyTheme(saved);
    } else {
      applyTheme("dark");
    }
  }, []);

  function applyTheme(next: "dark" | "light") {
    // Find the closest ancestor element that owns data-trimly-theme. The
    // marketing layout sets it on the route-group wrapper div.
    const root = document.querySelector<HTMLElement>("[data-trimly-theme]");
    if (root) root.setAttribute("data-trimly-theme", next);
  }

  function onToggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button
      type="button"
      className="t-theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
      {theme === "dark" ? (
        // Moon icon — currently in dark mode, click for light
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        // Sun icon — currently in light mode, click for dark
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )}
    </button>
  );
}
