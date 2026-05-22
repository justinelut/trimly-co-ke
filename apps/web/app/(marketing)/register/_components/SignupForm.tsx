"use client";

/**
 * SignupForm — captures name + email + optional phone, persists via
 * POST /api/auth/trimly-signup, then triggers the magic-link flow.
 *
 * Path:
 *   1. User fills name + email + (optional) phone
 *   2. POST /api/auth/trimly-signup to upsert the User row
 *   3. On success, signIn("email", { email }) to send the magic link
 *   4. Show "check your inbox" state
 *
 * Google sign-up is also available as a one-click alternative.
 */
import { signIn } from "next-auth/react";
import { useState } from "react";

interface Props {
  callbackUrl?: string;
  initialError?: string;
}

export function SignupForm({ callbackUrl, initialError }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(initialError ?? null);

  const target = callbackUrl ?? "/account/upcoming";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("That email doesn't look right.");
      return;
    }

    setStage("submitting");

    try {
      const res = await fetch("/api/auth/trimly-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? data?.error ?? "Could not create account");
      }

      const signInResult = await signIn("email", {
        email: email.toLowerCase().trim(),
        redirect: false,
        callbackUrl: target,
      });
      if (!signInResult || signInResult.error) {
        throw new Error(signInResult?.error ?? "Magic link failed");
      }

      setStage("sent");
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
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
        <p className="t-eyebrow t-eyebrow--accent">Join Trimly</p>
        <h1 className="t-auth__title">
          Create your <em>account</em>.
        </h1>
        <p className="t-auth__body">
          We'll email you a one-tap sign-in link — no password to remember. The link works once and expires in 24 hours.
        </p>
      </div>

      <form className="t-form" onSubmit={handleSubmit} noValidate>
        <div className="t-field">
          <label htmlFor="signup-name">Full name</label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Wanjiku Kamau"
            required
          />
        </div>

        <div className="t-field">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.co.ke"
            required
          />
        </div>

        <div className="t-field">
          <label htmlFor="signup-phone">Phone (optional — for booking confirmations)</label>
          <input
            id="signup-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0712 345 678"
          />
        </div>

        {error ? <p className="t-field__hint t-field__hint--error">{error}</p> : null}

        <button type="submit" className="t-btn t-btn--primary t-btn--lg" disabled={stage === "submitting"}>
          {stage === "submitting" ? "Creating account…" : "Create account"}
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

      <p className="t-auth__footer">
        Prefer a password?{" "}
        <a
          href="/auth/forgot-password"
          style={{ color: "var(--trimly-accent)", cursor: "pointer" }}
          onClick={(e) => {
            e.preventDefault();
            window.location.href = "/auth/forgot-password";
          }}>
          Set one up
        </a>
      </p>
    </>
  );
}
