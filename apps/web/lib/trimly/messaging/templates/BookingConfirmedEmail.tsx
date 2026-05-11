/**
 * Sent after settle-payment.settleSucceeded() persists a charge.success
 * webhook (or a reconciliation-cron settle) for a one-off booking.
 *
 * Tone: confirmatory, brief, includes the few things the customer needs
 * to reread later — date, time, address, total, reference.
 */
import { Button, Heading, Hr, Section, Text } from "@react-email/components";

import { COLORS, EmailLayout, FONT_DISPLAY } from "./EmailLayout";

interface Props {
  customerName: string;
  serviceName: string;
  durationMin: number;
  scheduledForLocal: string; // already-formatted "Sat 17 May · 10:30"
  addressOneLine: string; // "Karibu Court, Block C · Section 58, Nakuru"
  totalKES: number;
  reference: string;
  manageBookingUrl: string; // https://trimly.co.ke/account/upcoming
  whatsappReplyUrl: string;
}

export function BookingConfirmedEmail(props: Props) {
  const firstName = props.customerName.split(/\s+/)[0];
  return (
    <EmailLayout
      preview={`Confirmed: ${props.serviceName} on ${props.scheduledForLocal}`}
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
        Booking confirmed
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
        See you {props.scheduledForLocal.split(" · ")[0]}, {firstName}.
      </Heading>

      <Text style={{ margin: "0 0 24px", fontSize: "15px", color: COLORS.textSecondary, lineHeight: 1.6 }}>
        Your cut is confirmed. Payment received. The barber will WhatsApp you 15 minutes before arrival —
        no need to do anything before then.
      </Text>

      <Section
        style={{
          background: COLORS.background,
          border: `1px solid ${COLORS.border}`,
          padding: "20px 24px",
          margin: "0 0 24px",
        }}>
        <Row label="Service" value={`${props.serviceName} · ${props.durationMin} min`} />
        <Row label="When" value={props.scheduledForLocal} />
        <Row label="Where" value={props.addressOneLine} />
        <Row label="Total" value={`KES ${props.totalKES.toLocaleString("en-KE")}`} />
        <Row label="Reference" value={props.reference} isLast />
      </Section>

      <Button
        href={props.manageBookingUrl}
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
        View booking
      </Button>

      <Text style={{ margin: "24px 0 0", fontSize: "13px", color: COLORS.textMuted, lineHeight: 1.5 }}>
        Need to cancel or reschedule? You can do both from{" "}
        <span style={{ color: COLORS.accent }}>{new URL(props.manageBookingUrl).host}/account/upcoming</span>{" "}
        — free up to four hours before the appointment.
      </Text>
    </EmailLayout>
  );
}

function Row({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <Section
      style={{
        padding: "8px 0",
        borderBottom: isLast ? undefined : `1px solid ${COLORS.border}`,
      }}>
      <table width="100%" cellPadding={0} cellSpacing={0} border={0}>
        <tr>
          <td
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: COLORS.textMuted,
              width: "30%",
              verticalAlign: "top",
            }}>
            {label}
          </td>
          <td style={{ fontSize: "14px", color: COLORS.textPrimary, textAlign: "right" }}>{value}</td>
        </tr>
      </table>
    </Section>
  );
}
