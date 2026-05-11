/**
 * Sent by the daily M-Pesa renewal cron after firing the STK push.
 *
 * Per Trimly brief §6.4: M-Pesa subscriptions can't auto-debit (Paystack
 * limitation). The customer needs to approve the STK prompt on their
 * handset; this email gives them a heads-up about what they'll see and
 * confirms the renewal will go through once they approve.
 */
import { Heading, Section, Text } from "@react-email/components";

import { COLORS, EmailLayout, FONT_DISPLAY } from "./EmailLayout";

interface Props {
  customerName: string;
  planName: string;
  amountKES: number;
  reference: string;
  manageSubscriptionUrl: string;
  whatsappReplyUrl: string;
}

export function RenewalPromptEmail(props: Props) {
  const firstName = props.customerName.split(/\s+/)[0];
  return (
    <EmailLayout
      preview={`Approve the M-Pesa prompt to keep your ${props.planName} subscription active`}
      whatsappReplyUrl={props.whatsappReplyUrl}>
      <Text
        style={{
          margin: "0 0 8px",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: COLORS.accent,
        }}>
        Subscription renewal · {props.planName}
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
        Check your phone, {firstName}.
      </Heading>

      <Text style={{ margin: "0 0 24px", fontSize: "15px", color: COLORS.textSecondary, lineHeight: 1.6 }}>
        We just pushed an{" "}
        <span style={{ color: COLORS.textPrimary }}>M-Pesa prompt</span> to your phone for{" "}
        <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>
          KES {props.amountKES.toLocaleString("en-KE")}
        </span>{" "}
        — your <span style={{ color: COLORS.accent }}>{props.planName}</span> subscription's next cycle.
      </Text>

      <Section
        style={{
          background: COLORS.background,
          border: `1px solid ${COLORS.border}`,
          padding: "20px 24px",
          margin: "0 0 24px",
        }}>
        <Text style={{ margin: "0 0 8px", fontSize: "14px", color: COLORS.textPrimary, fontWeight: 600 }}>
          What to do:
        </Text>
        <Text style={{ margin: "0 0 6px", fontSize: "14px", color: COLORS.textSecondary, lineHeight: 1.6 }}>
          1. Open the M-Pesa prompt on your phone (it lands within a minute).
        </Text>
        <Text style={{ margin: "0 0 6px", fontSize: "14px", color: COLORS.textSecondary, lineHeight: 1.6 }}>
          2. Enter your M-Pesa PIN to approve.
        </Text>
        <Text style={{ margin: 0, fontSize: "14px", color: COLORS.textSecondary, lineHeight: 1.6 }}>
          3. You'll get an M-Pesa SMS receipt. Your subscription continues without a break.
        </Text>
      </Section>

      <Text style={{ margin: "0 0 16px", fontSize: "13px", color: COLORS.textMuted, lineHeight: 1.6 }}>
        The prompt is valid for about three minutes (Safaricom's limit). If it expires we'll retry
        tomorrow morning — but you can also tap the button below to retry whenever.
      </Text>
      <Text style={{ margin: 0, fontSize: "12px", color: COLORS.textMuted, lineHeight: 1.5 }}>
        Reference: <span style={{ color: COLORS.textSecondary }}>{props.reference}</span> ·{" "}
        <a
          href={props.manageSubscriptionUrl}
          style={{ color: COLORS.accent, textDecoration: "none" }}>
          Manage subscription →
        </a>
      </Text>
    </EmailLayout>
  );
}
