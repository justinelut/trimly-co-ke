import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy — Trimly",
  description: "Trimly's refund policy for bookings and subscriptions. Full refund within 24 hours if unsatisfied.",
};

export default function RefundPolicyPage() {
  return (
    <article className="t-legal" style={{ paddingTop: 120 }}>
      <div className="t-container t-container--narrow">
        <p className="t-eyebrow">Legal</p>
        <h1 className="t-section-title">Refund Policy</h1>
        <p className="t-legal__updated">Last updated: 15 May 2026</p>

        <section>
          <h2>Our commitment</h2>
          <p>
            If you tell us the cut was off — within 24 hours — we refund in full. No debate, no
            questionnaire, no &ldquo;manager approval.&rdquo; This is unconditional.
          </p>
        </section>

        <section>
          <h2>One-time bookings</h2>
          <table className="t-table t-table--legal">
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Refund</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Unsatisfied with the cut (reported within 24h)</td>
                <td>100% refund</td>
              </tr>
              <tr>
                <td>Cancellation 4+ hours before appointment</td>
                <td>100% refund</td>
              </tr>
              <tr>
                <td>Cancellation under 4 hours (slot not filled)</td>
                <td>50% refund</td>
              </tr>
              <tr>
                <td>No-show</td>
                <td>No refund</td>
              </tr>
              <tr>
                <td>Operator late by 15+ minutes</td>
                <td>50% discount applied automatically</td>
              </tr>
              <tr>
                <td>Operator no-show</td>
                <td>100% refund + next cut free</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Subscriptions</h2>
          <p>
            Cancel any time — no penalty. Service continues until the end of the current billing period.
            We do not offer partial refunds for unused cuts within a billing cycle.
          </p>
          <p>
            If you cancel within the first 7 days of your first subscription cycle and have not used any
            cuts, we refund the full cycle amount.
          </p>
        </section>

        <section>
          <h2>How refunds are processed</h2>
          <table className="t-table t-table--legal">
            <thead>
              <tr>
                <th>Payment method</th>
                <th>Refund timeline</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Card (Visa, Mastercard)</td>
                <td>Instant — processed via Paystack</td>
              </tr>
              <tr>
                <td>M-Pesa</td>
                <td>2 business days — processed via Paystack support</td>
              </tr>
            </tbody>
          </table>
          <p>
            You will receive an email confirmation when the refund is initiated and another when it settles.
          </p>
        </section>

        <section>
          <h2>Disputes</h2>
          <p>
            If you believe a refund was incorrectly denied, email{" "}
            <a href="mailto:hello@trimly.co.ke">hello@trimly.co.ke</a> with your booking reference. We
            respond within 24 hours on business days.
          </p>
        </section>

        <div className="t-legal__nav">
          <Link href="/legal/terms">Terms of Service</Link>
          <Link href="/legal/privacy">Privacy Policy</Link>
        </div>
      </div>
    </article>
  );
}
