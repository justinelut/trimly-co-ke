import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Trimly",
  description: "Terms of service for Trimly, a premium house-call barber service in Nakuru and Nairobi, Kenya.",
};

export default function TermsPage() {
  return (
    <article className="t-legal" style={{ paddingTop: 120 }}>
      <div className="t-container t-container--narrow">
        <p className="t-eyebrow">Legal</p>
        <h1 className="t-section-title">Terms of Service</h1>
        <p className="t-legal__updated">Last updated: 15 May 2026</p>

        <section>
          <h2>1. Service overview</h2>
          <p>
            Trimly (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;) operates a premium house-call barber
            service in Nakuru and Nairobi, Kenya. By booking through trimly.co.ke you agree to these terms.
          </p>
        </section>

        <section>
          <h2>2. Booking and payment</h2>
          <p>
            All payments are processed through Paystack. We accept M-Pesa (via STK push) and card payments.
            Prices are displayed in Kenya Shillings (KES) and include all applicable fees. The price shown at
            the city-selection step is the final price — no hidden surcharges.
          </p>
          <p>
            Nairobi bookings carry a travel-premium price clearly displayed before you confirm. This reflects
            the 4–6 hour round trip from Nakuru.
          </p>
        </section>

        <section>
          <h2>3. Cancellation and rescheduling</h2>
          <p>
            Free reschedule up to 4 hours before your appointment. Cancellations inside 4 hours are charged
            50% if the slot cannot be filled. No-shows are charged in full. Subscribers receive one free late
            cancellation per billing cycle.
          </p>
        </section>

        <section>
          <h2>4. Refunds</h2>
          <p>
            If you are unsatisfied with the service, notify us within 24 hours for a full refund. Card refunds
            are processed immediately. M-Pesa refunds are processed through Paystack support and take up to 2
            business days.
          </p>
        </section>

        <section>
          <h2>5. Subscriptions</h2>
          <p>
            Subscriptions are billed monthly or annually. Card subscriptions renew automatically. M-Pesa
            subscriptions require you to approve an STK prompt each cycle — we cannot auto-debit M-Pesa.
            Cancel any time with no penalty; service continues until the end of the current billing period.
          </p>
        </section>

        <section>
          <h2>6. Your account</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. You may sign
            in with Google or email. We store your name, email, and phone number to deliver the service.
          </p>
        </section>

        <section>
          <h2>7. Service availability</h2>
          <p>
            We serve Nakuru (Monday–Saturday) and Nairobi (selected days only). Availability is subject to
            the operator&rsquo;s schedule. We reserve the right to block dates for personal leave or public
            holidays.
          </p>
        </section>

        <section>
          <h2>8. Limitation of liability</h2>
          <p>
            Trimly provides a personal grooming service. We are not liable for any indirect, incidental, or
            consequential damages. Our total liability is limited to the amount paid for the specific service
            in question.
          </p>
        </section>

        <section>
          <h2>9. Changes to terms</h2>
          <p>
            We may update these terms from time to time. Changes take effect when posted on this page. Continued
            use of the service constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2>10. Contact</h2>
          <p>
            Questions about these terms? Reach us at{" "}
            <a href="mailto:hello@trimly.co.ke">hello@trimly.co.ke</a> or via the WhatsApp link on our homepage.
          </p>
        </section>

        <div className="t-legal__nav">
          <Link href="/legal/privacy">Privacy Policy</Link>
          <Link href="/legal/refund-policy">Refund Policy</Link>
        </div>
      </div>
    </article>
  );
}
