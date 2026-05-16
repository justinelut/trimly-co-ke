"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { City, ServiceSlug } from "@lib/trimly/types";

interface BookingAddress {
  estate: string;
  addressLine1: string;
  addressLine2?: string;
  notes?: string;
}

interface BookingState {
  // Step data
  city?: City;
  serviceSlug?: ServiceSlug;
  scheduledFor?: string; // ISO datetime
  address?: BookingAddress;
  // Auth
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
  name?: string;
  phone?: string;
  // Booking result
  bookingId?: string;
  calBookingUid?: string;
  // Actions
  setCity: (city: City) => void;
  setService: (slug: ServiceSlug) => void;
  setSlot: (iso: string) => void;
  setAddress: (address: BookingAddress) => void;
  setAuth: (data: { userId: string; email: string; name: string; phone?: string }) => void;
  setBookingResult: (data: { bookingId: string; calBookingUid?: string }) => void;
  reset: () => void;
}

const initialState = {
  city: undefined,
  serviceSlug: undefined,
  scheduledFor: undefined,
  address: undefined,
  isAuthenticated: false,
  userId: undefined,
  email: undefined,
  name: undefined,
  phone: undefined,
  bookingId: undefined,
  calBookingUid: undefined,
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      ...initialState,
      setCity: (city) => set({ city, serviceSlug: undefined, scheduledFor: undefined }),
      setService: (serviceSlug) => set({ serviceSlug, scheduledFor: undefined }),
      setSlot: (scheduledFor) => set({ scheduledFor }),
      setAddress: (address) => set({ address }),
      setAuth: (data) => set({ isAuthenticated: true, ...data }),
      setBookingResult: (data) => set(data),
      reset: () => set(initialState),
    }),
    { name: "trimly-booking" }
  )
);
