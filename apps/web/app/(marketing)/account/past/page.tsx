/**
 * /account/past — completed, cancelled, and no-show bookings.
 */
import { fetchBookings } from "../_lib/account-data";
import { requireCustomer } from "../_lib/require-customer";
import { AccountHeader } from "../_components/AccountHeader";
import { BookingCard } from "../_components/BookingCard";
import { EmptyState } from "../_components/EmptyState";

export const metadata = { title: "Past bookings · Trimly" };
export const dynamic = "force-dynamic";

export default async function PastPage() {
  const customer = await requireCustomer("/account/past");
  const { past } = await fetchBookings(customer.id);

  return (
    <main className="t-dash">
      <AccountHeader customerName={customer.name} current="past" />

      {past.length === 0 ? (
        <EmptyState
          title="No history here yet."
          body="Once we've cut for you, the receipt and details land on this page."
        />
      ) : (
        <div className="t-booking-list">
          {past.map((booking) => (
            <BookingCard key={booking.id} booking={booking} tense="past" />
          ))}
        </div>
      )}
    </main>
  );
}
