/**
 * Resend client — Trimly's transactional email channel.
 *
 * Uses the official `resend` SDK with React Email components for the
 * bodies. Resend renders the JSX server-side and produces email-client-
 * compatible HTML (Outlook, Gmail, Apple Mail, ProtonMail).
 *
 * FAIL-SOFT: every send is wrapped in try/catch. The webhook handler
 * and cron jobs MUST NOT abort their database work if email fails to
 * send — the customer's payment shouldn't be marked failed because
 * Resend rate-limited us.
 *
 * Cal.diy uses its own nodemailer/SMTP stack for cal-native emails
 * (magic links, password resets). This client is parallel; it never
 * touches cal's email pipeline.
 */
import type { ReactElement } from "react";
import { Resend } from "resend";

let cached: Resend | null = null;

function client(): Resend | null {
  if (cached) return cached;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.error("[email] RESEND_API_KEY is not set — every send will be skipped");
    return null;
  }
  cached = new Resend(apiKey);
  return cached;
}

function resolveFrom(): string {
  return process.env.RESEND_FROM ?? "Trimly <bookings@trimly.co.ke>";
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendInput {
  to: EmailRecipient;
  subject: string;
  /** React Email component instance. Resend renders it server-side. */
  react: ReactElement;
  /** Plain-text fallback. Always include — improves deliverability. */
  text: string;
  /** Tag for tracking in the Resend dashboard. */
  tag?: string;
  /** Optional reply-to override (e.g. the operator's WhatsApp number for replies). */
  replyTo?: string;
}

export interface SendResult {
  ok: boolean;
  resendId?: string;
  error?: string;
  skipped?: "not_configured";
}

/**
 * Send a transactional email. Returns the Resend id on success, or a
 * structured error on failure — never throws.
 */
export async function sendTransactionalEmail(input: SendInput): Promise<SendResult> {
  const resend = client();
  if (!resend) {
    return { ok: false, skipped: "not_configured" };
  }

  try {
    const result = await resend.emails.send({
      from: resolveFrom(),
      to: input.to.name ? [`${input.to.name} <${input.to.email}>`] : [input.to.email],
      subject: input.subject,
      react: input.react,
      text: input.text,
      replyTo: input.replyTo,
      tags: input.tag ? [{ name: "trimly_event", value: input.tag }] : undefined,
    });

    if (result.error) {
      // eslint-disable-next-line no-console
      console.error("[email] resend rejected", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, resendId: result.data?.id };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[email] resend threw", err);
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}
