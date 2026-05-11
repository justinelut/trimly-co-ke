"use client";

/**
 * BookingWizard — top-level client component that orchestrates the
 * five-step booking flow. Owns the draft state; each step is a pure
 * presentational component that reports back via callbacks.
 *
 * The wizard is a controlled state machine: `step` is the only piece
 * of routing-like state and is mirrored to the URL so the browser's
 * back/forward arrows work as the customer expects.
 *
 * On Step 4 submit:
 *   POST /api/bookings/create → receives a bookingId
 * On Step 5 success:
 *   navigates to /book/confirmation with the reference + bookingId
 */
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { SERVICE_CATALOG } from "@lib/trimly/pricing";
import type { BookingAddress, City, ServiceSlug } from "@lib/trimly/types";

import { BookingSummary } from "./BookingSummary";
import { StepAddress } from "./StepAddress";
import { StepCity } from "./StepCity";
import { StepPayment } from "./StepPayment";
import { StepService } from "./StepService";
import { StepSlot } from "./StepSlot";
import { StepsRail } from "./StepsRail";
import type { StepKey } from "./StepsRail";

interface CustomerDraft {
  email: string;
  name: string;
  phone: string;
}

const STEP_ORDER: StepKey[] = ["city", "service", "slot", "address", "payment"];

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
function formatSlotLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function BookingWizard() {
  const router = useRouter();
  const params = useSearchParams();

  // Read step from URL on mount, default to "city". `useSearchParams()`
  // can return null on the first render of a dynamic page; treat that as
  // "no step" rather than letting the call crash.
  const initialStep = (params?.get("step") as StepKey | null) ?? "city";
  const [step, setStep] = useState<StepKey>(
    STEP_ORDER.includes(initialStep) ? initialStep : "city"
  );

  const [city, setCity] = useState<City | undefined>();
  const [serviceSlug, setServiceSlug] = useState<ServiceSlug | undefined>();
  const [scheduledFor, setScheduledFor] = useState<string | undefined>();
  const [address, setAddress] = useState<BookingAddress | undefined>();
  const [customer, setCustomer] = useState<CustomerDraft | undefined>();

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Keep URL in sync with the step (no scroll).
  useEffect(() => {
    const next = new URLSearchParams(params?.toString() ?? "");
    next.set("step", step);
    router.replace(`/book?${next.toString()}`, { scroll: false });
    // params is intentionally omitted from deps — we drive URL from step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, router]);

  // Forbid skipping ahead with stale state (e.g. user lands at /book?step=payment
  // without picking a city — bump them back).
  useEffect(() => {
    if (step === "service" && !city) setStep("city");
    if (step === "slot" && (!city || !serviceSlug)) setStep(city ? "service" : "city");
    if (step === "address" && (!city || !serviceSlug || !scheduledFor)) {
      setStep(city ? (serviceSlug ? "slot" : "service") : "city");
    }
    if (step === "payment" && (!city || !serviceSlug || !scheduledFor || !address || !customer)) {
      setStep(address ? "address" : scheduledFor ? "address" : serviceSlug ? "slot" : city ? "service" : "city");
    }
  }, [step, city, serviceSlug, scheduledFor, address, customer]);

  const totalKES = useMemo(() => {
    if (!city || !serviceSlug) return undefined;
    const s = SERVICE_CATALOG[serviceSlug];
    return city === "Nakuru" ? s.priceKESNakuru : s.priceKESNairobi;
  }, [city, serviceSlug]);

  const serviceMeta = serviceSlug ? SERVICE_CATALOG[serviceSlug] : undefined;
  const addressOneLine = address
    ? [address.addressLine1, address.estate].filter(Boolean).join(" · ")
    : undefined;

  function back() {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  }

  async function submitAddressAndCreate(addr: BookingAddress, cust: CustomerDraft) {
    if (!city || !serviceSlug || !scheduledFor) return;
    setAddress(addr);
    setCustomer(cust);
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceSlug,
          city,
          scheduledFor,
          address: addr,
          customer: cust,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message ?? `Booking creation failed (${res.status})`);
      }
      const data = (await res.json()) as { bookingId: string };
      setBookingId(data.bookingId);
      setStep("payment");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not create the booking.");
    } finally {
      setCreating(false);
    }
  }

  function onPaymentSucceeded(reference: string, method: "mpesa" | "card") {
    if (!bookingId) return;
    const qs = new URLSearchParams({ bookingId, reference, method });
    router.push(`/book/confirmation?${qs.toString()}`);
  }

  return (
    <div className="t-wizard">
      <div>
        <StepsRail current={step} />

        {step === "city" ? (
          <StepCity
            value={city}
            onSelect={(c) => {
              setCity(c);
              setServiceSlug(undefined); // reprice
              setStep("service");
            }}
          />
        ) : null}

        {step === "service" && city ? (
          <StepService
            city={city}
            value={serviceSlug}
            onSelect={(s) => {
              setServiceSlug(s);
              setStep("slot");
            }}
          />
        ) : null}

        {step === "slot" && city ? (
          <StepSlot
            city={city}
            value={scheduledFor}
            onSelect={(iso) => {
              setScheduledFor(iso);
              setStep("address");
            }}
          />
        ) : null}

        {step === "address" && city ? (
          <>
            <StepAddress
              city={city}
              address={address}
              customer={customer}
              onSubmit={submitAddressAndCreate}
            />
            {creating ? (
              <p className="t-field__hint" style={{ marginTop: 12 }}>
                Reserving your slot…
              </p>
            ) : null}
            {createError ? (
              <p className="t-field__hint t-field__hint--error" style={{ marginTop: 12 }}>
                {createError}
              </p>
            ) : null}
          </>
        ) : null}

        {step === "payment" && city && serviceSlug && customer && bookingId && totalKES ? (
          <StepPayment
            bookingId={bookingId}
            serviceSlug={serviceSlug}
            city={city}
            email={customer.email}
            phone={customer.phone}
            amountKES={totalKES}
            onSucceeded={onPaymentSucceeded}
          />
        ) : null}

        {step !== "city" ? (
          <div className="t-step__actions" style={{ marginTop: 24 }}>
            <button type="button" className="t-step__back" onClick={back}>
              Back
            </button>
          </div>
        ) : null}
      </div>

      <BookingSummary
        city={city}
        serviceName={serviceMeta?.name}
        durationMin={serviceMeta?.durationMin}
        dateLabel={scheduledFor ? formatDateLabel(scheduledFor) : undefined}
        slotLabel={scheduledFor ? formatSlotLabel(scheduledFor) : undefined}
        addressOneLine={addressOneLine}
        totalKES={totalKES}
      />
    </div>
  );
}
