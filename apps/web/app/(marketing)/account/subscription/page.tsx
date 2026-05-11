/**
 * /account/subscription — the customer's active subscription, with
 * cycle progress, renewal date, and primary actions (cancel, change plan).
 */
import Link from "next/link";

import { fetchSubscription } from "../_lib/account-data";
import { requireCustomer } from "../_lib/require-customer";
import { AccountHeader } from "../_components/AccountHeader";
import { EmptyState } from "../_components/EmptyState";
import { SubscriptionCard } from "../_components/SubscriptionCard";

export const metadata = { title: "Subscription · Trimly" };
export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const customer = await requireCustomer("/account/subscription");
  const sub = await fetchSubscription(customer.id);

  return (
    <main className="t-dash">
      <AccountHeader customerName={customer.name} current="subscription" />

      {sub === null ? (
        <EmptyState
          title="No subscription yet."
          body="Subscribers get a reserved weekly slot and a per-cut rate that beats walking up to any salon in Section 58."
          cta={{ label: "See subscription plans", href: "/#subscriptions" }}
        />
      ) : (
        <>
          <SubscriptionCard sub={sub} />
          <p style={{ marginTop: 32, maxWidth: "60ch", fontSize: 13, color: "var(--trimly-text-muted)", lineHeight: 1.6 }}>
            Cancelling stops the next renewal but leaves your remaining cuts intact through the
            end of the current cycle. Want a different plan?{" "}
            <Link href="/#subscriptions" className="t-eyebrow t-eyebrow--accent" style={{ display: "inline", textTransform: "none", letterSpacing: 0, fontSize: 13 }}>
              Compare plans →
            </Link>
          </p>
        </>
      )}
    </main>
  );
}
