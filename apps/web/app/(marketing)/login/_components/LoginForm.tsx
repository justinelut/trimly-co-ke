"use client";

/**
 * LoginForm — programmatic NextAuth signIn for the Trimly /login page.
 *
 * Path:
 *   1. Customer types email
 *   2. We call signIn("email", { email, redirect: false, callbackUrl })
 *   3. NextAuth fires our overridden sendVerificationRequest, which sends
 *      the magic link via Resend + MagicLinkEmail
 *   4. We show the "check your inbox" state
 *
 * Google sign-in (if cal has the provider configured) is one button:
 *   signIn("google", { callbackUrl })
 */
import { signIn } from "next-auth/react";
import { useState } from "react";

interface Props {
  callbackUrl?: string;
  initialError?: string;
}

export function LoginForm({ callbackUrl, initialError }: Props) {
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(initialError ?? null);

  const target = callbackUrl ?? "/account/upcoming";

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("That email doesn't look right.");
      return;
    }
    setStage("sending");
    try {
      const result = await signIn("email", {
        email: email.toLowerCase().trim(),
        redirect: false,
        callbackUrl: target,
      });
      if (!result || result.error) {
        throw new Error(result?.error ?? "Sign-in failed");
      }
      setStage("sent");
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Sign-in failed");
    }
  }

  async function signInWithGoogle() {
    await signIn("google", { callbackUrl: target });
  }

  if (stage === "sent") {
    return (
      <div className="t-auth__inbox">
        <div className="t-auth__inbox-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7l8 6 8-6" />
            <rect x="3" y="5" width="18" height="14" rx="2" />
          </svg>
        </div>
        <h1 className="t-auth__title">
          Check your <em>inbox</em>.
        </h1>
        <p className="t-auth__body">
          We sent a sign-in link to <strong style={{ color: "var(--trimly-text-primary)" }}>{email}</strong>. Tap it on
          this device to come back signed in. The link is good for 24 hours.
        </p>
        <button
          type="button"
          className="t-btn t-btn--secondary"
          onClick={() => {
            setStage("idle");
            setEmail("");
          }}>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="t-auth__head">
        <p className="t-eyebrow t-eyebrow--accent">Welcome back</p>
        <h1 className="t-auth__title">
          Sign in to <em>Trimly</em>.
        </h1>
        <p className="t-auth__body">
          We'll email you a one-tap sign-in link — no password to remember. The link works once and expires in 24 hours.
        </p>
      </div>

      <form className="t-form" onSubmit={sendMagicLink} noValidate>
        <div className="t-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.co.ke"
            required
          />
        </div>

        {error ? <p className="t-field__hint t-field__hint--error">{error}</p> : null}

        <button type="submit" className="t-btn t-btn--primary t-btn--lg" disabled={stage === "sending"}>
          {stage === "sending" ? "Sending link…" : "Email me a sign-in link"}
        </button>
      </form>

      <div className="t-auth__divider">or</div>

      <div className="t-auth__alt">
        <button type="button" className="t-auth__alt-btn" onClick={signInWithGoogle}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
            <path fill="#EA4335" d="M12 11v3.6h5.1c-.2 1.3-1.5 3.7-5.1 3.7-3.1 0-5.6-2.6-5.6-5.7s2.5-5.7 5.6-5.7c1.7 0 2.9.7 3.6 1.4l2.5-2.4C16.7 4.3 14.6 3.4 12 3.4 7.2 3.4 3.4 7.2 3.4 12s3.8 8.6 8.6 8.6c5 0 8.3-3.5 8.3-8.4 0-.6-.1-1-.2-1.2H12z" />
          </svg>
          Continue with Google
        </button>
      </div>
    </>
  );
}
