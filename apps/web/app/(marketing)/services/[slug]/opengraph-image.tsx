/**
 * Dynamic OG image for /services/[slug].
 *
 * Renders a 1200×630 PNG with the Trimly brand chrome: warm-charcoal
 * background, brass accent, bone text, Georgia serif (a close-enough
 * fallback for Fraunces — loading the variable Fraunces file in
 * `next/og` is fragile and the OG card displays at thumbnail size in
 * Twitter/WhatsApp/LinkedIn previews anyway).
 *
 * Generated per service slug at build time when generateStaticParams()
 * matches; falls through to runtime for any new slug added later.
 */
import { ImageResponse } from "next/og";

import { SERVICE_CATALOG, formatKES } from "@lib/trimly/pricing";
import type { ServiceSlug } from "@lib/trimly/types";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "Trimly service";

interface Props {
  params: { slug: string };
}

const COLORS = {
  bg: "#111110",
  surface: "#1C1B19",
  border: "#2E2D2A",
  text: "#F0EDE6",
  textMuted: "#A8A39A",
  accent: "#C9A96E",
} as const;

const SERIF = "'Georgia', 'Times New Roman', serif";
const SANS = "-apple-system, system-ui, 'Segoe UI', Roboto, sans-serif";

export default async function Image({ params }: Props) {
  const service = SERVICE_CATALOG[params.slug as ServiceSlug];
  const name = service?.name ?? "Trimly";
  const priceKES = service ? formatKES(service.priceKESNakuru) : "KES 2,000";
  const unit = service?.unit ?? "/ cut";
  const duration = service?.durationMin ?? 45;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: COLORS.bg,
          color: COLORS.text,
          padding: "72px 96px",
          fontFamily: SANS,
        }}>
        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <div style={{ fontFamily: SERIF, fontSize: 36, letterSpacing: -0.5 }}>
            Trim<span style={{ fontStyle: "italic", color: COLORS.accent }}>ly</span>
          </div>
          <div
            style={{
              fontSize: 14,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: COLORS.textMuted,
              fontWeight: 600,
            }}>
            Premium house-call barber · Nakuru · Nairobi
          </div>
        </div>

        {/* Spacer */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* Eyebrow */}
        <div
          style={{
            fontSize: 18,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: COLORS.accent,
            fontWeight: 600,
            marginBottom: 12,
          }}>
          Service · {duration} minutes
        </div>

        {/* Service name */}
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: 124,
            lineHeight: 1.02,
            letterSpacing: -2,
            marginBottom: 32,
            maxWidth: 920,
          }}>
          The{" "}
          <span style={{ fontStyle: "italic", color: COLORS.accent, fontWeight: 400 }}>
            {name.replace(/^The\s+/i, "")}
          </span>
          .
        </div>

        {/* Price strip */}
        <div
          style={{
            display: "flex",
            gap: 32,
            alignItems: "baseline",
            paddingTop: 24,
            borderTop: `1px solid ${COLORS.border}`,
          }}>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 52,
              fontWeight: 600,
              letterSpacing: -1,
            }}>
            {priceKES}
          </div>
          <div style={{ fontSize: 20, color: COLORS.textMuted, letterSpacing: 1 }}>
            {unit} · Nakuru rate
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              fontSize: 16,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: COLORS.textMuted,
              fontWeight: 600,
            }}>
            trimly.co.ke
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
