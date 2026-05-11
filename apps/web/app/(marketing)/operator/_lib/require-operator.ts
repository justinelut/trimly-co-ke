/**
 * Operator auth gate — used by every /operator/* server page.
 *
 * Today: matches the signed-in user's email against TRIMLY_OPERATOR_EMAILS
 * (comma-separated list in the trimly-co-ke Kubernetes Secret). This works
 * for a small operator team without a formal role system.
 *
 * Tomorrow: replace with a TrimlyUser.role = "operator" check once the
 * migration adds the role column. The signature of this function does
 * not change — only the body.
 */
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";

export interface OperatorIdentity {
  id: number;
  email: string;
  name: string;
}

function parseAllowedEmails(): Set<string> {
  const raw = process.env.TRIMLY_OPERATOR_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function requireOperator(callbackPath: string = "/operator"): Promise<OperatorIdentity> {
  const session = await getServerSession({
    req: buildLegacyRequest(await headers(), await cookies()),
  });
  if (!session?.user?.id || !session.user.email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  const allowed = parseAllowedEmails();
  if (!allowed.has(session.user.email.toLowerCase())) {
    // The customer's signed in but isn't an operator — bounce them to
    // their own dashboard rather than the login page.
    redirect("/account");
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? session.user.email.split("@")[0],
  };
}
