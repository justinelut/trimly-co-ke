import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import path from "path";
import { fileURLToPath } from "url";

import type { CollectionConfig, GlobalConfig } from "payload";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// ─── Collections ───

const PayloadUsers: CollectionConfig = {
  slug: "payload-users",
  auth: true,
  admin: { useAsTitle: "email" },
  fields: [
    { name: "name", type: "text" },
    { name: "role", type: "select", options: ["admin", "editor"], defaultValue: "editor" },
  ],
};

const Media: CollectionConfig = {
  slug: "media",
  upload: { staticDir: path.resolve(dirname, "media"), mimeTypes: ["image/*"] },
  fields: [{ name: "alt", type: "text", required: true }],
};

const Services: CollectionConfig = {
  slug: "services",
  admin: { useAsTitle: "name" },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    { name: "description", type: "textarea", required: true },
    { name: "duration", type: "text", required: true },
    { name: "priceNakuru", type: "number", required: true, label: "Price KES (Nakuru)" },
    { name: "priceNairobi", type: "number", required: true, label: "Price KES (Nairobi)" },
    { name: "unit", type: "text", defaultValue: "/ cut" },
    { name: "iconPath", type: "text", admin: { description: "SVG path d attribute" } },
    { name: "isActive", type: "checkbox", defaultValue: true },
    { name: "order", type: "number", defaultValue: 0 },
  ],
};

const Plans: CollectionConfig = {
  slug: "plans",
  admin: { useAsTitle: "name" },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "tagline", type: "text", required: true },
    { name: "monthlyPrice", type: "number", required: true, label: "Monthly KES" },
    { name: "yearlyPrice", type: "number", required: true, label: "Yearly KES" },
    { name: "monthlyWas", type: "number", label: "Monthly was KES" },
    { name: "yearlyWas", type: "number", label: "Yearly was KES" },
    { name: "features", type: "array", fields: [{ name: "feature", type: "text", required: true }] },
    { name: "ctaLabel", type: "text", defaultValue: "Get started" },
    { name: "popular", type: "checkbox", defaultValue: false },
    { name: "order", type: "number", defaultValue: 0 },
    { name: "isActive", type: "checkbox", defaultValue: true },
  ],
};

const Areas: CollectionConfig = {
  slug: "areas",
  admin: { useAsTitle: "name" },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    { name: "city", type: "select", options: ["Nakuru", "Nairobi"], required: true },
    { name: "description", type: "textarea" },
    { name: "priceTier", type: "select", options: ["standard", "travel-premium"], required: true },
    { name: "basePrice", type: "number", required: true, label: "Starting price KES" },
    { name: "order", type: "number", defaultValue: 0 },
  ],
};

const Testimonials: CollectionConfig = {
  slug: "testimonials",
  admin: { useAsTitle: "name" },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "meta", type: "text", required: true },
    { name: "quote", type: "textarea", required: true },
    { name: "order", type: "number", defaultValue: 0 },
    { name: "isActive", type: "checkbox", defaultValue: true },
  ],
};

const FAQItems: CollectionConfig = {
  slug: "faq",
  admin: { useAsTitle: "question" },
  fields: [
    { name: "question", type: "text", required: true },
    { name: "answer", type: "textarea", required: true },
    { name: "order", type: "number", defaultValue: 0 },
    { name: "isActive", type: "checkbox", defaultValue: true },
  ],
};

const Pages: CollectionConfig = {
  slug: "pages",
  admin: { useAsTitle: "title" },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    { name: "content", type: "richText" },
    { name: "metaTitle", type: "text" },
    { name: "metaDescription", type: "textarea" },
    { name: "status", type: "select", options: ["draft", "published"], defaultValue: "draft" },
  ],
};

// ─── Globals (single-instance content for landing page sections) ───

const HeroSection: GlobalConfig = {
  slug: "hero",
  label: "Hero Section",
  fields: [
    { name: "backgroundImage", type: "upload", relationTo: "media" },
    { name: "eyebrow", type: "text", defaultValue: "Premium house-call barber · Nakuru · Nairobi by appointment" },
    { name: "headline", type: "text", defaultValue: "We come to you. With the right tools, the right ear, the right cut." },
    { name: "ctaPrimary", type: "text", defaultValue: "Book a cut · from KES 2,000" },
    { name: "ctaSecondary", type: "text", defaultValue: "See subscriptions" },
  ],
};

