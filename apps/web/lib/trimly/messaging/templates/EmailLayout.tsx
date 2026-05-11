/**
 * Shared chrome for every Trimly transactional email.
 *
 * Constraints:
 *   - Email clients strip <style> tags inconsistently — every rule must
 *     be inline (`style={{...}}`) on the element.
 *   - Outlook on Windows doesn't support modern CSS. React Email's
 *     <Container>/<Section> components emit table-based markup so it
 *     still renders.
 *   - Custom Google fonts often don't load — Fraunces falls back to
 *     Georgia for the display lockup. Body uses system-ui.
 *   - Max width 600px (standard email column).
 *
 * Brand:
 *   - Warm charcoal background, bone text, brass accent. NEVER pure
 *     black or pure white — the same forbidden-color rule as the
 *     web UI.
 */
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

interface EmailLayoutProps {
  /** Short preview snippet (appears next to subject in the inbox list). */
  preview: string;
  children: ReactNode;
  /** Pre-filled wa.me link for the footer reply button. */
  whatsappReplyUrl?: string;
}

const COLORS = {
  background: "#111110",
  surface: "#1C1B19",
  border: "#2E2D2A",
  textPrimary: "#F0EDE6",
  textSecondary: "#A8A39A",
  textMuted: "#6E6A62",
  accent: "#C9A96E",
  accentHover: "#DFC08A",
} as const;

const FONT_DISPLAY = `'Fraunces', Georgia, 'Times New Roman', serif`;
const FONT_SANS = `-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif`;

export function EmailLayout({ preview, children, whatsappReplyUrl }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head>
        {/* Email clients largely ignore <link> tags but it's harmless for Apple Mail + iOS */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          background: COLORS.background,
          color: COLORS.textPrimary,
          fontFamily: FONT_SANS,
          fontSize: "16px",
          lineHeight: 1.55,
          WebkitFontSmoothing: "antialiased",
        }}>
        <Container
          style={{
            margin: "0 auto",
            padding: "32px 24px 56px",
            maxWidth: "600px",
          }}>
          {/* Wordmark */}
          <Section style={{ padding: "8px 0 32px" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: FONT_DISPLAY,
                fontWeight: 800,
                fontSize: "24px",
                letterSpacing: "-0.02em",
                color: COLORS.textPrimary,
              }}>
              Trim
              <span style={{ fontStyle: "italic", fontWeight: 400, color: COLORS.accent }}>ly</span>
            </Text>
          </Section>

          {/* Card */}
          <Section
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              padding: "40px 32px",
            }}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={{ padding: "32px 0 8px" }}>
            <Hr style={{ borderColor: COLORS.border, margin: "0 0 24px" }} />
            <Text
              style={{
                margin: "0 0 16px",
                fontSize: "13px",
                color: COLORS.textMuted,
                lineHeight: 1.5,
              }}>
              Trimly · Premium house-call barber · Nakuru, Kenya
            </Text>
            <Text
              style={{
                margin: "0 0 16px",
                fontSize: "12px",
                color: COLORS.textMuted,
                letterSpacing: "0.04em",
              }}>
              M-Pesa Paybill <strong style={{ color: COLORS.accent, fontWeight: 600 }}>247 247</strong>
              {" · "}
              Account <strong style={{ color: COLORS.accent, fontWeight: 600 }}>TRIMLY</strong>
            </Text>
            {whatsappReplyUrl ? (
              <Text style={{ margin: "0 0 16px", fontSize: "13px", color: COLORS.textSecondary }}>
                Need to reply?{" "}
                <Link href={whatsappReplyUrl} style={{ color: COLORS.accent, textDecoration: "none" }}>
                  Message the founder on WhatsApp →
                </Link>
              </Text>
            ) : null}
            <Text
              style={{
                margin: 0,
                fontSize: "11px",
                color: COLORS.textMuted,
                letterSpacing: "0.02em",
              }}>
              You're receiving this because you booked a cut on{" "}
              <Link href="https://trimly.co.ke" style={{ color: COLORS.textSecondary, textDecoration: "none" }}>
                trimly.co.ke
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/** Branded CTA-button helper for use inside templates. Outlook-safe via React Email. */
export { Button as EmailButton } from "@react-email/components";

export { COLORS, FONT_DISPLAY, FONT_SANS };
