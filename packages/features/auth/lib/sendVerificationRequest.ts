/**
 * NextAuth EmailProvider verification request callback.
 *
 * REBRANDED FOR TRIMLY. The original cal.diy implementation used Handlebars
 * over packages/emails/templates/confirm-email.html via nodemailer. That
 * still works as a fallback path — if RESEND_API_KEY is unset or the
 * Trimly send fails, we delegate to the legacy nodemailer path so cal's
 * own contributors aren't forced onto Resend.
 *
 * Primary path:
 *   - Direct Resend REST call (no cross-package import; packages/features
 *     must not import from @calcom/web per architecture rules).
 *   - Inline Trimly-branded HTML (warm charcoal + brass).
 *
 * Fallback path:
 *   - cal.diy's original Handlebars + nodemailer (gated on RESEND_API_KEY
 *     being unset OR the Resend send returning ok=false).
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import Handlebars from "handlebars";
import type { SendVerificationRequestParams } from "next-auth/providers/email";
import type { TransportOptions } from "nodemailer";
import nodemailer from "nodemailer";

import { APP_NAME, WEBAPP_URL } from "@calcom/lib/constants";
import { serverConfig } from "@calcom/lib/serverConfig";

const TRIMLY_FROM_EMAIL = process.env.TRIMLY_FROM_EMAIL || "Trimly <hello@trimly.co.ke>";
const TRIMLY_BRAND = {
  name: "Trimly",
  domain: "trimly.co.ke",
  charcoal: "#111110",
  brass: "#C9A96E",
  cream: "#F5F1EA",
  muted: "#6B6B6B",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMagicLinkHtml(params: { signInUrl: string; email: string }): string {
  const safeUrl = escapeHtml(params.signInUrl);
  const safeEmail = escapeHtml(params.email);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sign in to ${TRIMLY_BRAND.name}</title>
  </head>
  <body style="margin:0;padding:0;background:${TRIMLY_BRAND.cream};font-family:'Inter','Helvetica Neue',Arial,sans-serif;color:${TRIMLY_BRAND.charcoal};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${TRIMLY_BRAND.cream};padding:48px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(17,17,16,0.06);">
            <tr>
              <td style="padding:40px 48px 8px 48px;">
                <div style="font-family:'Fraunces','Georgia',serif;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:${TRIMLY_BRAND.charcoal};">${TRIMLY_BRAND.name}</div>
                <div style="margin-top:4px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${TRIMLY_BRAND.brass};">House-call grooming · Nakuru &amp; Nairobi</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 48px 8px 48px;">
                <h1 style="margin:0 0 12px 0;font-family:'Fraunces','Georgia',serif;font-size:30px;line-height:1.2;font-weight:500;color:${TRIMLY_BRAND.charcoal};letter-spacing:-0.01em;">
                  Your sign-in link
                </h1>
                <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:${TRIMLY_BRAND.muted};">
                  Tap the button below to sign in to your Trimly account. This link is valid for 24 hours and can only be used once.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px 0;">
                  <tr>
                    <td style="background:${TRIMLY_BRAND.charcoal};border-radius:999px;">
                      <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;letter-spacing:0.01em;color:#ffffff;text-decoration:none;border-radius:999px;">
                        Sign in to Trimly
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px 0;font-size:13px;line-height:1.6;color:${TRIMLY_BRAND.muted};">
                  Or copy this link into your browser:
                </p>
                <p style="margin:0 0 24px 0;font-size:13px;line-height:1.6;word-break:break-all;color:${TRIMLY_BRAND.charcoal};">
                  <a href="${safeUrl}" style="color:${TRIMLY_BRAND.charcoal};text-decoration:underline;">${safeUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 48px 32px 48px;">
                <hr style="border:none;border-top:1px solid #ECE7DE;margin:8px 0 16px 0;" />
                <p style="margin:0;font-size:12px;line-height:1.6;color:${TRIMLY_BRAND.muted};">
                  This message was sent to <strong style="color:${TRIMLY_BRAND.charcoal};">${safeEmail}</strong>.
                  If you didn't request this, you can safely ignore it &mdash; no account changes will be made.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 48px;background:${TRIMLY_BRAND.charcoal};color:${TRIMLY_BRAND.cream};">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-family:'Fraunces','Georgia',serif;font-size:14px;font-weight:600;color:${TRIMLY_BRAND.brass};letter-spacing:0.04em;">
                      Trimly &middot; ${TRIMLY_BRAND.domain}
                    </td>
                    <td align="right" style="font-size:11px;color:${TRIMLY_BRAND.cream};opacity:0.7;">
                      Premium grooming, brought to your door.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderMagicLinkText(signInUrl: string): string {
  return [
    "Sign in to Trimly",
    "",
    "Tap the link below to sign in to your Trimly account.",
    "This link is valid for 24 hours and can only be used once.",
    "",
    signInUrl,
    "",
    "If you didn't request this, you can safely ignore this email.",
    "",
    "— Trimly · trimly.co.ke",
  ].join("\n");
}

async function sendViaTrimly(params: {
  email: string;
  signInUrl: string;
}): Promise<{ ok: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false };

  try {
    const html = renderMagicLinkHtml({ signInUrl: params.signInUrl, email: params.email });
    const text = renderMagicLinkText(params.signInUrl);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: TRIMLY_FROM_EMAIL,
        to: [params.email],
        subject: "Your Trimly sign-in link",
        html,
        text,
      }),
    });

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error(
        "[sendVerificationRequest] resend non-2xx",
        response.status,
        await response.text().catch(() => "")
      );
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[sendVerificationRequest] trimly send threw; falling back to nodemailer", err);
    return { ok: false };
  }
}

async function sendViaNodemailerFallback(params: {
  identifier: string;
  url: string;
}): Promise<void> {
  const transporter = nodemailer.createTransport<TransportOptions>({
    ...(serverConfig.transport as TransportOptions),
  } as TransportOptions);
  const emailsDir = path.resolve(process.cwd(), "..", "..", "packages/emails", "templates");
  const emailFile = readFileSync(path.join(emailsDir, "confirm-email.html"), { encoding: "utf8" });
  const emailTemplate = Handlebars.compile(emailFile);
  await transporter.sendMail({
    from: `${process.env.EMAIL_FROM}` || APP_NAME,
    to: params.identifier,
    subject: `Your sign-in link for ${APP_NAME}`,
    html: emailTemplate({
      base_url: WEBAPP_URL,
      signin_url: params.url,
      email: params.identifier,
    }),
  });
}

const sendVerificationRequest = async ({
  identifier,
  url,
}: Pick<SendVerificationRequestParams, "identifier" | "url">) => {
  // Normalise the URL host to match the webapp host (cal's original behaviour).
  // Some hosts proxy NextAuth's signin URL through a different origin and the
  // verify endpoint expects the canonical one.
  const originalUrl = new URL(url);
  const webappUrl = new URL(process.env.NEXTAUTH_URL || WEBAPP_URL);
  const finalUrl =
    originalUrl.origin !== webappUrl.origin
      ? url.replace(originalUrl.origin, webappUrl.origin)
      : url;

  const trimly = await sendViaTrimly({ email: identifier, signInUrl: finalUrl });
  if (trimly.ok) return;

  // Fallback to cal's nodemailer template. Still uses APP_NAME for the
  // subject — operators who want a fully Trimly-branded fallback should
  // override APP_NAME in @calcom/lib/constants OR set RESEND_API_KEY so
  // the Trimly path always wins.
  await sendViaNodemailerFallback({ identifier, url: finalUrl });
};

export default sendVerificationRequest;
