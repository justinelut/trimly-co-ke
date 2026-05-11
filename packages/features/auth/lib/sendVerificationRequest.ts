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
 *   - Resend (lib/trimly/messaging/notify-magic-link.ts)
 *   - React Email template with the Trimly brand
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

async function sendViaTrimly(params: {
  email: string;
  signInUrl: string;
}): Promise<{ ok: boolean }> {
  if (!process.env.RESEND_API_KEY) return { ok: false };
  try {
    // Dynamic import so this file stays usable for cal.diy contributors
    // who haven't run `yarn install` after the Trimly deps were added.
    const { notifyMagicLink } = await import("@calcom/web/lib/trimly/messaging/notify-magic-link");
    const result = await notifyMagicLink(params);
    return { ok: result.ok };
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
