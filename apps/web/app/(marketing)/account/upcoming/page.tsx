/**
 * /account/upcoming — list of confirmed + in-progress bookings.
 *
 * Per cal's `architecture-page-level-auth.md`, the session check lives
 * in this server component, never in a layout. The data fetch goes
 * through the account-data adapter so the page sees DTOs, never Prisma
 * row types (per `data-dto-boundaries.md`).
 */
import { fetchBookings } from "../_lib/account-data";
import { requireCustomer } from "../_lib/require-customer";
import { AccountHeader } from "../_components/AccountHeader";
import { BookingCard } from "../_components/BookingCard";
import { EmptyState } from "../_components/EmptyState";

export const metadata = { title: "Upcoming bookings · Trimly" };
export const dynamic = "force-dynamic"; // session-scoped — never cache

export default async function UpcomingPage() {
  const customer = await requireCustomer("/account/upcoming");
  const { upcoming } = await fetchBookings(customer.id);

  return (
    <main className="t-dash">
      <AccountHeader customerName={customer.name} current="upcoming" />

      {upcoming.length === 0 ? (
        <EmptyState
          title="No upcoming cuts yet."
          body="When you book your next cut, it'll show up here with a countdown, your address, and a one-tap WhatsApp link."
          cta={{ label: "Book a cut · from KES 2,000", href: "/book" }}
        />
      ) : (
        <div className="t-booking-list">
          {upcoming.map((booking) => (
            <BookingCard key={booking.id} booking={booking} tense="upcoming" />
          ))}
        </div>
      )}
    </main>
  );
}
