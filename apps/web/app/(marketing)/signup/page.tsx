/**
 * /signup — Trimly-styled sign-up page.
 *
 * Path: name + email + (optional) phone → POST /api/auth/trimly-signup
 * (upserts the User and trimlyPhone) → signIn("email") (sends magic link)
 * → "check your inbox" state.
 *
 * Trimly allows anonymous booking, so signup is for customers who want
 * a dashboard before booking — or who came in from a marketing CTA.
 */
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";

import { SignupForm } from "./_components/SignupForm";

export const metadata = { title: "Create an account · Trimly" };
export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const session = await getServerSession({
    req: buildLegacyRequest(await headers(), await cookies()),
  });
  if (session?.user?.id) {
    redirect("/account/upcoming");
  }

  return (
    <main className="t-auth">
      <Link href="/" className="t-auth__wordmark">
        Trim<em>ly</em>
      </Link>

      <div className="t-auth__card">
        <SignupForm />
      </div>

      <p className="t-auth__footer">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </main>
  );
}