const HowItWorks: GlobalConfig = {
  slug: "how-it-works",
  label: "How It Works",
  fields: [
    { name: "eyebrow", type: "text", defaultValue: "How it works" },
    { name: "title", type: "text", defaultValue: "Four steps, no phone calls." },
    { name: "lead", type: "textarea" },
    {
      name: "steps",
      type: "array",
      maxRows: 6,
      fields: [
        { name: "number", type: "text", required: true },
        { name: "narrative", type: "textarea", required: true },
      ],
    },
  ],
};

const TheStandard: GlobalConfig = {
  slug: "the-standard",
  label: "The Standard (Commitments)",
  fields: [
    { name: "eyebrow", type: "text", defaultValue: "The standard" },
    { name: "title", type: "text", defaultValue: "Six commitments, every visit." },
    { name: "lead", type: "textarea" },
    {
      name: "commitments",
      type: "array",
      maxRows: 8,
      fields: [
        { name: "statement", type: "textarea", required: true },
        { name: "detail", type: "textarea" },
      ],
    },
  ],
};

const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  fields: [
    { name: "siteName", type: "text", defaultValue: "Trimly" },
    { name: "tagline", type: "text", defaultValue: "Premium house-call barber" },
    { name: "whatsappNumber", type: "text", defaultValue: "254700000000" },
    { name: "footerDescription", type: "textarea" },
    { name: "metaTitle", type: "text" },
    { name: "metaDescription", type: "textarea" },
  ],
};

const ClosingCTA: GlobalConfig = {
  slug: "closing-cta",
  label: "Closing CTA",
  fields: [
    { name: "eyebrow", type: "text", defaultValue: "The next cut" },
    { name: "headline", type: "text", defaultValue: "Your next cut shouldn't cost you a Saturday." },
    { name: "ctaPrimary", type: "text", defaultValue: "Book a cut · from KES 2,000" },
    { name: "ctaSecondary", type: "text", defaultValue: "WhatsApp the founder" },
  ],
};

const ServicesSection: GlobalConfig = {
  slug: "services-section",
  label: "Services Section",
  fields: [
    { name: "eyebrow", type: "text", defaultValue: "The services" },
    { name: "title", type: "text", defaultValue: "Four cuts, no upsells." },
    { name: "lead", type: "textarea", defaultValue: "Every cut includes line-up, hot-towel finish, and a clean shave-down of the neck. No add-on fees at the door." },
  ],
};

const SubscriptionsSection: GlobalConfig = {
  slug: "subscriptions-section",
  label: "Subscriptions Section",
  fields: [
    { name: "eyebrow", type: "text", defaultValue: "Subscriptions" },
    { name: "title", type: "text", defaultValue: "A standing reservation, on your terms." },
    { name: "lead", type: "textarea", defaultValue: "For clients who book the same week every month. Cancel any time — no penalties, no minimum term." },
    { name: "mpesaNote", type: "textarea", defaultValue: "Paystack does not support automatic M-Pesa debit. If you subscribe with M-Pesa, you will approve an STK prompt on your phone each cycle. Card subscriptions renew automatically." },
    { name: "nairobiNote", type: "textarea", defaultValue: "Nairobi clients: subscriptions coming once we have a Nairobi-based barber on the roster. For now, individual bookings." },
  ],
};

const AreasSection: GlobalConfig = {
  slug: "areas-section",
  label: "Areas Section",
  fields: [
    { name: "eyebrow", type: "text", defaultValue: "Areas served" },
    { name: "title", type: "text", defaultValue: "Two cities, two tiers." },
    { name: "lead", type: "textarea", defaultValue: "Nakuru is the home base — Monday to Saturday, standard pricing. Nairobi runs on selected days, at travel-premium pricing." },
    { name: "nakuruLabel", type: "text", defaultValue: "Home base · Standard pricing" },
    { name: "nakuruMeta", type: "textarea", defaultValue: "Where the barber lives, where most weeks are. Service runs Monday through Saturday." },
    { name: "nairobiLabel", type: "text", defaultValue: "Travel visit · Premium pricing" },
    { name: "nairobiMeta", type: "textarea", defaultValue: "A four-to-six hour round trip from Nakuru. Booked on selected days only." },
    { name: "nairobiTip", type: "textarea", defaultValue: "Nairobi visits are most economical for households of two or more." },
  ],
};

const TestimonialsSection: GlobalConfig = {
  slug: "testimonials-section",
  label: "Testimonials Section",
  fields: [
    { name: "eyebrow", type: "text", defaultValue: "In their words" },
    { name: "title", type: "text", defaultValue: "From the clients in the rotation." },
    { name: "lead", type: "textarea", defaultValue: "Three real Nakuru and Nairobi clients on what changed when the cut started coming to them." },
  ],
};

