import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Trimly",
  description: "How Trimly collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <article className="t-legal" style={{ paddingTop: 120 }}>
      <div className="t-container t-container--narrow">
        <p className="t-eyebrow">Legal</p>
        <h1 className="t-section-title">Privacy Policy</h1>
        <p className="t-legal__updated">Last updated: 15 May 2026</p>

        <section>
          <h2>1. Information we collect</h2>
          <p>When you book or create an account, we collect:</p>
          <ul>
            <li>Name, email address, and phone number</li>
            <li>Physical address (for the house-call visit)</li>
            <li>Payment information (processed by Paystack — we never store card details)</li>
            <li>Booking history and preferences</li>
          </ul>
          <p>
            If you sign in with Google, we receive your name and email from your Google account. We do not
            access your Google Calendar unless you explicitly connect it.
          </p>
        </section>

        <section>
          <h2>2. How we use your information</h2>
          <ul>
            <li>To deliver the barber service to your address</li>
            <li>To process payments via Paystack (M-Pesa and card)</li>
            <li>To send booking confirmations and reminders (email, SMS, WhatsApp)</li>
            <li>To manage your subscription and billing cycle</li>
            <li>To improve the service based on booking patterns</li>
          </ul>
        </section>

        <section>
          <h2>3. Payment security</h2>
          <p>
            All payments are processed by <strong>Paystack</strong>, a PCI-DSS Level 1 certified payment
            processor. Card details are tokenised by Paystack and never touch Trimly&rsquo;s servers. M-Pesa
            payments are initiated via STK push through Paystack&rsquo;s mobile money integration.
          </p>
        </section>

        <section>
          <h2>4. Data sharing</h2>
          <p>We share your information only with:</p>
          <ul>
            <li><strong>Paystack</strong> — to process payments</li>
            <li><strong>Africa&rsquo;s Talking</strong> — to send SMS booking confirmations</li>
            <li><strong>Resend</strong> — to send transactional emails</li>
          </ul>
          <p>We do not sell your data to third parties. We do not run advertising trackers.</p>
        </section>

        <section>
          <h2>5. Data retention</h2>
          <p>
            We retain your account and booking data for as long as your account is active. If you request
            account deletion, we remove your personal data within 30 days. Payment records are retained for
            7 years as required by Kenyan tax law.
          </p>
        </section>

        <section>
          <h2>6. Your rights</h2>
          <p>You may at any time:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and data</li>
            <li>Withdraw consent for marketing communications</li>
          </ul>
          <p>
            Contact <a href="mailto:hello@trimly.co.ke">hello@trimly.co.ke</a> to exercise any of these rights.
          </p>
        </section>

        <section>
          <h2>7. Cookies and analytics</h2>
          <p>
            We use PostHog for privacy-friendly analytics. No Google Analytics. No advertising cookies. Session
            data is used solely to improve the booking experience.
          </p>
        </section>

        <section>
          <h2>8. Changes to this policy</h2>
          <p>
            We may update this policy from time to time. Changes take effect when posted on this page.
          </p>
        </section>

        <section>
          <h2>9. Contact</h2>
          <p>
            Data controller: Trimly, Nakuru, Kenya.<br />
            Email: <a href="mailto:hello@trimly.co.ke">hello@trimly.co.ke</a>
          </p>
        </section>

        <div className="t-legal__nav">
          <Link href="/legal/terms">Terms of Service</Link>
          <Link href="/legal/refund-policy">Refund Policy</Link>
        </div>
      </div>
    </article>
  );
}
