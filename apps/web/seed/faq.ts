import type { Payload } from "payload";

export async function seedFAQ(payload: Payload) {
  const data = [
    { question: "How do I book?", answer: "Pick a city, a service, a date, an address, and a payment method — five steps on a single page. The whole flow runs on your phone in about ninety seconds. No phone call, no email back-and-forth.", order: 1 },
    { question: "What does a Nakuru standard cut actually include?", answer: "Forty-five minutes of clipper and scissor work — line-up, fade, taper, and a clean neck shave-down. A hot-towel finish closes every cut. Beard work is included if your beard is part of the cut; full beard sculpting is the Executive service.", order: 2 },
    { question: "Do you bring the chair?", answer: "No. We work from any dining or kitchen chair in your home. A counter or window with daylight helps; we will move things gently into place. The whole setup leaves no trace — we sweep and pack out every visit.", order: 3 },
    { question: "What happens if I need to cancel?", answer: "Free reschedule up to four hours before the appointment. Inside four hours, we charge fifty percent if the slot can't be filled. No-shows are charged in full. Subscribers get one free late cancel per cycle.", order: 4 },
    { question: "How does the M-Pesa payment work?", answer: "We send an STK prompt to your phone via Paystack. You approve it with your M-Pesa PIN — no need to navigate the Lipa Na M-Pesa menu yourself. You receive an M-Pesa SMS receipt as confirmation, plus an emailed line-item receipt within the hour.", order: 5 },
    { question: "Is paying by card secure?", answer: "Yes. Card details are tokenised by Paystack — they never touch Trimly's servers. The form on this site sends an encrypted token to Paystack, who handle PCI-DSS compliance. We see only the last four digits and the card brand on your receipt.", order: 6 },
    { question: "Do you serve outside Nakuru and Nairobi?", answer: "Not yet. Nakuru is the home base; Nairobi is the only travel city. Nakuru-adjacent towns (Naivasha, Gilgil, Eldama Ravine) are case-by-case for executive subscribers — message the founder if you are in one.", order: 7 },
    { question: "Can I put my household on one subscription?", answer: "Yes — the Father & Son service is built for it, and any subscription can be shared between two members of the same household. Add a second profile under your account; we'll alternate the cuts.", order: 8 },
    { question: "What if I don't like the cut?", answer: "Tell the founder before we leave, and we fix it on the spot. Tell us in the next twenty-four hours, and we refund in full. The Standard commitment is unconditional — there's nothing to argue about.", order: 9 },
  ];
  for (const d of data) await payload.create({ collection: "faq", data: { ...d, isActive: true } });
  payload.logger.info(`[seed] ${data.length} FAQ items`);
}
