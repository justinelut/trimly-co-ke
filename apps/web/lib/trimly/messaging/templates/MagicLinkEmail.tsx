/**
 * Magic-link sign-in email. Replaces cal.diy's confirm-email.html.
 *
 * Sent by sendVerificationRequest.ts (in packages/features/auth/lib) when
 * NextAuth fires its Email provider during sign-in or sign-up. The link
 * URL is built by NextAuth and contains a single-use verification token.
 */
import { Button, Heading, Hr, Section, Text } from "@react-email/components";

import { COLORS, EmailLayout, FONT_DISPLAY } from "./EmailLayout";

interface Props {
  email: string;
  signInUrl: string;
  /** "Sign in" or "Sign up — finishing your account" — tone shifts slightly */
  intent: "sign_in" | "sign_up";
}

export function MagicLinkEmail({ email, signInUrl, intent }: Props) {
  const isSignup = intent === "sign_up";
  return (
    <EmailLayout preview={isSignup ? "Finish creating your Trimly account" : "Sign in to Trimly"}>
      <Text
        style={{
          margin: "0 0 8px",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: COLORS.accent,
        }}>
        {isSignup ? "Welcome to Trimly" : "Sign in"}
      </Text>
      <Heading
        as="h1"
        style={{
          margin: "0 0 24px",
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: "28px",
          lineHeight: 1.1,
          letterSpacing: "-0.01em",
          color: COLORS.textPrimary,
        }}>
        {isSignup ? (
          <>
            Confirm your <span style={{ fontStyle: "italic", fontWeight: 400, color: COLORS.accent }}>email</span>.
          </>
        ) : (
          <>
            One tap and you're <span style={{ fontStyle: "italic", fontWeight: 400, color: COLORS.accent }}>in</span>.
          </>
        )}
      </Heading>

      <Text style={{ margin: "0 0 24px", fontSize: "15px", color: COLORS.textSecondary, lineHeight: 1.6 }}>
        {isSignup
          ? "Tap the button below to finish creating your Trimly account. This link expires in 24 hours and works once."
          : "Tap the button below to sign in. This link expires in 24 hours and works once. If you didn't ask for it, you can ignore this email — nothing happens."}
      </Text>

      <Button
        href={signInUrl}
        style={{
          background: COLORS.accent,
          color: COLORS.background,
          padding: "14px 28px",
          borderRadius: "6px",
          fontWeight: 600,
          fontSize: "14px",
          textDecoration: "none",
          letterSpacing: "0.01em",
        }}>
        {isSignup ? "Confirm and sign in" : "Sign in to Trimly"}
      </Button>

      <Hr style={{ borderColor: COLORS.border, margin: "32px 0 24px" }} />

      <Text style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.textMuted }}>
        Or copy this link
      </Text>
      <Text
        style={{
          margin: "0 0 24px",
          fontSize: "13px",
          color: COLORS.textSecondary,
          fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
          wordBreak: "break-all",
          background: COLORS.background,
          border: `1px solid ${COLORS.border}`,
          padding: "12px 14px",
        }}>
        {signInUrl}
      </Text>

      <Text style={{ margin: 0, fontSize: "12px", color: COLORS.textMuted, lineHeight: 1.5 }}>
        Sent to <span style={{ color: COLORS.textSecondary }}>{email}</span>. If that wasn't you, ignore this
        message — no account changes happen until the link is clicked.
      </Text>
    </EmailLayout>
  );
}
