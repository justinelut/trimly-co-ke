/**
 * Small badge for booking + subscription status. Pure presentational —
 * the label comes from the parent, the colour comes from the variant.
 */
import type { BookingStatusDto, SubscriptionStatusDto } from "../_lib/account-types";

type StatusVariant =
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "no-show"
  | "past-due"
  | "active";

const BOOKING_LABEL: Record<BookingStatusDto, { variant: StatusVariant; text: string }> = {
  confirmed: { variant: "confirmed", text: "Confirmed" },
  in_progress: { variant: "in-progress", text: "In progress" },
  completed: { variant: "completed", text: "Completed" },
  cancelled: { variant: "cancelled", text: "Cancelled" },
  no_show: { variant: "no-show", text: "No-show" },
};

const SUBSCRIPTION_LABEL: Record<SubscriptionStatusDto, { variant: StatusVariant; text: string }> = {
  active: { variant: "active", text: "Active" },
  pending: { variant: "in-progress", text: "Pending" },
  past_due: { variant: "past-due", text: "Past due" },
  cancelled: { variant: "cancelled", text: "Cancelled" },
  non_renewing: { variant: "completed", text: "Not renewing" },
};

export function BookingStatusBadge({ status }: { status: BookingStatusDto }) {
  const cfg = BOOKING_LABEL[status];
  return <span className={`t-badge t-badge--${cfg.variant}`}>{cfg.text}</span>;
}

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatusDto }) {
  const cfg = SUBSCRIPTION_LABEL[status];
  return <span className={`t-badge t-badge--${cfg.variant}`}>{cfg.text}</span>;
}
