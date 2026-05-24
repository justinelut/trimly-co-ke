import { cookies, headers } from "next/headers";
import Link from "next/link";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";

import { buildLegacyRequest } from "@lib/buildLegacyCtx";

import { MobileMenu } from "./MobileMenu";
import { ScrollHeader } from "./ScrollHeader";
import { ThemeToggle } from "./ThemeToggle";
import process from "node:process";

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

  const isLoggedIn = !!session?.user;
  const isOperator = isLoggedIn && parseOperatorEmails().has(session.user.email?.toLowerCase() ?? "");

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
        {isLoggedIn ? (
          <>
            <Link href={isOperator ? "/event-types" : "/account"}>Dashboard</Link>
            <Link href="/api/auth/signout">Sign out</Link>
          </>
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
      <MobileMenu isLoggedIn={isLoggedIn} isOperator={isOperator} />
    </ScrollHeader>
  );
}
