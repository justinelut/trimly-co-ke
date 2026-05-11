/**
 * Compose + send the "approve your M-Pesa renewal" email.
 * Called by renewal-service after issuing the STK push.
 */
import prisma from "@calcom/prisma";

import { sendTransactionalEmail } from "./resend-client";
import { RenewalPromptEmail } from "./templates/RenewalPromptEmail";
import { buildClickToChatUrl } from "./whatsapp-client";

export async function notifyRenewalPrompt(input: {
  subscriptionId: string;
  reference: string;
  amountKES: number;
}): Promise<void> {
  const sub = await prisma.trimlySubscription.findUnique({
    where: { id: input.subscriptionId },
    select: {
      id: true,
      plan: { select: { name: true } },
      user: { select: { email: true, name: true } },
    },
  });
  if (!sub || !sub.user.email) {
    // eslint-disable-next-line no-console
    console.warn("[notify-renewal-prompt] sub or user.email not found", input);
    return;
  }

  const webUrl = process.env.NEXT_PUBLIC_WEBAPP_URL ?? "https://trimly.co.ke";
  const customerName = sub.user.name ?? sub.user.email.split("@")[0];

  const result = await sendTransactionalEmail({
    to: { email: sub.user.email, name: customerName },
    subject: `Approve the M-Pesa prompt — your ${sub.plan.name} subscription renews today`,
    text: [
      `Hi ${customerName.split(/\s+/)[0]},`,
      ``,
      `We just pushed an M-Pesa prompt for KES ${input.amountKES.toLocaleString("en-KE")} —`,
      `your ${sub.plan.name} subscription's next cycle.`,
      ``,
      `Approve it on your phone within the next 3 minutes. You'll get an M-Pesa SMS`,
      `receipt; your subscription continues without a break.`,
      ``,
      `Reference: ${input.reference}`,
      `Manage: ${webUrl}/account/subscription`,
      ``,
      `— Trimly`,
    ].join("\n"),
    tag: "renewal_prompt",
    react: RenewalPromptEmail({
      customerName,
      planName: sub.plan.name,
      amountKES: input.amountKES,
      reference: input.reference,
      manageSubscriptionUrl: `${webUrl}/account/subscription`,
      whatsappReplyUrl: buildClickToChatUrl(`Hi, about my ${sub.plan.name} subscription.`),
    }),
  });

  if (!result.ok && !result.skipped) {
    // eslint-disable-next-line no-console
    console.error("[notify-renewal-prompt] send failed", { ...input, error: result.error });
  }
}
