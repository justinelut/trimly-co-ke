/**
 * /forgot-password — Trimly-branded password reset request page.
 *
 * Posts to Cal.diy's /api/auth/forgot-password endpoint so the
 * existing reset-password machinery (token generation, email send,
 * /auth/forgot-password/[id] flow) works unchanged.
 *
 * Signed-in users are redirected to /account/upcoming.
 */
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";

import { ForgotPasswordForm } from "./_components/ForgotPasswordForm";

export const metadata = { title: "Reset your password · Trimly" };
export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
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
        <ForgotPasswordForm />
      </div>

      <p className="t-auth__footer">
        <Link href="/login">Back to sign in</Link>
      </p>
    </main>
  );
}
