TRIMLY — Comprehensive Build Brief
Premium house-call barber & grooming platform for Kenya
This document is a complete instruction set for an AI coding agent (Cursor, Claude Code, Bolt, v0, Lovable). Read it end-to-end before writing a single line. Do not produce an MVP. Build the production-grade product described here.
__________________________________________________
0. MISSION
Build trimly.co.ke — a booking and subscription platform for a premium mobile barber service. Home base: Nakuru. Secondary service area: Nairobi at travel-premium pricing.
The founder lives and works in Nakuru. Most weeks, every cut is in Nakuru — Section 58 / Milimani, Naka, Kiamunyi, Pipeline, Lanet, Bahati. Premium professionals (bankers, doctors, lawyers, hotel managers, government officers) book the barber to their home and pay KES 1,500–2,500 per cut, with monthly subscriptions for repeat clients.
When a Nairobi customer books, the price jumps to the travel-premium tier: KES 5,000 per cut minimum, with optional 2-cut household discount, because the trip is a 4–6 hour round trip (Nakuru → Nairobi via the Nairobi-Nakuru highway, ~160 km). Nairobi service runs to Westlands, Kilimani, Karen, Lavington, Runda, Kileleshwa — and the booking flow makes the price difference visible at the point of selection, never as a surprise at checkout.
The brand is confidently restrained: editorial typography, off-blacks and warm whites, brass or copper accents, generous whitespace. Think Aman Resorts × Linear × Aesop. No bright greens, no Bootstrap blues, no neon purples, no gradient buttons.
The product must feel like a luxury service from the first paint. If a section looks like a generic shadcn template, rebuild it.
__________________________________________________
1. SOURCE REPOSITORY
Clone: https://github.com/calcom/cal.diy
License: Cal.com is licensed AGPL-3.0; the cal.diy fork is a starter scaffold. For commercial closed-source operation read the Cal.com licensing notes carefully. If the AGPL constraints are unacceptable, fall back to building bookings from scratch on the same Next.js + Prisma + Postgres stack rather than abandoning this brief.
Key facts about cal.diy discovered during research:
- It is a stripped Cal.com fork; the @calcom/ai workspace is declared in the root package.json build chain but the package contents are empty in the diy variant — you are filling an intentional scaffold.
- It uses a Yarn (or pnpm) workspace monorepo with apps/web, packages/app-store, packages/prisma, packages/lib.
- New integrations are scaffolded via the yarn create-app CLI in packages/app-store. Use this pattern when you add Paystack and Daraja apps — do not hand-create files outside this convention.
- Auth is NextAuth; the Prisma schema lives at packages/prisma/schema.prisma.
- Tailwind is already configured. shadcn/ui is not pre-installed — install it.
Step zero: clone, install dependencies, verify it boots locally with a Postgres connection. Do not start customising until yarn dev renders the default Cal scaffold.
__________________________________________________
2. TECH STACK (exact versions, do not substitute)
Runtime: Node 20 LTS
Framework: Next.js 14 App Router (cal.diy ships with this; do not migrate)
Database: Postgres — cal.diy ships a Prisma schema and expects a DATABASE_URL connection string. It does NOT bundle a database. Bring your own Postgres and configure it as-is; do NOT modify Cal's bundled Prisma schema or migration history. Supabase free tier is the recommended provider, but any standard Postgres works.
ORM: Prisma (already installed in cal.diy). Do not migrate to Drizzle — too much rework.
Auth: NextAuth (already installed)
Component library: shadcn/ui — install fresh and use exclusively. Allowed extensions: Radix UI primitives (shadcn already wraps them), Lucide icons, vaul for drawers, sonner for toasts, cmdk for command menu, embla-carousel-react for carousels. No Material UI, no Chakra, no Ant Design, no DaisyUI.
Styling: Tailwind CSS v3 (already configured) + custom CSS variables for the Trimly palette.
Fonts: Self-host two Google Fonts only: Fraunces (display, weights 400/600/800) and Inter (body, weights 400/500/600/700). No third typeface.
CMS: No CMS. Marketing copy is edited in code (or in a content/*.mdx directory if structured editing helps). Do NOT install Payload CMS — it is reserved for the Mchoro Mawe project. If the founder later needs editorial content management, revisit then.
Payments: Paystack is the SOLE payment provider. Account region: Kenya. Do NOT integrate Daraja directly. Paystack handles both cards and M-Pesa through one set of credentials.
One-time M-Pesa: Paystack /charge API with mobile_money payload — issues an STK push to the user's phone (1.5% fee).
One-time card: Paystack /transaction/initialize (2.9% local KES card, 3.8% international).
Recurring subscriptions on cards: Paystack native subscriptions API.
Recurring on M-Pesa: NOT auto-debit. Implement a manual renewal cron — each cycle the user receives an STK push prompt re-using /charge. Document this clearly in the customer-facing pricing page so M-Pesa subscribers know what to expect.
Email: Resend (transactional). SMS: Africa's Talking (booking confirmations).
Hosting: Vercel for the Next.js apps; Supabase Postgres for the database; Supabase Storage for any image uploads (Cloudflare R2 is reserved for the Mchoro Mawe project — don't introduce a second storage provider here). The point: cal.diy is a Next.js scaffold, NOT a bundled stack like Reactive Resume — so we bring our own Postgres and storage. We do NOT, however, modify cal.diy's bundled Prisma schema, app-store CLI conventions, or auth setup.
Analytics: PostHog (self-hostable, generous free tier). No Google Analytics.
Error tracking: Sentry.
__________________________________________________
3. UI / VISUAL DIRECTION — non-negotiable
Trimly's UI must signal premium service from the first 200ms paint. Below is the exact palette, type system, and pattern guidance. Reference the linked screenshots; do not invent your own direction.
3.1 Reference websites (study these before designing)
The downstream agent should fetch and visually inspect these:
- Linear — https://linear.app — for dark-mode density and accent restraint
- Vercel — https://vercel.com — for monochrome confidence
- Stripe — https://stripe.com — for navy-driven authority
- Superhuman — https://superhuman.com — for warm off-whites on near-black, intimate luxury
- Notion Calendar — https://calendar.notion.so — for booking grid as art object
- Aesop — https://aesop.com — for editorial restraint and serif elegance
- Aman Resorts — https://aman.com — for hospitality-grade premium feel
3.2 The Trimly palette (use exactly)
Trimly uses Warm Charcoal + Brass as primary direction. Two modes — define both as CSS variables; the user can toggle via a header switch.
Dark mode (default)

--background:        #111110
--surface:           #1C1B19
--surface-elevated:  #25231F
--border:            #2E2D2A
--border-strong:     #3D3B36
--text-primary:      #F0EDE6
--text-secondary:    #A8A39A
--text-muted:        #6E6A62
--accent:            #C9A96E   /* brass */
--accent-hover:      #DFC08A
--accent-foreground: #111110
--danger:            #B84A3E   /* muted oxblood, never #EF4444 */


Light mode

--background:        #FAFAF7
--surface:           #F2EFE8
--surface-elevated:  #EAE6DC
--border:            #E0DDD4
--border-strong:     #C9C5B9
--text-primary:      #1A1916
--text-secondary:    #4A4842
--text-muted:        #7A7570
--accent:            #8B6A2A
--accent-hover:      #A07F3A
--accent-foreground: #FAFAF7
--danger:            #8B2A2A


Forbidden colors anywhere in the product: bright green (#10B981 family), bootstrap blue (#3B82F6 family), neon purple (#8B5CF6 / #A855F7 family), pure black (#000000), pure white (#FFFFFF).
Forbidden patterns: gradient buttons, drop-shadow cards (box-shadow: 0 2px 4px rgba(0,0,0,0.1)), three-column emoji feature grids, "Trusted by 10,000+" stacked-avatar social proof blocks, section titles that say "Features" or "Why choose us?", placeholder-as-label form inputs.
3.3 Typography
Hero headlines: Fraunces, weight 800, font-size: clamp(48px, 6vw, 84px), line-height: 1.02, letter-spacing: -0.02em. Italic variant of Fraunces is allowed for one-word emphasis.
Section titles: Fraunces, weight 700, font-size: clamp(32px, 3.5vw, 48px).
Body: Inter, weight 400, font-size: 17px, line-height: 1.6.
Micro labels (eyebrows, badges): Inter, weight 600, font-size: 12px, letter-spacing: 0.18em, text-transform: uppercase.
Numbers and prices: Fraunces, weight 600, tabular-nums for stat displays.
Load via next/font/google with display: swap. Do not load any other fonts.
3.4 UI patterns
Spacing: 8px base. Section vertical rhythm 96px desktop / 56px mobile. Card internal padding 24px minimum. Max content width 1200px with 64px gutters.
Borders not shadows: cards use border: 1px solid var(--border). Shadows reserved for floating UI (dropdowns, modals, dialog): box-shadow: 0 8px 32px rgba(0,0,0,0.24) on dark.
Buttons: primary is filled brass, border-radius: 6px, padding 12px 24px, no shadow, no scale on hover (only background lightness shift). Secondary is background: transparent; border: 1px solid var(--border-strong); — never grey-filled.
Inputs: transparent background, border: 1px solid var(--border), focus border-color: var(--accent) with no glow. Labels above field. Placeholder text at 40% opacity.
Imagery: real photos of barbering — close-up clipper work, beard sculpting, a chair in a sunlit Kenyan home (a Nakuru living room counts; a Karen apartment counts). Stock photos of generic men in suits = forbidden. Source from Unsplash with appropriate attribution or generate via Midjourney / Nano Banana.
3.5 Anti-patterns to verify against before shipping any page
No gradient buttons anywhere.
No "Features" sections titled literally "Features".
No three-column emoji-icon grids.
No 4.9★ avatar-stack social proof.
No bg-white text-gray-500 Tailwind defaults.
No box-shadow: 0 2px 4px rgba(0,0,0,0.1) on cards.
__________________________________________________
4. REPOSITORY SETUP STEPS
In order:
git clone https://github.com/calcom/cal.diy trimly && cd trimly
pnpm install (or yarn — match what the repo uses)
Copy .env.example to .env.local. Fill DATABASE_URL with a Supabase connection string, NEXTAUTH_SECRET with a generated value.
pnpm prisma migrate deploy
pnpm dev
Confirm http://localhost:3000 renders the cal.diy default. Do not proceed if this fails.
Initialize shadcn/ui at apps/web root: pnpm dlx shadcn@latest init — pick New York style, slate base color (we override via CSS vars), CSS variables yes, Tailwind config yes.
Install components as needed: pnpm dlx shadcn@latest add button card input label dialog drawer sheet dropdown-menu sonner badge avatar tabs separator skeleton
Replace shadcn's generated globals.css palette with the Trimly palette from §3.2.
Create /apps/web/app/(marketing)/page.tsx for the new landing page; the existing apps/web/app/page.tsx becomes the booking dashboard.
Wire fonts via next/font in apps/web/app/layout.tsx.
Commit at each milestone with conventional commit messages.
__________________________________________________
5. DATABASE SCHEMA EXTENSIONS
Extend the existing Cal Prisma schema at packages/prisma/schema.prisma. Add the following models — DO NOT remove any existing Cal models.

PRISMA
model TrimlyService {
  id              String   @id @default(cuid())
  slug            String   @unique
  name            String
  description     String
  durationMin     Int
  priceKESNakuru  Int       // home-base price (Nakuru)
  priceKESNairobi Int       // travel-premium price (Nairobi)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  bookings        TrimlyBooking[]
}


model TrimlyBooking {
  id            String   @id @default(cuid())
  userId        String
  serviceId     String
  scheduledFor  DateTime
  addressLine1  String
  addressLine2  String?
  estate        String
  city          String   @default("Nakuru")  // "Nakuru" (home) or "Nairobi" (travel-premium tier). Drives pricing tier selection.
  notes         String?
  totalKES      Int
  paymentMethod String   // "mpesa" | "paystack_card"
  paymentStatus String   // "pending" | "succeeded" | "failed" | "refunded"
  bookingStatus String   // "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show"
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  user          User     @relation(fields: [userId], references: [id])
  service       TrimlyService @relation(fields: [serviceId], references: [id])
  payment       TrimlyPayment?
}


model TrimlyPayment {
  id                 String   @id @default(cuid())
  bookingId          String?  @unique
  subscriptionId     String?
  provider           String   // "mpesa" | "paystack"
  providerReference  String   // CheckoutRequestID for Daraja, reference for Paystack
  amountKES          Int
  status             String   // "pending" | "succeeded" | "failed" | "refunded"
  rawCallback        Json?    // store raw provider payload for audit
  createdAt          DateTime @default(now())
  booking            TrimlyBooking? @relation(fields: [bookingId], references: [id])
  subscription       TrimlySubscription? @relation(fields: [subscriptionId], references: [id])
}


model TrimlyPlan {
  id           String   @id @default(cuid())
  slug         String   @unique  // "starter" | "regular" | "executive"
  name         String
  cutsPerMonth Int
  priceKES     Int
  intervalMonths Int    @default(1)  // 1 = monthly, 12 = yearly
  paystackPlanCode String?           // populated after Paystack plan creation
  isActive     Boolean  @default(true)
}


model TrimlySubscription {
  id                  String   @id @default(cuid())
  userId              String
  planId              String
  paystackSubscriptionCode String?
  paystackCustomerCode    String?
  status              String   // "active" | "past_due" | "cancelled" | "non_renewing"
  currentPeriodStart  DateTime
  currentPeriodEnd    DateTime
  cancelAtPeriodEnd   Boolean  @default(false)
  cutsRemaining       Int
  createdAt           DateTime @default(now())
  user                User     @relation(fields: [userId], references: [id])
  plan                TrimlyPlan @relation(fields: [planId], references: [id])
  payments            TrimlyPayment[]
}


model TrimlyAvailability {
  id        String   @id @default(cuid())
  date      DateTime
  startTime String   // "09:00"
  endTime   String   // "17:00"
  isBlocked Boolean  @default(false)
  reason    String?
}


Run pnpm prisma migrate dev --name trimly_initial after pasting.
__________________________________________________
6. PAYMENTS — Paystack only, no Daraja
6.1 Architecture
ONE provider: Paystack Kenya. It handles cards AND M-Pesa from a single integration. There is no Daraja code in this product. The reasons we accept this:
- One set of credentials, one webhook, one reconciliation surface.
- Paystack's M-Pesa fee is 1.5% — competitive enough for KES 1,500–3,500 cuts.
- The trade-off: Paystack does NOT support auto-debit M-Pesa subscriptions. Recurring M-Pesa works as a manual renewal cron described in §6.4.
Required environment:

PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_WEBHOOK_SECRET=...


6.2 M-Pesa one-time (booking payments) via Paystack /charge
Docs: https://paystack.com/docs/payments/payment-channels/#mobile-money
Flow:
1. User confirms a booking with M-Pesa selected → server calls Paystack:
ts
   POST https://api.paystack.co/charge
   Authorization: Bearer ${PAYSTACK_SECRET_KEY}
   {
     "email": user.email,
     "amount": booking.totalKES * 100,        // amounts are in kobo/cents
     "currency": "KES",
     "mobile_money": { "phone": "0712345678", "provider": "mpesa" },
     "metadata": { "bookingId": booking.id }
   }
2. Phone number normalisation: accept 0712345678, +254712345678, or 254712345678. Send to Paystack as 0712345678 form (Paystack accepts that — confirm by reading their docs at integration time).
3. Paystack returns data.status: "pay_offline" and a display_text. Persist data.reference on the TrimlyPayment row immediately.
4. Paystack issues an STK push to the customer's phone. They have 180 seconds to confirm — this is a Safaricom network limit, not configurable.
5. Show a "waiting for confirmation" UI on the client and poll /api/payments/status?reference=... every 3 seconds for up to 200 seconds.
6. On success, Paystack fires charge.success to your webhook at /api/webhooks/paystack.
Max single M-Pesa transaction: KES 150,000 (Safaricom limit).
6.3 Card payments and recurring subscriptions via Paystack subscriptions
Docs: https://paystack.com/docs/payments/subscriptions
Flow:
1. On first deploy, run scripts/seed-paystack-plans.ts creating Paystack Plan objects for each TrimlyPlan and storing the returned plan_code in TrimlyPlan.paystackPlanCode.
2. User picks a plan → server initialises a transaction at https://api.paystack.co/transaction/initialize with metadata { trimlyPlanId, userId }. Redirect to the returned authorization_url.
3. After payment, Paystack redirects to /payments/paystack/return?reference=.... Server verifies via /transaction/verify/{reference}.
4. If confirmed and the customer paid by card, Paystack auto-creates a subscription on the recurring plan; the subscription.create webhook fires next.
5. If the customer paid by M-Pesa for the first cycle, no subscription object is created — see §6.4 for the manual renewal flow.
Webhook handler at /api/webhooks/paystack — required behaviour:
- Buffer raw body via await req.text() before any parse — needed for HMAC signature verification.
- Verify signature: crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(rawBody).digest('hex') === request.headers['x-paystack-signature'].
- Handle these events: charge.success, charge.failed, subscription.create, subscription.disable, invoice.create, invoice.payment_failed.
- Idempotency: keep a webhooks_log table keyed by event_id from the payload; if the same id arrives twice, return 200 OK without re-processing.
- On invoice.payment_failed: Paystack does NOT auto-retry. Send email + show re-payment UI in the user dashboard.
Cancel subscription: POST /subscription/disable with subscription_code.
6.4 M-Pesa renewal cron (manual auto-debit substitute)
For subscribers who chose M-Pesa, run a daily Vercel Cron at 08:00 EAT:
1. Query subscriptions where paymentMethod = 'mpesa' AND currentPeriodEnd <= now() + 1 day AND status = 'active'.
2. For each, fire a Paystack /charge M-Pesa request and email + WhatsApp the user: "Your Trimly Regular subscription renews tomorrow. Approve the M-Pesa STK prompt on your phone — KES 5,600."
3. If they don't confirm within the day, mark status = 'past_due' and lock booking access until they self-renew via the dashboard's "Renew now" button.
This keeps M-Pesa subscriptions functional even though Paystack lacks native M-Pesa auto-debit. Be transparent about this on the pricing page: "M-Pesa renewals require you to approve an STK prompt each cycle. Card renewals are automatic."
6.5 Refunds
Paystack refunds are NOT self-service via API for M-Pesa transactions — you must email support@paystack.com with the transaction reference. Build a /admin/refunds page that surfaces a "Generate refund email" button which composes a pre-filled mailto link. Card refunds CAN be done via the Paystack dashboard.
6.6 Sandbox testing
Paystack offers a fully test-mode environment with separate sk_test_ keys. There is no test M-Pesa STK push that simulates the user side — you must test on a real Safaricom line at small amounts (KES 10–50). Budget KES 1,000 for end-to-end testing.
6.7 Pricing tiers (Nakuru base + Nairobi travel-premium)
Per-cut pricing is city-dependent. Both prices are surfaced on the booking flow at the city-selection step. Never show a single price and reveal a "travel surcharge" at checkout — that breaks trust.
Per-cut pricing (one-time bookings):


Service
Nakuru (home base)
Nairobi (travel-premium)
Standard cut
KES 2,000
KES 5,000
Cut + beard sculpt
KES 2,500
KES 5,800
Premium occasion (wedding / event prep)
KES 3,500
KES 7,500
Father + son (2 cuts, same household)
KES 3,500
KES 7,500


The Nairobi premium reflects a 4–6 hour round-trip from Nakuru, fuel/matatu, and the opportunity cost of the day. To make the trip economical, Nairobi bookings carry a soft policy: encourage a 2-cut household minimum (e.g., father + son, two flatmates). The booking flow surfaces this as an inline tip when Nairobi is selected: "Nairobi visits are most economical for households of 2+. Add a second guest for KES 4,500."
Subscription tiers (Nakuru-only at launch):
Subscriptions are Nakuru-resident-only. The travel premium does not amortise across a monthly subscription cleanly; offering a Nairobi subscription would commit the barber to weekly long-distance trips that erode the per-cut economics.


Plan
Cuts/mo
KES/mo
Notes
Trimly Starter (Nakuru)
2
3,600
KES 1,800/cut effective
Trimly Regular (Nakuru)
4
6,800
KES 1,700/cut effective
Trimly Executive (Nakuru)
6
9,600
KES 1,600/cut effective, priority slots, free beard trim


Yearly = 10× monthly (2 months free). Yearly billing uses a separate Paystack plan with interval = "annually". Subscription page has a small note: "Nairobi clients: subscriptions coming once we have a Nairobi-based barber on the roster. For now, individual bookings."
__________________________________________________
7. PAGE-BY-PAGE SPEC
7.1 Public landing page /
A long-scroll editorial landing. Sections in this order — every one of them is required:
Header — fixed, transparent until scroll. Logo wordmark left, nav center (Services · Pricing · Areas · Stories · Login), "Book a cut" CTA right.
Hero — full-bleed dark background. Eyebrow ("Premium house-call barber. Nakuru. Nairobi by appointment."). Headline Fraunces 800, italic emphasis on one word — e.g., "We come to you. With the right tools, the right ear, the right cut." Single primary CTA "Book a cut · from KES 2,000" + secondary "See subscriptions" text link. Mute-toned hero image of clipper work in a sunlit room (real photo, not stock).
Service strip — 4 services in horizontal cards, no shadows, just borders. Each shows: icon (Lucide, single-stroke), name, duration, price.
How it works — 4 numbered steps. Numbers in Fraunces 56px brass. Steps written as one-sentence narrative, not bulleted. Avoid the standard 3-column emoji grid.
Subscriptions — 3 plan cards with detailed feature lists. Most-popular plan elevated visually with a brass border accent (not a gradient). Toggle for monthly/yearly with "save 17%" microcopy.
Areas served — split into TWO labeled groups on a small Mapbox light-style map:


        - Nakuru (home base, standard pricing): Section 58 / Milimani, Naka, Kiamunyi, Pipeline, Lanet, Bahati, Nakuru CBD


        - Nairobi (travel-premium pricing): Westlands, Kilimani, Karen, Lavington, Runda, Kileleshwa


   Two-pin colour scheme on the map: brass for Nakuru pins, slightly muted brass-shadow tone for Nairobi pins. List below the map clearly labelled with each pricing tier so the price signal is upfront.
Client stories — 3 testimonials, real names + neighborhoods. No avatar-stack ratings widget. Editorial pull-quote treatment with Fraunces italic.
The standard — a list of 6 quality commitments (sterilized tools, clipper guards, on-time guarantee, M-Pesa receipts, refund policy, etc.) presented as a typographic list — number + statement, not cards.
FAQ — accordion (@radix-ui/react-accordion). 8–10 questions.
Closing CTA — full-bleed dark, single line "Your next cut shouldn't cost you a Saturday." Primary button + WhatsApp link.
Footer — wordmark, tiny links column, social icons in muted tone. M-Pesa Paybill / Till displayed for trust.
7.2 Booking flow /book
A single-page wizard with 5 steps inside one route, state in URL params for resumability:
- Step 1: Pick city. Two clean radio cards: "Nakuru — home base" with the Nakuru base price visible, and "Nairobi — travel visit" with the travel-premium price visible AND a small inline note: "Includes travel from Nakuru. Most economical for households of 2 or more." This step is non-skippable — no pricing surprises later.
- Step 2: Pick service. Each service card displays the price for the city selected in Step 1 (re-rendered from priceKESNakuru or priceKESNairobi).
- Step 3: Pick date and time slot. Use cal.diy's existing booking grid; restyle to match Trimly palette. Nairobi availability is intentionally narrower — only show 2 days per week (e.g., Saturdays + one weekday by default; the operator configures these in /operator/availability). Render a small note: "Nairobi visits run on selected days only — we batch trips to keep prices fair."
- Step 4: Address details + special requests. Estate / area dropdown is filtered by the city chosen in Step 1.
- Step 5: Payment method. Paystack M-Pesa STK push or Paystack card. On success → confirmation screen with booking reference + WhatsApp opt-in for reminders.
Implementation notes:
- The pricing rule lives in a server-side helper, NOT in the client. The client never computes the price; it requests /api/bookings/quote with {serviceId, city} and renders whatever the server returns. This prevents a client-side bypass of the Nairobi premium.
- Nairobi bookings under 5 days lead time are blocked by default — show "Nairobi visits need 5 days notice" on the date step. The operator can override per-booking.
7.3 Customer dashboard /account
Tabs: Upcoming · Past · Subscription · Profile · Payment methods.
7.4 Operator dashboard /operator
Routes: /operator/today (today's schedule with map + route directions), /operator/calendar (week view), /operator/clients (CRM), /operator/payments (revenue dashboard with charts via recharts), /operator/availability (block dates).
7.5 Admin /admin
Manage services, plans, payment reconciliation. Locked behind admin role.
7.6 Other pages
/services/[slug] — service detail
/areas/[area] — SEO landing per neighborhood. Nakuru pages: Section 58, Milimani, Naka, Kiamunyi, Pipeline, Lanet, Bahati. Nairobi pages: Westlands, Kilimani, Karen, Lavington, Runda, Kileleshwa. Each page surfaces the pricing tier that applies to that area at the top — no surprise pricing.
/login, /signup, /forgot-password
/legal/terms, /legal/privacy, /legal/refund-policy
__________________________________________________
8. AUTH
NextAuth providers: Google, Email magic link via Resend, Phone OTP via Africa's Talking. Three roles: customer, operator, admin. Role-based middleware in apps/web/middleware.ts.
__________________________________________________
9. SMS, EMAIL, WHATSAPP
Resend for receipts and password resets. Template via React Email.
Africa's Talking SMS for booking confirmation 1 hour before appointment.
WhatsApp: Click-to-chat link (https://wa.me/254XXXXXXXXX?text=...) on booking confirmation. Don't bother with the WhatsApp Business API yet — too much overhead for launch.
__________________________________________________
10. SEO
Per-area landing pages with structured data (LocalBusiness schema)
Sitemap auto-generated via next-sitemap
Open Graph image generated dynamically via @vercel/og per service and per booking (shareable booking confirmations)
__________________________________________________
11. DEPLOYMENT
Web app: Vercel (connect GitHub)
DB: Supabase (use connection pooler URL for Vercel)
Cron: Vercel Cron Jobs for the daily M-Pesa renewal cron + the 5-minute payment status reconciliation
Domain: trimly.co.ke pointing to Vercel
Environment: separate Vercel projects for staging.trimly.co.ke and production. Paystack sk_test_ keys on staging; sk_live_ keys on prod.
__________________________________________________
12. TESTING
Playwright E2E for the booking flow (Paystack M-Pesa happy path, Paystack M-Pesa cancellation/timeout, Paystack card subscription start, Paystack card subscription cancel, M-Pesa renewal cron firing)
Vitest for utility functions (phone normalisation, fee calc)
Manual QA checklist: every page on iPhone SE viewport (375px), iPad (768px), and 1440px desktop. Lighthouse Performance ≥ 90, Accessibility ≥ 95.
__________________________________________________
13. WHAT GOOD LOOKS LIKE
When the AI agent is done:
- Loading the landing page on a 4G connection feels like opening Aman.com — slow appearance of weight, then clarity.
- A user can book a cut with M-Pesa from cold visit in under 90 seconds.
- An admin can see today's revenue in KES, today's bookings on a map, and disable a Saturday in 3 clicks.
- The product never displays the colors #10B981, #3B82F6, #8B5CF6, #FFFFFF, or #000000.
- No section anywhere uses the title "Features" or "Why choose us?".
- Lighthouse scores: Performance 90+, Accessibility 95+, Best Practices 95+, SEO 95+.
If any of these are not true, the build is not done.
__________________________________________________
14. REFERENCES (the AI must look at these)
Visual:
- https://linear.app
- https://vercel.com
- https://stripe.com
- https://superhuman.com
- https://calendar.notion.so
- https://aesop.com
- https://aman.com
- https://safrofades.com (Kenyan competitor; price benchmark KES 5,000–8,000)
Technical:
- https://github.com/calcom/cal.diy
- https://paystack.com/docs/payments/payment-channels/#mobile-money (Paystack M-Pesa)
- https://paystack.com/docs/payments/subscriptions
- https://paystack.com/docs/api
- https://ui.shadcn.com
- https://payloadcms.com/docs
- https://www.prisma.io/docs
- https://supabase.com/docs
__________________________________________________
15. THINGS TO EXPLICITLY NOT DO
Do not build an MVP. Build the whole thing.
Do not use any color outside the §3.2 palette.
Do not install component libraries other than shadcn/ui + the explicit additions.
Do NOT integrate Daraja directly. Paystack handles M-Pesa for this product. (One provider, one webhook surface.)
Do not use IntaSend.
Do not skip the webhook idempotency / signature verification.
Do not store phone numbers without normalising format.
Do not advertise "auto-debit M-Pesa subscriptions" — Paystack does not support it; tell users the truth on the pricing page.
Do not commit .env files. Use Vercel and Supabase secret managers.
Do not write a single section titled "Features".
Do not add a 3-column emoji feature grid anywhere.
Do not use gradient buttons.
End of brief. Build it.
__________________________________________________
APPENDIX A — VISUAL BIBLE (the anti-AI-slop reference set)
Why this exists. AI builders default to generic SaaS templates: gradient hero, three-column emoji grid, avatar-stack social proof, gray-on-white card shadows. To force premium output, the building AI MUST visually study the references below before drafting any UI. Treat each as a teacher — note typography, palette, spacing rhythm, hero composition, image treatment. Internalize the language. Then write code.
For every section you build, ask: "Does this look like it could exist on a Linear / Aman / Hermès page? Or does it look like a 2018 Bootstrap theme?" If the latter, rebuild.
A.1 Tier 1 — Primary aesthetic anchors (study first)
These define the visual ceiling for Trimly. Copy nothing literally — copy the discipline.
https://linear.app — restraint as authority. Note the 1px borders, monochrome hierarchy, single accent (#5E6AD2), Inter throughout, zero decorative elements.
https://vercel.com — pure monochrome confidence. Black + white + nothing. Marketing site mirrors product chrome.
https://stripe.com — navy authority + periwinkle accent. Note the hero composition: product visual is the hero, copy is restrained.
https://superhuman.com — warm off-white on near-black. The closest reference for Trimly's warm-charcoal mode.
https://www.aesop.com — editorial restraint as luxury. Serif typography, generous margins, product photography as art.
https://aman.com — hospitality-grade luxury. Slow scroll. Cinematic photography. Type that gives space to breathe.
https://sohohouse.com — membership service brand at scale. Note how a service business reads as exclusive without saying "exclusive."
https://hermes.com — orange (#FF6900) used so sparingly it screams. Lesson: one accent, used once per page maximum.
https://lelabofragrances.com — apothecary-as-luxury. Helvetica all caps + black + ivory. Brand discipline through type alone.
A.2 Tier 2 — Product polish at scale (how billion-dollar brands handle the same flow you're building)
Your booking flow has to feel like Resy's, not like a WordPress plugin's.
https://apple.com — the single highest reference for product reveal pages. Study the AirPods Pro page specifically.
https://www.apple.com/airpods-pro/ — single-product editorial at scale. Type-led. Real photography. No shadowed cards.
https://calendar.notion.so — booking grid as art object.
https://resy.com — premium restaurant booking. Closest functional analog to Trimly. Note: dark hero, restrained imagery, warm accents.
https://www.exploretock.com (or tock.com) — Tock, high-end reservations. Booking flows that feel curated.
https://opentable.com — booking flow at giant scale. What NOT to copy in tone (too mainstream), what TO copy in flow (frictionless 3-step).
https://airbnb.com — service marketplace at giant scale. Study the listing page composition; ignore the booking widget chrome.
https://cal.com — your source repo's polished commercial product. Look at it after cloning so you know what "good" looks like for the same codebase.
A.3 Tier 3 — Industry-specific (premium personal-care + grooming + service)
These are the brands Trimly's customer already trusts. Speak the same language.
https://acquadiparma.com — Italian grooming heritage. Italianate restraint. Brass-tone metallic accents = exactly Trimly's palette direction.
https://buly1803.com — French apothecary restraint. Note the editorial product pages, type-led navigation, parchment backgrounds.
https://www.byredo.com — Stockholm fragrance house. Editorial, monochrome, ruthless restraint.
https://frédéricmalle.com (or fredericmalle.com) — Frédéric Malle. Premium fragrance with editorial product pages.
https://equinox.com — premium fitness. The best reference for "membership-driven service" in dark mode.
https://www.classpass.com — subscription service for fitness. Study the subscription tier page composition.
https://www.squire.io — direct US barber-tech analog. Study what a focused barber product looks like (note: do not copy the chrome — Squire's web feels SaaS-y, but their app interaction model is solid).
https://www.trim-it.co.uk — UK mobile barber service. Direct functional analog.
https://www.harrys.com — Harry's, premium grooming D2C. Editorial e-commerce reference.
A.4 Tier 4 — African luxury / hospitality (locally relevant)
The customer in Section 58 / Milimani Nakuru, or in Karen / Lavington Nairobi, has stayed at these places. Trimly should feel like it belongs in their world.
https://www.singita.com — luxury safari operator. Among the most refined hospitality websites globally.
https://andbeyond.com — luxury safari + Africa. Editorial photography at scale.
https://www.angama.com — Angama Mara. Kenyan hospitality, premium web.
https://giraffemanor.com — Giraffe Manor (Kenyan icon). Hospitality web with Kenyan voice.
https://www.olseki.com — Ol Seki Hemingways. Kenyan luxury safari reference.
https://www.amankora.com (Aman Bhutan) and other individual Aman properties — single-property hospitality web.
A.5 Tier 5 — Editorial / typography (how to set type confidently)
If your hero typography looks like a stock template, study these.
https://monocle.com — global brand magazine. Refined type, density discipline.
https://www.mrporter.com — Mr Porter (Yoox-Net-a-Porter). Editorial men's luxury e-commerce.
https://www.matchesfashion.com — Matches Fashion. Premium e-commerce with editorial confidence.
https://www.nytimes.com — NYT (especially their interactive features and the Styles section).
https://www.cerealmag.com — Cereal magazine. Bone backgrounds, editorial photography, the closest typographic peer to Trimly's intended voice.
A.6 Tier 5b — ANTI-references (study, copy nothing)
These exemplify what AI-template barber sites look like. The building AI must NOT produce anything that resembles them.
Generic Wix and Squarespace barber-shop templates. Search "barber shop template Wix" — every example is a study in what Trimly is not.
Generic Bootstrap/AdminLTE-style booking dashboards (gradient buttons, blue primary, drop-shadow cards, "Trusted by 10,000+ users" with avatar stack).
"Lookbook" pages built on Elementor that pile decorative elements (counters, social proof bars, testimonial sliders, gradient overlays).
Mobile-first generic SaaS landings using Headspace's pastel palette for B2C services. Mistakes to avoid: pastel mint, pastel coral, pastel lavender, "soft" gradient buttons.
A.7 How to use this Visual Bible
Before drafting any new page or component:
Open at least 3 Tier 1 references and 1 Tier 3 reference in tabs.
Identify the specific composition technique relevant to the section you're about to build (e.g., "How does Aman handle a service detail page hero?").
Match the spacing, type scale, and image treatment.
Run the Anti-Pattern checklist from §3.5.
If your draft could plausibly live on any of the Tier 1 sites, ship. If it could plausibly live on a Bootstrap template gallery, rebuild.
__________________________________________________
APPENDIX B — AI AGENT SKILLS & MCPs (install BEFORE building)
The downstream AI must install these six skills/MCPs before drafting any UI. They exist for one reason: forcing better output than a vanilla model would produce. Skipping them is the biggest single cause of AI-template results.
Install all six during the "Phase 0 — Tooling" stage of the build, before any application code is written.
B.1 Anthropic frontend-design skill — the design discipline guard
Source: https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
Install (Claude Code):


/skills add https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md
What it does: Anthropic's own opinionated guidance for producing distinctive, production-grade frontend UIs. Guards against the "centered hero + 3-column emoji feature grid + 4.9★ avatar stack" template trap.
When to invoke: At the start of EVERY new page or component, before drafting markup. Re-invoke if a draft starts feeling generic.
Why it matters here: This single skill, applied disciplined, is the difference between Linear-grade output and Bootstrap-template output. Non-negotiable.
B.2 shadcn/ui MCP server — live component awareness
Source: https://ui.shadcn.com/docs/mcp
Install (one command writes the MCP config for you):


npx shadcn@latest mcp init --client claude   # or --cursor / --vscode
Manual MCP config (.cursor/mcp.json or .claude/mcp.json):


json
  {
    "mcpServers": {
      "shadcn": { "command": "npx", "args": ["shadcn@latest", "mcp"] }
    }
  }
What it does: Gives the AI live awareness of every shadcn/ui component, registry source, and installation command. The AI can browse and add components by name through MCP rather than guessing CLI syntax.
When to invoke: During scaffolding (Phase 1 setup) and any time a new component is needed.
Why it matters here: shadcn/ui is mandated as the sole component library across Trimly, Resumely, and Mchoro Mawe. The MCP eliminates npx shadcn add typos and stale-knowledge mistakes.
B.3 Anthropic webapp-testing skill — automated build verification
Source: https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md
Install:


/skills add https://raw.githubusercontent.com/anthropics/skills/main/skills/webapp-testing/SKILL.md
What it does: Playwright-based Python toolkit for spinning up the local dev server and capturing screenshots, console logs, and accessibility tree from any URL. Lets the AI critique its own output.
When to invoke: After every major page or component is drafted — the AI must screenshot the result and visually compare it to the Visual Bible (Appendix A) before declaring the section done.
Why it matters here: Closes the loop. Without this, an AI generates code that looks reasonable in source but renders broken or template-y in browser — and never finds out.
B.4 Playwright MCP — agent-native browser automation
Source: https://github.com/microsoft/playwright-mcp
Install (Claude Code):


claude mcp add playwright npx @playwright/mcp@latest
Manual MCP config:


json
  {
    "mcpServers": {
      "playwright": {
        "command": "npx",
        "args": ["@playwright/mcp@latest"]
      }
    }
  }
What it does: MCP server exposing Playwright browser automation via accessibility-tree snapshots — no vision model needed. The AI can navigate, click, type, and read the page DOM in a structured form.
When to invoke:
After each page is built — open in headless browser, screenshot, run a Lighthouse audit.
For end-to-end test scaffolding (Trimly: booking flow; Resumely: paywall flow; Mchoro Mawe: site-visit form submission).
To visit Visual Bible reference URLs from Appendix A and study them programmatically when in doubt about a composition.
Why it matters here: All three projects mandate Lighthouse Performance ≥ 90 and Accessibility ≥ 95. Playwright MCP makes those numbers a passive guard rather than a manual checklist item.
B.5 Context7 MCP — live, version-correct library docs
Source: https://github.com/upstash/context7
Install (auto-setup):


npx ctx7 setup --claude   # or --cursor / --opencode
Manual MCP config:


json
  {
    "mcpServers": {
      "context7": {
        "url": "https://mcp.context7.com/mcp",
        "headers": { "Authorization": "Bearer YOUR_CONTEXT7_API_KEY" }
      }
    }
  }
What it does: Fetches real-time, version-specific docs from any library's source repo and injects them into the model's context — kills the "I'm using Tailwind v3 syntax against your v4 project" class of hallucinations.
When to invoke: Append use context7 to any prompt that touches Next.js, Payload, Prisma, NestJS, Vercel AI SDK, Paystack, shadcn, Resend — basically every external library in this build.
Why it matters here: Reactive Resume uses Vercel AI SDK v6 with adapters that change syntax between minor versions. Cal.diy uses Prisma + the Cal.com app-store CLI. Payload 3 has migration patterns that did not exist in v2. Stale doc memory will cost you days. Context7 prevents it.
B.6 awesome-cursorrules .cursorrules file — passive convention enforcement
Source: https://github.com/PatrickJS/awesome-cursorrules
Recommended file (TypeScript + shadcn/ui + Next.js):


https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/typescript-shadcn-ui-nextjs-cursorrules-prompt-fil/.cursorrules
Install (drop in repo root):


curl -o .cursorrules https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/typescript-shadcn-ui-nextjs-cursorrules-prompt-fil/.cursorrules
What it does: A curated .cursorrules file that tells Cursor + compatible agents the stack conventions (TypeScript, shadcn/ui, Next.js) so generated code matches from the first prompt.
When to invoke: Set up once at project initialization; it runs passively on every interaction afterwards.
Why it matters here: Prevents the AI from drifting between TS and JS, between App Router and Pages Router, between shadcn variants — drift is a silent killer of build velocity.
B.7 Skill invocation playbook (the order of operations)
The building AI should follow this sequence:
Phase 0 — Tooling (do this first, no exceptions):
1. Install B.1, B.2, B.3, B.4, B.5, B.6 above
2. Drop the .cursorrules file in repo root
3. Verify all MCP servers respond by asking the AI: "List the shadcn components available" — should return a real list
Phase 1 — Scaffolding:
4. Use shadcn MCP (B.2) to install the base component set
5. Use Context7 (B.5) for any library setup question — pin every doc lookup to it
Phase 2 — Building each page:
6. BEFORE drafting a new page: re-read the relevant Visual Bible tier (Appendix A)
7. BEFORE drafting markup: invoke the frontend-design skill (B.1)
8. AFTER drafting a page: invoke webapp-testing (B.3) + Playwright MCP (B.4) to screenshot and critique
9. If the screenshot looks template-y, scrap and rebuild
Phase 3 — Validation:
10. Use Playwright MCP (B.4) to run Lighthouse on every public route
11. Confirm Performance ≥ 90, Accessibility ≥ 95 before declaring a page done
Phase 4 — Continuous:
12. Every commit triggers an automated Playwright screenshot diff against the previous commit (set up via GitHub Actions; see your CI config)
If any of the six tools is unavailable (e.g., Context7 API key not provisioned), STOP and provision it before continuing. Do not build without the toolset — the resulting output will be measurably worse.

