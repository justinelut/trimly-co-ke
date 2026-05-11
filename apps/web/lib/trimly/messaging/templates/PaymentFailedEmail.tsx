/**
 * Sent when a charge.failed webhook (or reconciliation timeout) lands
 * for a booking that was previously in `pending`. Tells the customer
 * what happened and what to do — re-pay link or replies-on-WhatsApp.
 */
import { Button, Heading, Section, Text } from "@react-email/components";

import { COLORS, EmailLayout, FONT_DISPLAY } from "./EmailLayout";

interface Props {
  customerName: string;
  serviceName: string;
  scheduledForLocal: string;
  totalKES: number;
  reason: string; // "STK prompt cancelled" / "Insufficient funds" / etc.
  retryPaymentUrl: string;
  whatsappReplyUrl: string;
}

export function PaymentFailedEmail(props: Props) {
  const firstName = props.customerName.split(/\s+/)[0];
  return (
    <EmailLayout
      preview={`Payment for ${props.serviceName} didn't go through`}
      whatsappReplyUrl={props.whatsappReplyUrl}>
      <Text
        style={{
          margin: "0 0 8px",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#B84A3E",
        }}>
        Payment didn't complete
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
        We need another tap, {firstName}.
      </Heading>

      <Text style={{ margin: "0 0 16px", fontSize: "15px", color: COLORS.textSecondary, lineHeight: 1.6 }}>
        Your payment for{" "}
        <span style={{ color: COLORS.textPrimary }}>{props.serviceName}</span> on{" "}
        <span style={{ color: COLORS.textPrimary }}>{props.scheduledForLocal}</span> didn't go through —
        the gateway said:
      </Text>

      <Section
        style={{
          background: COLORS.background,
          border: `1px solid ${COLORS.border}`,
          borderLeft: `2px solid #B84A3E`,
          padding: "16px 20px",
          margin: "0 0 24px",
        }}>
        <Text style={{ margin: 0, fontSize: "14px", color: COLORS.textSecondary, fontStyle: "italic" }}>
          {props.reason}
        </Text>
      </Section>

      <Text style={{ margin: "0 0 24px", fontSize: "15px", color: COLORS.textSecondary, lineHeight: 1.6 }}>
        The slot is held for the next hour. Try again — or reply on WhatsApp and we'll sort it together.
      </Text>

      <Button
        href={props.retryPaymentUrl}
        style={{
          background: COLORS.accent,
          color: COLORS.background,
          padding: "12px 24px",
          borderRadius: "6px",
          fontWeight: 600,
          fontSize: "14px",
          textDecoration: "none",
          letterSpacing: "0.01em",
        }}>
        Retry · KES {props.totalKES.toLocaleString("en-KE")}
      </Button>
    </EmailLayout>
  );
}
