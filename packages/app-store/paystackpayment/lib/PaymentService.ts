import { v4 as uuidv4 } from "uuid";

import logger from "@calcom/lib/logger";
import prisma from "@calcom/prisma";
import type { Booking, Payment, PaymentOption, Prisma } from "@calcom/prisma/client";
import type { EventTypeMetadata } from "@calcom/prisma/zod-utils";
import type { CalendarEvent } from "@calcom/types/Calendar";
import type { IAbstractPaymentService } from "@calcom/types/PaymentService";

const log = logger.getSubLogger({ prefix: ["payment-service:paystack"] });

const PAYSTACK_BASE = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

class PaystackPaymentService implements IAbstractPaymentService {
  constructor(_credentials: { key: Prisma.JsonValue }) {
    // Paystack uses a single account key — no per-user OAuth credentials needed
  }

  async create(
    payment: Pick<Prisma.PaymentUncheckedCreateInput, "amount" | "currency">,
    bookingId: Booking["id"],
    _userId: Booking["userId"],
    _username: string | null,
    _bookerName: string | null,
    paymentOption: PaymentOption,
    bookerEmail: string,
    _bookerPhoneNumber?: string | null,
    _eventTitle?: string,
    _bookingTitle?: string
  ): Promise<Payment> {
    try {
      // Initialize a Paystack transaction — we don't charge yet.
      // The payment page will collect M-Pesa/Card details and charge via /api/payments/charge.
      const reference = `pay_${uuidv4().replace(/-/g, "").slice(0, 16)}`;

      const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: bookerEmail,
          amount: payment.amount, // already in smallest unit (kobo/cents)
          currency: payment.currency.toUpperCase(),
          reference,
          metadata: { bookingId, source: "cal_event_type" },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.status) {
        log.error("Paystack transaction/initialize failed", json);
        throw new Error("paystack_init_failed");
      }

      const paymentData = await prisma.payment.create({
        data: {
          uid: uuidv4(),
          app: { connect: { slug: "paystack" } },
          booking: { connect: { id: bookingId } },
          amount: payment.amount,
          currency: payment.currency,
          externalId: reference,
          data: { reference, access_code: json.data?.access_code } as unknown as Prisma.InputJsonValue,
          fee: 0,
          refunded: false,
          success: false,
          paymentOption: paymentOption || "ON_BOOKING",
        },
      });

      return paymentData;
    } catch (error) {
      log.error("Paystack: Payment could not be created", bookingId, error);
      throw new Error("payment_not_created_error");
    }
  }

  async collectCard(
    payment: Pick<Prisma.PaymentUncheckedCreateInput, "amount" | "currency">,
    bookingId: Booking["id"],
    paymentOption: PaymentOption,
    bookerEmail: string,
    _bookerPhoneNumber?: string | null
  ): Promise<Payment> {
    // Paystack doesn't support HOLD/SetupIntent pattern — treat as ON_BOOKING
    return this.create(payment, bookingId, null, null, null, paymentOption, bookerEmail);
  }

  async chargeCard(
    payment: Pick<Prisma.PaymentUncheckedCreateInput, "amount" | "currency">,
    bookingId?: Booking["id"]
  ): Promise<Payment> {
    // No-show fee charging — not implemented for Paystack yet
    throw new Error("chargeCard not supported for Paystack");
  }

  async update(paymentId: Payment["id"], data: Partial<Prisma.PaymentUncheckedCreateInput>): Promise<Payment> {
    return prisma.payment.update({ where: { id: paymentId }, data });
  }

  async refund(paymentId: Payment["id"]): Promise<Payment | null> {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || !payment.externalId) return null;

    try {
      const res = await fetch(`${PAYSTACK_BASE}/refund`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transaction: payment.externalId }),
      });

      const json = await res.json();
      if (!res.ok) {
        log.error("Paystack refund failed", json);
        throw new Error("refund_failed");
      }

      return prisma.payment.update({
        where: { id: paymentId },
        data: { refunded: true },
      });
    } catch (error) {
      log.error("Paystack refund error", error);
      throw error;
    }
  }

  async getPaymentPaidStatus(): Promise<string> {
    return "pending";
  }

  async getPaymentDetails(): Promise<Payment> {
    throw new Error("Not implemented");
  }

  async afterPayment(
    _event: CalendarEvent,
    _booking: {
      user: { email: string | null; name: string | null; timeZone: string } | null;
      id: number;
      startTime: { toISOString: () => string };
      uid: string;
    },
    _paymentData: Payment,
    _eventTypeMetadata?: EventTypeMetadata
  ): Promise<void> {
    // No post-payment email scheduling needed — our UI handles confirmation inline
  }

  async deletePayment(paymentId: Payment["id"]): Promise<boolean> {
    try {
      await prisma.payment.delete({ where: { id: paymentId } });
      return true;
    } catch {
      return false;
    }
  }

  isSetupAlready(): boolean {
    return !!process.env.PAYSTACK_SECRET_KEY;
  }
}

export function BuildPaymentService(credentials: { key: Prisma.JsonValue }) {
  return new PaystackPaymentService(credentials);
}

export default PaystackPaymentService;
