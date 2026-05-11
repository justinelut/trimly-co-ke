/**
 * Dynamic OG image for /areas/[area].
 * Same chrome as the service OG; emphasises the neighborhood name + city + tier.
 */
import { ImageResponse } from "next/og";

import { findNeighborhoodBySlug } from "@lib/trimly/neighborhoods";
import { SERVICE_CATALOG, formatKES } from "@lib/trimly/pricing";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "Trimly area";

interface Props {
  params: { area: string };
}

const COLORS = {
  bg: "#111110",
  border: "#2E2D2A",
  text: "#F0EDE6",
  textMuted: "#A8A39A",
  accent: "#C9A96E",
} as const;

const SERIF = "'Georgia', 'Times New Roman', serif";
const SANS = "-apple-system, system-ui, 'Segoe UI', Roboto, sans-serif";

export default async function Image({ params }: Props) {
  const n = findNeighborhoodBySlug(params.area);
  const name = n?.name ?? "Trimly";
  const city = n?.city ?? "Nakuru";
  const tierLabel =
    n?.tier === "travel_premium" ? "Travel-premium pricing" : "Standard pricing";
  const fromPrice = formatKES(
    n?.tier === "travel_premium"
      ? SERVICE_CATALOG.beard.priceKESNairobi
      : SERVICE_CATALOG.beard.priceKESNakuru
  );
  const blurb = n?.blurb ?? "Premium house-call barber in Nakuru and Nairobi.";

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
            {city} · {tierLabel}
          </div>
        </div>

        <div style={{ display: "flex", flex: 1 }} />

        <div
          style={{
            fontSize: 18,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: COLORS.accent,
            fontWeight: 600,
            marginBottom: 12,
          }}>
          House call · {city}
        </div>

        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: 116,
            lineHeight: 1.02,
            letterSpacing: -2,
            marginBottom: 24,
            maxWidth: 960,
          }}>
          Trimly comes to{" "}
          <span style={{ fontStyle: "italic", color: COLORS.accent, fontWeight: 400 }}>
            {name}
          </span>
          .
        </div>

        <div
          style={{
            fontSize: 24,
            color: COLORS.textMuted,
            lineHeight: 1.35,
            maxWidth: 760,
            marginBottom: 28,
          }}>
          {blurb}
        </div>

        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "baseline",
            paddingTop: 24,
            borderTop: `1px solid ${COLORS.border}`,
          }}>
          <div style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 600, letterSpacing: -1 }}>
            From {fromPrice}
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
