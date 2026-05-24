/**
 * /book — Trimly booking wizard.
 *
 * Server component. Renders the page chrome and delegates the multi-step
 * wizard to the BookingWizard client component. We do NOT require an
 * authenticated cal.diy session — Trimly customers can book without
 * signing up first. Customer email/name/phone are collected in Step 4.
 *
 * The route inherits the (marketing) layout: Fraunces font + dark theme +
 * <SiteHeader/>. We do NOT render an inline header here — that would
 * stack a second header on top of the layout's one.
 */
import { BookingWizard } from "./_components/BookingWizard";

export const metadata = {
  title: "Book a cut · Trimly",
  description:
    "Book a Trimly cut in five steps — city, service, time, address, payment. M-Pesa or card. No surprises.",
};

export default function BookPage() {
  return <BookingWizard />;
}
