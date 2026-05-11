/**
 * /account/payment-methods — saved M-Pesa numbers and tokenised cards.
 *
 * Card "tokens" are Paystack `authorization_code` strings (stored
 * server-side); only the last4 + brand are exposed here. M-Pesa
 * "methods" are just normalised phone numbers we remember.
 */
import Link from "next/link";

import { fetchPaymentMethods } from "../_lib/account-data";
import { requireCustomer } from "../_lib/require-customer";
import { AccountHeader } from "../_components/AccountHeader";
import { EmptyState } from "../_components/EmptyState";
import type { PaymentMethodDto } from "../_lib/account-types";

export const metadata = { title: "Payment methods · Trimly" };
export const dynamic = "force-dynamic";

export default async function PaymentMethodsPage() {
  const customer = await requireCustomer("/account/payment-methods");
  const methods = await fetchPaymentMethods(customer.id);

  return (
    <main className="t-dash">
      <AccountHeader customerName={customer.name} current="payment-methods" />

      {methods.length === 0 ? (
        <EmptyState
          title="No saved payment methods yet."
          body="Your M-Pesa number and any cards you pay with will be remembered after your first successful booking."
          cta={{ label: "Book a cut", href: "/book" }}
        />
      ) : (
        <>
          <div className="t-pm-list">
            {methods.map((pm) => (
              <PaymentMethodRow key={pm.id} method={pm} />
            ))}
          </div>
          <p style={{ marginTop: 32, maxWidth: "60ch", fontSize: 13, color: "var(--trimly-text-muted)", lineHeight: 1.6 }}>
            We never store full card numbers. Cards are tokenised by Paystack; we only retain the
            last four digits, the brand, and an opaque authorisation code we send Paystack on
            subsequent charges. M-Pesa numbers are stored normalised so STK prompts always reach
            you.
          </p>
        </>
      )}
    </main>
  );
}

function PaymentMethodRow({ method }: { method: PaymentMethodDto }) {
  const brandBadge =
    method.kind === "mpesa" ? "M-PESA" : method.brand.slice(0, 4).toUpperCase();
  return (
    <div className="t-pm">
      <span className="t-pm__icon">{brandBadge}</span>
      <div>
        <p className="t-pm__name">
          {method.brand} {method.label}
          {method.isDefault ? <span className="t-pm__default-pill">· Default</span> : null}
        </p>
        <p className="t-pm__sub">
          {method.kind === "mpesa"
            ? "STK prompts go to this number"
            : `Expires ${method.expiry ?? "—"}`}
        </p>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {!method.isDefault ? (
          <Link href={`/api/account/payment-methods/${method.id}/default`} className="t-btn-sm">
            Make default
          </Link>
        ) : null}
        <Link href={`/api/account/payment-methods/${method.id}/remove`} className="t-btn-sm t-btn-sm--danger">
          Remove
        </Link>
      </div>
    </div>
  );
}
