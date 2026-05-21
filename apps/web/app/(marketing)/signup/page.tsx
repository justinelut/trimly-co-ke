/**
 * /signup — Trimly-styled registration page.
 *
 * Server component for the chrome; delegates the form to SignupForm
 * (client component) which calls /api/auth/trimly-signup first, then
 * triggers NextAuth's magic-link flow via signIn("email", …).
 *
 * Signed-in users are redirected to /account/upcoming (or
 * /operator/today for operators).
 */
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";

import { SignupForm } from "./_components/SignupForm";

export const metadata = { title: "Create your account · Trimly" };
export const dynamic = "force-dynamic";

function parseOperatorEmails(): Set<string> {
  return new Set(
    (process.env.TRIMLY_OPERATOR_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

interface PageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function SignupPage({ searchParams }: PageProps) {
  const session = await getServerSession({
    req: buildLegacyRequest(await headers(), await cookies()),
  });
  if (session?.user?.id) {
    const email = session.user.email?.toLowerCase();
    if (email && parseOperatorEmails().has(email)) {
      redirect("/operator/today");
    }
    redirect("/account/upcoming");
  }

  const sp = await searchParams;
  return (
    <main className="t-auth">
      <Link href="/" className="t-auth__wordmark">
        Trim<em>ly</em>
      </Link>

      <div className="t-auth__card">
        <SignupForm callbackUrl={sp.callbackUrl} initialError={sp.error} />
      </div>

      <p className="t-auth__footer">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </main>
  );
}
