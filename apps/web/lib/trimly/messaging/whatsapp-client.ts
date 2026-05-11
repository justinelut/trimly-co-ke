/**
 * WhatsApp helpers.
 *
 * Two modes:
 *   1. `buildClickToChatUrl()` — a wa.me URL the customer taps to open
 *      WhatsApp pre-filled with a message. Free, no API, no setup.
 *      Embedded in every email's CTA.
 *
 *   2. `pushWhatsapp()` — direct push via the WhatsApp Cloud API.
 *      Optional. Activates ONLY when WHATSAPP_CLOUD_API_TOKEN AND
 *      WHATSAPP_BUSINESS_NUMBER_ID are set in the environment. Without
 *      those, it returns `{ ok: true, skipped: "not_configured" }` so
 *      the caller can chain it safely.
 *
 * WhatsApp Cloud API free tier: 1,000 service conversations per month.
 * Beyond that it's per-conversation pricing. Setup requires Meta Business
 * verification + a registered WhatsApp Business number + pre-approved
 * templates. Until that's done, all WhatsApp notifications fall back
 * to the wa.me link inside the email.
 */
import type { WhatsappPushInput, WhatsappPushResult } from "./types";

/**
 * The operator's WhatsApp number, used to build wa.me links FROM the
 * customer TO the founder. Stored as an E.164 without the leading "+".
 * Default matches the placeholder used elsewhere (254700000000).
 */
function operatorWhatsappE164(): string {
  return process.env.TRIMLY_WHATSAPP_NUMBER ?? "254700000000";
}

/**
 * Build a wa.me link the customer taps to open WhatsApp with a pre-filled
 * message to the operator. Free, no API, no setup. Customer must initiate.
 */
export function buildClickToChatUrl(prefilledText: string): string {
  return `https://wa.me/${operatorWhatsappE164()}?text=${encodeURIComponent(prefilledText)}`;
}

/**
 * Build a wa.me link the OPERATOR taps to open WhatsApp with a pre-filled
 * message to a specific CUSTOMER. The operator-side "15-min on-the-way"
 * ping uses this. The customer's normalised "0712..." phone is converted
 * to E.164 here.
 */
export function buildClickToChatUrlForCustomer(
  customerNormalisedPhone: string,
  prefilledText: string
): string {
  // "0712345678" → "254712345678"
  const e164 = customerNormalisedPhone.startsWith("0")
    ? `254${customerNormalisedPhone.slice(1)}`
    : customerNormalisedPhone;
  return `https://wa.me/${e164}?text=${encodeURIComponent(prefilledText)}`;
}

/**
 * Optional WhatsApp Cloud API push. Gracefully no-ops when not configured.
 *
 * Cloud API docs:
 *   https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
 *
 * Note: Cloud API push messages MUST be either:
 *   - A reply within a 24-hour service window (free), OR
 *   - A pre-approved template message (counts against the monthly quota)
 *
 * Free-form `text` messages outside the service window fail. For arrival
 * reminders + renewal prompts (initiated by us), use approved templates.
 * For now this function sends a plain text body — works inside the 24-h
 * service window when the customer has WhatsApp'd us first. Outside the
 * window the message is rejected; we log and continue (email is the
 * primary channel anyway).
 */
export async function pushWhatsapp(input: WhatsappPushInput): Promise<WhatsappPushResult> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const numberId = process.env.WHATSAPP_BUSINESS_NUMBER_ID;
  if (!token || !numberId) {
    return { ok: true, skipped: "not_configured" };
  }

  const url = `https://graph.facebook.com/v18.0/${numberId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to: input.toE164,
    type: "text",
    text: { body: input.body },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errBody = await res.text();
      // eslint-disable-next-line no-console
      console.error("[whatsapp] cloud api rejected", { status: res.status, body: errBody });
      return { ok: false, error: `whatsapp_${res.status}` };
    }
    const json = (await res.json()) as { messages?: Array<{ id: string }> };
    return { ok: true, messageId: json.messages?.[0]?.id };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[whatsapp] cloud api network error", err);
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

/**
 * Customer's "0712345678" → E.164 without the "+". Used by pushWhatsapp callers.
 */
export function customerPhoneToE164(normalised: string): string {
  return normalised.startsWith("0") ? `254${normalised.slice(1)}` : normalised;
}
