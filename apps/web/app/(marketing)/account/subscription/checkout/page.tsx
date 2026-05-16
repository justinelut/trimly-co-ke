/**
 * /account/subscription/checkout?plan=<slug>
 * Full payment page — M-Pesa or Card, same UI as the booking flow.
 */
import { redirect } from "next/navigation";

import prisma from "@calcom/prisma";

import { requireCustomer } from "../../_lib/require-customer";
import { AccountHeader } from "../../_components/AccountHeader";
import { EmptyState } from "../../_components/EmptyState";
import { SubscribeButton } from "../SubscribeButton";

export const metadata = { title: "Checkout · Trimly" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ plan?: string }>;
}

export default async function CheckoutPage({ searchParams }: PageProps) {
  const customer = await requireCustomer("/account/subscription/checkout");
  const sp = await searchParams;

  if (!sp.plan) redirect("/pricing");

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
        <p className="t-eyebrow t-eyebrow--accent">Checkout</p>
        <h2 className="t-section-title" style={{ marginBottom: 8 }}>Trimly {plan.name}</h2>
        <p className="t-step__intro">
          {plan.cutsPerMonth} cuts per month · KES {plan.priceKES.toLocaleString("en-KE")}/mo
        </p>
        <SubscribeButton planSlug={plan.slug} planName={plan.name} priceKES={plan.priceKES} email={customer.email} />
        <p style={{ marginTop: 16, fontSize: 13, color: "var(--trimly-text-muted)" }}>
          M-Pesa: approve the STK prompt on your phone. Card: encrypted on this page — Trimly never sees the number.
        </p>
      </div>
    </main>
  );
}
