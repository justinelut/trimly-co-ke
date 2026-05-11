/**
 * /login — Trimly-styled sign-in page.
 *
 * Server component for the chrome; delegates the form to LoginForm
 * (client component) which calls signIn() programmatically.
 *
 * Signed-in users are redirected to /account/upcoming (or
 * /operator/today for operators) per the same logic on the marketing
 * landing page.
 */
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";

import { LoginForm } from "./_components/LoginForm";

export const metadata = { title: "Sign in · Trimly" };
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

export default async function LoginPage({ searchParams }: PageProps) {
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
        <LoginForm callbackUrl={sp.callbackUrl} initialError={sp.error} />
      </div>

      <p className="t-auth__footer">
        New to Trimly? <Link href="/signup">Create an account</Link>
      </p>
    </main>
  );
}
