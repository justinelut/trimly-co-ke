/**
 * /account/subscription — active subscription OR checkout when ?plan=<slug>.
 */
import Link from "next/link";

import prisma from "@calcom/prisma";

import { fetchSubscription } from "../_lib/account-data";
import { requireCustomer } from "../_lib/require-customer";
import { AccountHeader } from "../_components/AccountHeader";
import { EmptyState } from "../_components/EmptyState";
import { SubscriptionCard } from "../_components/SubscriptionCard";
import { SubscribeButton } from "./SubscribeButton";

export const metadata = { title: "Subscription · Trimly" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ plan?: string; status?: string }>;
}

export default async function SubscriptionPage({ searchParams }: PageProps) {
  const customer = await requireCustomer("/account/subscription");
  const sp = await searchParams;
  const sub = await fetchSubscription(customer.id);

  // Checkout flow: ?plan=<slug> (new subscription or plan change)
  if (sp.plan) {
    const plan = await prisma.trimlyPlan.findUnique({
      where: { slug: sp.plan },
      select: { name: true, slug: true, priceKES: true, cutsPerMonth: true },
    });

    if (!plan) {
      return (
        <main className="t-dash">
          <AccountHeader customerName={customer.name} current="subscription" />
          <EmptyState title="Plan not found." body="That plan doesn't exist." cta={{ label: "See plans", href: "/pricing" }} />
        </main>
      );
    }

    return (
      <main className="t-dash">
        <AccountHeader customerName={customer.name} current="subscription" />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "48px 0" }}>
          <p className="t-eyebrow t-eyebrow--accent">Subscribe</p>
          <h2 className="t-section-title" style={{ marginBottom: 8 }}>Trimly {plan.name}</h2>
          <p className="t-step__intro">{plan.cutsPerMonth} cuts per month · KES {plan.priceKES.toLocaleString("en-KE")}/mo</p>
          <Link
            href={`/account/subscription/checkout?plan=${plan.slug}`}
            className="t-btn t-btn--primary t-btn--lg"
            style={{ width: "100%", justifyContent: "center", marginTop: 24 }}>
            Continue to payment
          </Link>
          <p style={{ marginTop: 16, fontSize: 13, color: "var(--trimly-text-muted)" }}>
            Card subscriptions renew
            automatically. M-Pesa subscriptions require you to approve an STK prompt each cycle.
          </p>
        </div>
      </main>
    );
  }

  // Success return from Paystack
  if (sp.status === "success") {
    return (
      <main className="t-dash">
        <AccountHeader customerName={customer.name} current="subscription" />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "48px 0", textAlign: "center" }}>
          <p className="t-eyebrow t-eyebrow--accent">Welcome aboard</p>
          <h2 className="t-section-title">Subscription active</h2>
          <p className="t-step__intro">Your plan is now active. Book your first cut below.</p>
          <Link href="/book" className="t-btn t-btn--primary" style={{ marginTop: 24 }}>Book a cut</Link>
        </div>
      </main>
    );
  }

  // Default: show current subscription or empty state
  return (
    <main className="t-dash">
      <AccountHeader customerName={customer.name} current="subscription" />
      {sub === null ? (
        <EmptyState
          title="No subscription yet."
          body="Subscribers get a reserved weekly slot and a per-cut rate that beats walking up to any salon in Section 58."
          cta={{ label: "See subscription plans", href: "/pricing" }}
        />
      ) : (
        <>
          <SubscriptionCard sub={sub} />
          <p style={{ marginTop: 32, maxWidth: "60ch", fontSize: 13, color: "var(--trimly-text-muted)", lineHeight: 1.6 }}>
            Cancelling stops the next renewal but leaves your remaining cuts intact through the
            end of the current cycle.{" "}
            <Link href="/pricing" style={{ color: "var(--trimly-accent)" }}>Compare plans →</Link>
          </p>
        </>
      )}
    </main>
  );
}
