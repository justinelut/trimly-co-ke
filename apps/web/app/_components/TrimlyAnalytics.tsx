/**
 * TrimlyAnalytics — wraps the official @next/third-parties Google components.
 *
 * Mounting strategy:
 *   - If NEXT_PUBLIC_GTM_ID is set, only GTM mounts. Everything (GA, Ads,
 *     Pixel, etc.) should fan out from inside Tag Manager — that's the whole
 *     point of GTM, and double-firing GA4 events with both GTM and a direct
 *     GA snippet is a real footgun.
 *   - Otherwise, if NEXT_PUBLIC_GA_ID is set, the GA4 snippet mounts directly.
 *   - If neither is set (the dev / preview / no-key case), this returns null.
 *     No tracking pixels, no console noise, no third-party requests.
 *
 * @next/third-parties is the officially-supported way to load these on
 * Next.js (esp. on non-Vercel hosts like our K3s box) — it picks the right
 * `next/script` strategy, sets a CSP-friendly nonce when present, and avoids
 * the layout-shift you'd otherwise see from a synchronous gtag snippet.
 */
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";

import process from "node:process";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export function TrimlyAnalytics() {
  if (GTM_ID) {
    return <GoogleTagManager gtmId={GTM_ID} />;
  }
  if (GA_ID) {
    return <GoogleAnalytics gaId={GA_ID} />;
  }
  return null;
}
