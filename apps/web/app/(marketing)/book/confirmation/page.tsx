/**
 * /book/confirmation — booking success screen.
 *
 * Server component. Reads bookingId, reference and method from the query
 * string (set by the wizard after a successful Paystack charge). In the
 * production wire-up this page will also load the persisted booking from
 * Prisma via /api/bookings/[id] to render full details.
 */
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ bookingId?: string; reference?: string; method?: string }>;
}

export const metadata = { title: "Booking confirmed · Trimly" };

export default async function ConfirmationPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const bookingId = sp.bookingId ?? "—";
  const reference = sp.reference ?? "—";
  const method = sp.method === "mpesa" ? "M-Pesa" : sp.method === "card" ? "Card" : "Paystack";
  const waLink = `https://wa.me/254700000000?text=${encodeURIComponent(
    `Hi, booking confirmation for ${bookingId} (${reference}).`
  )}`;

  return (
    <main className="t-confirm">
      <div className="t-confirm__seal" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <p className="t-eyebrow t-eyebrow--accent">Paid · Confirmed</p>
      <h1 className="t-display" style={{ fontSize: "clamp(36px, 4.5vw, 60px)" }}>
        See you at the <em>chair</em>.
      </h1>
      <p className="t-step__intro" style={{ textAlign: "center", margin: 0 }}>
        We&rsquo;ve sent the receipt to your email. The barber will WhatsApp you 15 minutes
        before arrival.
      </p>

      <div className="t-confirm__details">
        <p className="t-eyebrow" style={{ marginBottom: 16 }}>
          Booking
        </p>
        <p className="t-confirm__reference">
          Booking · <code>{bookingId}</code>
        </p>
        <p className="t-confirm__reference" style={{ marginTop: 4 }}>
          {method} reference · <code>{reference}</code>
        </p>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="t-btn t-btn--primary t-btn--lg">
          Save the WhatsApp confirmation
        </a>
        <Link href="/account/upcoming" className="t-btn t-btn--secondary t-btn--lg">
          View my bookings
        </Link>
      </div>
    </main>
  );
}
