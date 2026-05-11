/**
 * "Heads up — we're about 15 minutes out." Sent automatically by the
 * arrival-reminders cron 10–20 minutes before each booking's
 * scheduledFor time.
 *
 * Brief: simple, quick, useful. No marketing copy. The customer should
 * be able to look at it, glance at the address one more time, and put
 * the phone down.
 */
import { Heading, Section, Text } from "@react-email/components";

import { COLORS, EmailLayout, FONT_DISPLAY } from "./EmailLayout";

interface Props {
  customerName: string;
  serviceName: string;
  scheduledTimeLocal: string; // "10:30"
  addressOneLine: string;
  estate: string;
  whatsappReplyUrl: string;
}

export function ArrivalReminderEmail(props: Props) {
  const firstName = props.customerName.split(/\s+/)[0];
  return (
    <EmailLayout
      preview={`On the way — ${props.scheduledTimeLocal} · ${props.estate}`}
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
        On the way · ETA {props.scheduledTimeLocal}
      </Text>
      <Heading
        as="h1"
        style={{
          margin: "0 0 16px",
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: "28px",
          lineHeight: 1.1,
          letterSpacing: "-0.01em",
          color: COLORS.textPrimary,
        }}>
        See you in fifteen, {firstName}.
      </Heading>

      <Text style={{ margin: "0 0 24px", fontSize: "15px", color: COLORS.textSecondary, lineHeight: 1.55 }}>
        The barber is leaving the previous stop and will arrive at{" "}
        <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{props.scheduledTimeLocal}</span>.
      </Text>

      <Section
        style={{
          background: COLORS.background,
          border: `1px solid ${COLORS.border}`,
          padding: "16px 20px",
          margin: "0 0 24px",
        }}>
        <Text style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.textMuted }}>
          Address on file
        </Text>
        <Text style={{ margin: 0, fontSize: "14px", color: COLORS.textPrimary, lineHeight: 1.5 }}>
          {props.addressOneLine}
        </Text>
      </Section>

      <Text style={{ margin: 0, fontSize: "13px", color: COLORS.textMuted, lineHeight: 1.55 }}>
        Address change at the last minute? Tap the WhatsApp link in the footer — fastest way to reach the
        barber right now.
      </Text>
    </EmailLayout>
  );
}
