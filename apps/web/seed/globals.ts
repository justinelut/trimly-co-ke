import type { Payload } from "payload";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedGlobals(payload: Payload) {
  // Upload hero image to media collection (stored in R2)
  const heroImagePath = path.resolve(__dirname, "../public/img/hero.jpg");
  let heroMediaId: number | undefined;

  if (fs.existsSync(heroImagePath)) {
    const existing = await payload.find({ collection: "media", where: { alt: { equals: "Hero background" } }, limit: 1 });
    if (existing.docs.length > 0) {
      heroMediaId = existing.docs[0].id as number;
    } else {
      const heroMedia = await payload.create({
        collection: "media",
        data: { alt: "Hero background" },
        filePath: heroImagePath,
      });
      heroMediaId = heroMedia.id as number;
    }
    payload.logger.info(`[seed] hero image media id: ${heroMediaId}`);
  }

  await payload.updateGlobal({
    slug: "hero",
    data: {
      ...(heroMediaId ? { backgroundImage: heroMediaId } : {}),
      eyebrow: "Premium house-call barber · Nakuru · Nairobi by appointment",
      headline: "We come to you. With the right tools, the right ear, the right cut.",
      ctaPrimary: "Book a cut · from KES 2,000",
      ctaSecondary: "See subscriptions",
    },
  });

  await payload.updateGlobal({
    slug: "site-settings",
    data: {
      siteName: "Trimly",
      tagline: "Premium house-call barber",
      whatsappNumber: "254700000000",
      footerDescription: "A house-call barber for premium clients in Nakuru and Nairobi. Built around the cut, the chair you already have, and the half-hour the salon never gives back.",
      metaTitle: "Trimly — Premium house-call barber. Nakuru. Nairobi by appointment.",
      metaDescription: "A house-call barber for premium clients in Nakuru and Nairobi. KES 2,000 in Nakuru. Subscriptions for monthly cuts. M-Pesa or card.",
    },
  });

  await payload.updateGlobal({
    slug: "how-it-works",
    data: {
      eyebrow: "How it works",
      title: "Four steps, no phone calls.",
      lead: "The whole booking moves through your phone. No reception desk, no \"we'll get back to you,\" no waiting list during your lunch break.",
      steps: [
        { number: "01", narrative: "Pick your city — Nakuru for the standard rate, Nairobi for a travel-premium visit. The price is shown before you choose." },
        { number: "02", narrative: "Choose your service and a slot from this week's calendar. Saturday mornings book first." },
        { number: "03", narrative: "Tell us where to find you. Estate, gate, floor. We send a WhatsApp when we're 15 minutes out." },
        { number: "04", narrative: "Pay on your phone — M-Pesa STK or card. Both confirm before we ring the gate." },
      ],
    },
  });

  await payload.updateGlobal({
    slug: "services-section",
    data: {
      eyebrow: "The services",
      title: "Four cuts, no upsells.",
      lead: "Every cut includes line-up, hot-towel finish, and a clean shave-down of the neck. No \"add-on\" fees at the door. Prices below are the Nakuru standard rate. Nairobi visits price separately.",
    },
  });

  await payload.updateGlobal({
    slug: "subscriptions-section",
    data: {
      eyebrow: "Subscriptions",
      title: "A standing reservation, on your terms.",
      lead: "For clients who book the same week every month. You get a reserved seat in the rotation and a per-cut rate that beats walking up to any salon in Section 58. Cancel any time — no penalties, no minimum term.",
      mpesaNote: "Paystack does not support automatic M-Pesa debit. If you subscribe with M-Pesa, you will approve an STK prompt on your phone each cycle. Card subscriptions renew automatically. We will text you the morning of renewal either way.",
      nairobiNote: "Nairobi clients: subscriptions coming once we have a Nairobi-based barber on the roster. For now, individual bookings.",
    },
  });

  await payload.updateGlobal({
    slug: "areas-section",
    data: {
      eyebrow: "Areas served",
      title: "Two cities, two tiers.",
      lead: "Nakuru is the home base — Monday to Saturday, standard pricing. Nairobi runs on selected days, at travel-premium pricing, because the round trip costs the founder half a day.",
      nakuruLabel: "Home base · Standard pricing",
      nakuruMeta: "Where the barber lives, where most weeks are. Service runs Monday through Saturday.",
      nairobiLabel: "Travel visit · Premium pricing",
      nairobiMeta: "A four-to-six hour round trip from Nakuru. Booked on selected days only — we batch trips to keep prices fair.",
      nairobiTip: "Nairobi visits are most economical for households of two or more. Add a second guest at KES 4,500 and split the travel premium between you.",
    },
  });

  await payload.updateGlobal({
    slug: "testimonials-section",
    data: {
      eyebrow: "In their words",
      title: "From the clients in the rotation.",
      lead: "Three real Nakuru and Nairobi clients on what changed when the cut started coming to them. Names and neighborhoods, not avatars.",
    },
  });

  await payload.updateGlobal({
    slug: "faq-section",
    data: {
      eyebrow: "Questions",
      title: "The ones we get asked first.",
      lead: "Nine answers that close the most common loops. If yours isn't here, the WhatsApp link in the footer reaches the founder directly.",
    },
  });

  await payload.updateGlobal({
    slug: "the-standard",
    data: {
      eyebrow: "The standard",
      title: "Six commitments, every visit.",
      lead: "These are the rules the founder writes for himself before each week. Each one is a thing a barbershop usually charges extra for, or quietly drops. We do not.",
      commitments: [
        { statement: "Clippers, scissors and combs are sterilised in barbicide for the full ten-minute cycle before every single client.", detail: "A fresh sealed pouch travels with the chair. You see it opened. If you ever do not, the cut is free." },
        { statement: "A new clipper guard, every visit. Disposable neck strips. A fresh towel per client.", detail: "Cost passes through; the line item never does." },
        { statement: "If we are more than fifteen minutes late, the visit is half-price.", detail: "No \"matatu traffic\" excuses, no rounding the clock. You see the timestamp on the WhatsApp arrival ping." },
        { statement: "An M-Pesa receipt, or a Paystack reference, for every single transaction.", detail: "Itemised on email within the hour. Useful for company-reimbursable visits." },
        { statement: "A refund inside twenty-four hours, no debate, if you tell us the cut was off.", detail: "M-Pesa refunds run through Paystack support and take two business days; cards are instant." },
        { statement: "Quiet by default. We do not make small talk unless you start it.", detail: "For half our clients, the forty-five minutes is the only quiet they get all week. We respect that." },
      ],
    },
  });

  await payload.updateGlobal({
    slug: "closing-cta",
    data: {
      eyebrow: "The next cut",
      headline: "Your next cut shouldn't cost you a Saturday.",
      ctaPrimary: "Book a cut · from KES 2,000",
      ctaSecondary: "WhatsApp the founder",
    },
  });

  await payload.updateGlobal({
    slug: "pricing-page",
    data: {
      metaTitle: "Pricing — Trimly | Premium house-call barber in Nakuru & Nairobi",
      metaDescription: "Trimly pricing: KES 2,000 per cut in Nakuru, KES 5,000 in Nairobi. Monthly subscriptions from KES 3,200. M-Pesa or card.",
      perCutEyebrow: "Per-cut pricing",
      perCutTitle: "Two cities, two tiers. No surprises.",
      perCutLead: "Nakuru is the home base — standard pricing. Nairobi carries a travel premium because the round trip costs half a day. The price is visible before you book.",
    },
  });

  await payload.updateGlobal({
    slug: "services-page",
    data: {
      metaTitle: "Services — Trimly | House-call barber services in Nakuru & Nairobi",
      metaDescription: "Four services, no upsells. Standard cut KES 2,000, executive KES 2,500, beard sculpt KES 1,500, father & son KES 3,500.",
      eyebrow: "The services",
      title: "Four cuts, no upsells.",
      lead: "Every cut includes line-up, hot-towel finish, and a clean shave-down of the neck. No \"add-on\" fees at the door. Prices below are the Nakuru standard rate. Nairobi visits carry a travel premium — shown before you book.",
    },
  });

  await payload.updateGlobal({
    slug: "areas-page",
    data: {
      metaTitle: "Areas — Trimly | Service areas in Nakuru & Nairobi",
      metaDescription: "Trimly serves Nakuru (Section 58, Milimani, Naka, Kiamunyi, Pipeline, Lanet, Bahati) and Nairobi (Westlands, Kilimani, Karen, Lavington, Runda, Kileleshwa).",
      eyebrow: "Areas served",
      title: "Two cities, two tiers.",
      lead: "Nakuru is the home base. Nairobi runs on selected days at travel-premium pricing.",
    },
  });

  payload.logger.info("[seed] all globals seeded");
}