const FAQSection: GlobalConfig = {
  slug: "faq-section",
  label: "FAQ Section",
  fields: [
    { name: "eyebrow", type: "text", defaultValue: "Questions" },
    { name: "title", type: "text", defaultValue: "The ones we get asked first." },
    { name: "lead", type: "textarea", defaultValue: "Nine answers that close the most common loops. If yours isn't here, the WhatsApp link in the footer reaches the founder directly." },
  ],
};

const PricingPage: GlobalConfig = {
  slug: "pricing-page",
  label: "Pricing Page",
  fields: [
    { name: "metaTitle", type: "text", defaultValue: "Pricing — Trimly | Premium house-call barber" },
    { name: "metaDescription", type: "textarea", defaultValue: "Trimly pricing: KES 2,000 per cut in Nakuru, KES 5,000 in Nairobi. Monthly subscriptions from KES 3,200." },
    { name: "perCutEyebrow", type: "text", defaultValue: "Per-cut pricing" },
    { name: "perCutTitle", type: "text", defaultValue: "Two cities, two tiers. No surprises." },
    { name: "perCutLead", type: "textarea", defaultValue: "Nakuru is the home base — standard pricing. Nairobi carries a travel premium because the round trip costs half a day." },
  ],
};

const ServicesPage: GlobalConfig = {
  slug: "services-page",
  label: "Services Page",
  fields: [
    { name: "metaTitle", type: "text", defaultValue: "Services — Trimly | House-call barber services" },
    { name: "metaDescription", type: "textarea", defaultValue: "Four services, no upsells. Standard cut KES 2,000, executive KES 2,500, beard sculpt KES 1,500, father & son KES 3,500." },
    { name: "eyebrow", type: "text", defaultValue: "The services" },
    { name: "title", type: "text", defaultValue: "Four cuts, no upsells." },
    { name: "lead", type: "textarea", defaultValue: "Every cut includes line-up, hot-towel finish, and a clean shave-down of the neck." },
  ],
};

const AreasPage: GlobalConfig = {
  slug: "areas-page",
  label: "Areas Page",
  fields: [
    { name: "metaTitle", type: "text", defaultValue: "Areas — Trimly | Service areas in Nakuru & Nairobi" },
    { name: "metaDescription", type: "textarea", defaultValue: "Trimly serves Nakuru (Section 58, Milimani, Naka, Kiamunyi, Pipeline, Lanet, Bahati) and Nairobi (Westlands, Kilimani, Karen, Lavington, Runda, Kileleshwa)." },
    { name: "eyebrow", type: "text", defaultValue: "Areas served" },
    { name: "title", type: "text", defaultValue: "Two cities, two tiers." },
    { name: "lead", type: "textarea", defaultValue: "Nakuru is the home base. Nairobi runs on selected days at travel-premium pricing." },
  ],
};

// ─── Export config ───

export default buildConfig({
  admin: {
    user: "payload-users",
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  plugins: [
    s3Storage({
      collections: { media: true },
      bucket: process.env.R2_BUCKET || "trimly-storage",
      config: {
        endpoint: process.env.R2_ENDPOINT || "",
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
        },
        region: "auto",
        forcePathStyle: true,
      },
    }),
  ],
  collections: [PayloadUsers, Media, Services, Plans, Areas, Testimonials, FAQItems, Pages],
  globals: [
    SiteSettings,
    HeroSection,
    HowItWorks,
    ServicesSection,
    SubscriptionsSection,
    AreasSection,
    TestimonialsSection,
    FAQSection,
    TheStandard,
    ClosingCTA,
    PricingPage,
    ServicesPage,
    AreasPage,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.PAYLOAD_DATABASE_URI || "",
    },
    push: true,
    prodMigrations: [],
  }),
  onInit: async (payload) => {
    if (process.env.PAYLOAD_FORCE_PUSH === "true") {
      try {
        const drizzleModule: any = await import("@payloadcms/drizzle" as any);
        await drizzleModule.pushDevSchema((payload as any).db);
        payload.logger.info("PAYLOAD_FORCE_PUSH — schema pushed.");
      } catch (err: any) {
        payload.logger.error({ err }, "PAYLOAD_FORCE_PUSH failed");
      }
    }
    if (process.env.SEED_ON_INIT === "true") {
      try {
        const { seedTrimly } = await import("./seed/index");
        await seedTrimly(payload);
      } catch (err: any) {
        payload.logger.error({ err }, "SEED_ON_INIT failed");
      }
    }
  },
});
