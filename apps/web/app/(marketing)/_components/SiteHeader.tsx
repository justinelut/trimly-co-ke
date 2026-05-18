import { cookies, headers } from "next/headers";
import Link from "next/link";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";

import { buildLegacyRequest } from "@lib/buildLegacyCtx";

import { ScrollHeader } from "./ScrollHeader";
import { ThemeToggle } from "./ThemeToggle";

function parseOperatorEmails(): Set<string> {
  return new Set(
    (process.env.TRIMLY_OPERATOR_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function SiteHeader() {
  const session = await getServerSession({
    req: buildLegacyRequest(await headers(), await cookies()),
  });

  return (
    <ScrollHeader>
      <Link href="/" className="t-wordmark">
        Trim<em>ly</em>
      </Link>
      <nav className="t-nav" aria-label="Primary">
        <Link href="/services">Services</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/areas">Areas</Link>
        <Link href="/stories">Stories</Link>
        {session?.user ? (
          <Link href={parseOperatorEmails().has(session.user.email?.toLowerCase() ?? "") ? "/event-types" : "/account"}>
            Dashboard
          </Link>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </nav>
      <div className="t-header__cta">
        <ThemeToggle />
        <Link href="/book" className="t-btn t-btn--primary">
          Book a cut
        </Link>
      </div>
    </ScrollHeader>
  );
}
