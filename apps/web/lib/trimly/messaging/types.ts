/**
 * Shared types for the Trimly messaging layer.
 *
 * Channels:
 *   - Resend (transactional email — always on)
 *   - WhatsApp Cloud API (optional, gracefully no-ops if not configured)
 *   - wa.me click-to-chat links (free; embedded in every email's CTA)
 *
 * NO SMS. The user said skip Africa's Talking entirely — WhatsApp links
 * are good enough for arrival pings and reply channels.
 */

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailSendInput {
  to: EmailRecipient;
  /** Subject line. */
  subject: string;
  /** Fully-rendered HTML. */
  html: string;
  /** Plain-text fallback. Always include — improves deliverability. */
  text: string;
  /** Reference tag for tracking in Resend's dashboard. */
  tag?: string;
}

export interface EmailSendResult {
  ok: boolean;
  /** Resend's id, e.g. "re_..." */
  resendId?: string;
  /** Set when ok=false. */
  error?: string;
}

export interface WhatsappPushInput {
  toE164: string; // "254712345678" — no + prefix
  body: string;
}

export interface WhatsappPushResult {
  ok: boolean;
  /** WA Cloud API message id. */
  messageId?: string;
  /** Set if the push was a no-op because WhatsApp is not configured. */
  skipped?: "not_configured";
  error?: string;
}
