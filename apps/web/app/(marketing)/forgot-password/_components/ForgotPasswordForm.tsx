"use client";

/**
 * ForgotPasswordForm — Trimly-styled form that posts to Cal.diy's
 * /api/auth/forgot-password endpoint. The reset email and
 * /auth/forgot-password/[id] reset page are handled by Cal.diy's
 * existing infrastructure.
 */
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("That email doesn't look right.");
      return;
    }

    setStage("loading");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? "Something went wrong");
        setStage("error");
        return;
      }

      setStage("sent");
    } catch {
      setStage("error");
      setError("Something went wrong. Please try again.");
    }
  }

  if (stage === "sent") {
    return (
      <>
        <div className="t-auth__head">
          <p className="t-eyebrow t-eyebrow--accent">Check your inbox</p>
          <h1 className="t-auth__title">
            Reset link <em>sent</em>.
          </h1>
          <p className="t-auth__body">
            If an account exists for <strong style={{ color: "var(--trimly-text-primary)" }}>{email}</strong>,
            we've emailed a reset link. It expires in 6 hours. Check your spam folder if you don't see it.
          </p>
        </div>
        <button
          type="button"
          className="t-btn t-btn--secondary"
          onClick={() => {
            setStage("idle");
            setEmail("");
            setError(null);
          }}>
          Try a different email
        </button>
      </>
    );
  }

  return (
    <>
      <div className="t-auth__head">
        <p className="t-eyebrow t-eyebrow--accent">Password help</p>
        <h1 className="t-auth__title">
          Forgot your <em>password</em>?
        </h1>
        <p className="t-auth__body">
          Enter your email and we'll send a one-time link to reset it. If you usually sign in with a magic
          link, you don't need a password — just use the link from your inbox.
        </p>
      </div>

      <form className="t-form" onSubmit={handleSubmit} noValidate>
        <div className="t-field">
          <label htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.co.ke"
            required
          />
        </div>

        {error ? <p className="t-field__hint t-field__hint--error">{error}</p> : null}

        <button type="submit" className="t-btn t-btn--primary t-btn--lg" disabled={stage === "loading"}>
          {stage === "loading" ? "Sending reset link…" : "Send reset link"}
        </button>
      </form>
    </>
  );
}
