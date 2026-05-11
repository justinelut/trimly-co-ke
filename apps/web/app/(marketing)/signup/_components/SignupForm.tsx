"use client";

/**
 * SignupForm — captures name + email + phone, upserts the User via
 * /api/auth/trimly-signup, then kicks off NextAuth's email magic-link
 * flow so the customer can confirm their email and sign in.
 */
import { signIn } from "next-auth/react";
import { useState } from "react";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("We need a name for the booking.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("That email doesn't look right.");
    if (phone) {
      const stripped = phone.replace(/[\s-]/g, "");
      const ok =
        /^0[17]\d{8}$/.test(stripped) ||
        /^\+254\d{9}$/.test(stripped) ||
        /^254\d{9}$/.test(stripped);
      if (!ok) return setError("Phone should look like 0712 345 678 or +254712345678.");
    }

    setStage("submitting");

    try {
      // 1. Upsert the User with the captured profile fields.
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
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Signup failed (${res.status})`);
      }

      // 2. Trigger the magic link. NextAuth's email provider fires our
      //    overridden sendVerificationRequest → Resend + MagicLinkEmail.
      const result = await signIn("email", {
        email: email.toLowerCase().trim(),
        redirect: false,
        callbackUrl: "/account/upcoming",
      });
      if (!result || result.error) {
        throw new Error(result?.error ?? "Could not send the confirmation email.");
      }

      setStage("sent");
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
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
          One last <em>tap</em>.
        </h1>
        <p className="t-auth__body">
          We sent a confirmation link to <strong style={{ color: "var(--trimly-text-primary)" }}>{email}</strong>. Tap it on
          this device to finish creating your account. The link is good for 24 hours.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="t-auth__head">
        <p className="t-eyebrow t-eyebrow--accent">Create an account</p>
        <h1 className="t-auth__title">
          Get on the <em>roster</em>.
        </h1>
        <p className="t-auth__body">
          No password. We'll email you a one-tap link to confirm. You can book without signing up — but the dashboard,
          subscriptions, and saved payment methods are easier when you have one.
        </p>
      </div>

      <form className="t-form" onSubmit={handleSubmit} noValidate>
        <div className="t-field">
          <label htmlFor="signup-name">Your name</label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
          <label htmlFor="signup-phone">M-Pesa / WhatsApp number (optional)</label>
          <input
            id="signup-phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0712 345 678"
          />
          <span className="t-field__hint">
            We use this for STK prompts during checkout and the 15-min WhatsApp before arrival. You can skip and add it later.
          </span>
        </div>

        {error ? <p className="t-field__hint t-field__hint--error">{error}</p> : null}

        <button type="submit" className="t-btn t-btn--primary t-btn--lg" disabled={stage === "submitting"}>
          {stage === "submitting" ? "Sending confirmation…" : "Create account · email me the link"}
        </button>
      </form>
    </>
  );
}
