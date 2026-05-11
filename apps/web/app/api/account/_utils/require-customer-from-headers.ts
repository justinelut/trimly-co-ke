/**
 * Shared auth check for every /api/account/* route. Returns a discriminated
 * union the caller can branch on without a try/catch — keeps the routes
 * tidy as one-liners against the result.
 *
 * The page-level `requireCustomer()` calls `redirect()` because it's used
 * in server components. This API-level version returns the status code so
 * the route can serialize an HTTP response.
 */
import { cookies, headers } from "next/headers";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";

export type CustomerAuthResult =
  | { ok: true; user: { id: number; email: string } }
  | { ok: false; status: 401 | 403; reason: "unauthenticated" | "no_email" };

export async function requireCustomerFromHeaders(): Promise<CustomerAuthResult> {
  const session = await getServerSession({
    req: buildLegacyRequest(await headers(), await cookies()),
  });
  if (!session?.user?.id) {
    return { ok: false, status: 401, reason: "unauthenticated" };
  }
  if (!session.user.email) {
    // Session present but email is gone — should never happen in cal.diy,
    // but bail rather than guess.
    return { ok: false, status: 403, reason: "no_email" };
  }
  return { ok: true, user: { id: session.user.id, email: session.user.email } };
}
