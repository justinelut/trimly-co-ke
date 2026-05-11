/**
 * Operator auth gate for /api/operator/* routes. Returns a discriminated
 * union (matches the customer-side helper's shape) instead of redirecting,
 * because API routes need to serialize HTTP responses.
 */
import { cookies, headers } from "next/headers";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";

export type OperatorAuthResult =
  | { ok: true; user: { id: number; email: string } }
  | { ok: false; status: 401 | 403; reason: "unauthenticated" | "not_operator" };

function parseAllowedEmails(): Set<string> {
  const raw = process.env.TRIMLY_OPERATOR_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function requireOperatorFromHeaders(): Promise<OperatorAuthResult> {
  const session = await getServerSession({
    req: buildLegacyRequest(await headers(), await cookies()),
  });
  if (!session?.user?.id || !session.user.email) {
    return { ok: false, status: 401, reason: "unauthenticated" };
  }
  const allowed = parseAllowedEmails();
  if (!allowed.has(session.user.email.toLowerCase())) {
    return { ok: false, status: 403, reason: "not_operator" };
  }
  return { ok: true, user: { id: session.user.id, email: session.user.email } };
}
