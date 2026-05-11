/**
 * Compose + send the NextAuth magic-link email.
 *
 * Called by packages/features/auth/lib/sendVerificationRequest.ts, which
 * itself is the EmailProvider callback registered with NextAuth.
 *
 * Returns the send result — the caller can fall back to cal's nodemailer
 * path if Resend isn't configured or the send failed.
 */
import prisma from "@calcom/prisma";

import { sendTransactionalEmail } from "./resend-client";
import type { SendResult } from "./resend-client";
import { MagicLinkEmail } from "./templates/MagicLinkEmail";

export async function notifyMagicLink(input: {
  email: string;
  signInUrl: string;
}): Promise<SendResult> {
  // Heuristic: if a User row already exists with this email we treat it as
  // sign-in; otherwise sign-up. NextAuth's EmailProvider fires the same
  // callback for both, so we infer intent from the DB.
  let intent: "sign_in" | "sign_up" = "sign_in";
  try {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      select: { id: true },
    });
    if (!existing) intent = "sign_up";
  } catch (err) {
    // If the lookup fails, default to sign_in copy — less alarming than
    // greeting a returning customer as new.
    // eslint-disable-next-line no-console
    console.error("[notify-magic-link] user lookup failed; defaulting to sign_in copy", err);
  }

  return sendTransactionalEmail({
    to: { email: input.email },
    subject: intent === "sign_up" ? "Confirm your Trimly account" : "Sign in to Trimly",
    text: [
      `${intent === "sign_up" ? "Confirm your Trimly account" : "Sign in to Trimly"}`,
      ``,
      `Tap the link below to ${intent === "sign_up" ? "finish creating your account" : "sign in"}.`,
      `This link expires in 24 hours and works once.`,
      ``,
      `${input.signInUrl}`,
      ``,
      `If you didn't ask for this, ignore this email — nothing happens.`,
      ``,
      `— Trimly`,
    ].join("\n"),
    tag: intent === "sign_up" ? "magic_link_signup" : "magic_link_signin",
    react: MagicLinkEmail({
      email: input.email,
      signInUrl: input.signInUrl,
      intent,
    }),
  });
}
