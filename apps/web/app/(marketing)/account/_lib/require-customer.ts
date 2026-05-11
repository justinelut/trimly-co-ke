/**
 * Shared auth helper for every page under /account/*.
 *
 * Per cal's `architecture-page-level-auth.md` rule, auth checks live in
 * page.tsx — never in layout.tsx — because layouts don't intercept every
 * request path. Each /account/* page imports this and calls it as the
 * first line of its async server component.
 *
 * Behaviour:
 *   - No session → redirect to Trimly /login with callbackUrl=/account
 *     so the customer lands back here after signing in.
 *   - Session present → return { id, email, name }
 */
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";

export interface CustomerIdentity {
  id: number;
  email: string;
  name: string;
}

export async function requireCustomer(callbackPath: string = "/account"): Promise<CustomerIdentity> {
  const session = await getServerSession({
    req: buildLegacyRequest(await headers(), await cookies()),
  });
  if (!session?.user?.id || !session.user.email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? session.user.email.split("@")[0],
  };
}
