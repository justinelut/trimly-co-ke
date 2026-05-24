"use client";

/**
 * MobileStickyCTA — bottom-fixed call-to-action bar shown on phones only.
 *
 * Three actions, in priority order for a barber booking site:
 *   1. Call (tel: link, instant phone dial)
 *   2. WhatsApp (wa.me with prefilled hi message)
 *   3. Book (in-flow booking wizard at /book)
 *
 * Hidden on tablets and up (>=768px) because the desktop header already has
 * a primary "Book a cut" CTA. Slides in from the bottom after first paint to
 * avoid CLS, then stays put.
 *
 * Hidden when the viewer is already on /book or /account/* (booking wizard
 * has its own bottom action; account dashboards aren't conversion surfaces).
 */
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface MobileStickyCTAProps {
  /** E.164 without the + (e.g. "254700000000"). Used for both tel: and wa.me. */
  phoneE164: string;
}

const HIDDEN_PREFIXES = ["/book", "/account", "/auth", "/api"];

export function MobileStickyCTA({ phoneE164 }: MobileStickyCTAProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (pathname && HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const tel = `tel:+${phoneE164}`;
  const wa = `https://wa.me/${phoneE164}?text=${encodeURIComponent("Hi Trimly — I want to book a cut.")}`;

  return (
    <motion.div
      className="t-mobile-cta"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      role="region"
      aria-label="Quick contact and booking">
      <a href={tel} className="t-mobile-cta__btn t-mobile-cta__btn--call" aria-label="Call Trimly">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        <span>Call</span>
      </a>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="t-mobile-cta__btn t-mobile-cta__btn--whatsapp"
        aria-label="Message Trimly on WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488" />
        </svg>
        <span>WhatsApp</span>
      </a>
      <a href="/book" className="t-mobile-cta__btn t-mobile-cta__btn--book" aria-label="Book a cut">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>Book</span>
      </a>
    </motion.div>
  );
}
