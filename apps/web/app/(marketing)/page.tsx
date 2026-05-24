/**
 * (marketing)/page.tsx — Trimly public landing page.
 *
 * Server component. If the visitor is signed in to Cal.diy, we redirect to
 * Cal's dashboard (preserving the original /-route behaviour for staff/admin).
 * Otherwise we render the marketing landing.
 *
 * Replaces the previous redirect-only app/page.tsx that shipped with cal.diy.
 * That file has been deleted; the redirect logic for authenticated users lives
 * here so we never lose Cal's UX for staff who hit /.
 */
import { cookies, headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";

import { buildLegacyRequest } from "@lib/buildLegacyCtx";
import { buildFaqJsonLd, buildLocalBusinessJsonLd, buildOrganizationJsonLd } from "@lib/trimly/seo";

import { BillingToggle } from "./_components/BillingToggle";
import { PlanCardCTA } from "./_components/PlanCardCTA";

export const metadata = {
  title: "Trimly — Premium house-call barber. Nakuru. Nairobi by appointment.",
  description:
    "A house-call barber for premium clients in Nakuru and Nairobi. KES 2,000 in Nakuru. Subscriptions for monthly cuts. M-Pesa or card.",
  openGraph: {
    title: "Trimly — Premium house-call barber",
    description: "Booked to your home. Nakuru, Nairobi by appointment. M-Pesa or card.",
    type: "website",
  },
};

// Hero is bundled with the Next.js app for the first cut. When MinIO is
// wired up as a public storage backend (storage.trimly.co.ke), marketing
// assets can move there to enable updates without a redeploy. For now,
// shipping in /public keeps the path simple and the image edge-cacheable.
const HERO_IMAGE = "/img/hero.jpg";

export default async function MarketingPage() {
  // Route signed-in users to the right Trimly surface — NEVER to cal.diy's
  // /event-types dashboard, which would expose cal chrome to Trimly customers.
  const session = await getServerSession({
    req: buildLegacyRequest(await headers(), await cookies()),
  });

  // Inline JSON-LD: every marketing page benefits from the global
  // LocalBusiness node, and the homepage in particular gets Organization +
  // FAQPage so Google can surface brand metadata and FAQ answers as rich
  // snippets in search results.
  const homepageJsonLd = [
    buildLocalBusinessJsonLd(),
    buildOrganizationJsonLd(),
    buildFaqJsonLd(),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageJsonLd) }}
      />
      {/* ===================================================== */}
      {/* HERO                                                  */}
      {/* ===================================================== */}
      <section className="t-hero">
        <Image
          src={HERO_IMAGE}
          alt="Clipper work in a sunlit Nakuru living room."
          fill
          priority
          sizes="100vw"
          className="t-hero__img"
        />
        <div className="t-hero__vignette" />
        <div className="t-hero__content">
          <p className="t-eyebrow t-hero__eyebrow">
            Premium house-call barber · Nakuru · Nairobi by appointment
          </p>
          <h1 className="t-display">
            We come to <em>you</em>. With the right tools, the right ear, the right cut.
          </h1>
          <div className="t-hero__cta">
            <Link href="/book" className="t-btn t-btn--primary t-btn--lg">
              Book a cut · from KES 2,000
            </Link>
            <Link href="/pricing" className="t-btn t-btn--ghost">
              See subscriptions
            </Link>
          </div>
        </div>
        <p className="t-hero__scroll">Scroll</p>
      </section>

      {/* ===================================================== */}
      {/* SERVICES                                              */}
      {/* ===================================================== */}
      <section id="services" className="t-section t-section--bordered">
        <div className="t-container">
          <div className="t-section-head">
            <div>
              <p className="t-eyebrow">The services</p>
              <h2 className="t-section-title">Four cuts, no upsells.</h2>
            </div>
            <p className="t-lead">
              Every cut includes line-up, hot-towel finish, and a clean shave-down of the neck.
              No &ldquo;add-on&rdquo; fees at the door. Prices below are the Nakuru standard rate.
              Nairobi visits price separately.
            </p>
          </div>

          <div className="t-services">
            <ServiceCard
              name="The standard"
              duration="45 minutes"
              desc="Clippers, scissors, line-up, finish. Best for clients booking us monthly."
              priceKES={2000}
              unit="/ cut"
              iconPath="M7 4l10 16M17 4L7 20"
            />
            <ServiceCard
              name="The executive"
              duration="75 minutes"
              desc="Hot towel, beard sculpting, scalp treatment. The standard, with time."
              priceKES={2500}
              unit="/ cut"
              iconPath="M3 7h18M5 7v12h14V7M9 11h6M9 15h6"
            />
            <ServiceCard
              name="The beard"
              duration="30 minutes"
              desc="Beard alone — shape, edge, oil. For weeks the cut still holds."
              priceKES={1500}
              unit="/ session"
              iconPath="M4 20l8-16 8 16M8 14h8"
            />
            <ServiceCard
              name="Father & son"
              duration="75 minutes"
              desc="Two cuts, one visit. Standard tier each, same home, same chair."
              priceKES={3500}
              unit="/ household"
              iconCircle
            />
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* HOW IT WORKS                                          */}
      {/* ===================================================== */}
      <section className="t-section t-section--bordered">
        <div className="t-container">
          <div className="t-section-head">
            <div>
              <p className="t-eyebrow">How it works</p>
              <h2 className="t-section-title">Four steps, no phone calls.</h2>
            </div>
            <p className="t-lead">
              The whole booking moves through your phone. No reception desk,
              no &ldquo;we&rsquo;ll get back to you,&rdquo; no waiting list during your lunch break.
            </p>
          </div>

          <div className="t-steps">
            <div>
              <p className="t-step__num">01</p>
              <p className="t-step__narrative">
                Pick your city — <strong>Nakuru</strong> for the standard rate, <strong>Nairobi</strong>{" "}
                for a travel-premium visit. The price is shown before you choose.
              </p>
            </div>
            <div>
              <p className="t-step__num">02</p>
              <p className="t-step__narrative">
                Choose your service and a slot from this week&rsquo;s calendar. Saturday mornings book first.
              </p>
            </div>
            <div>
              <p className="t-step__num">03</p>
              <p className="t-step__narrative">
                Tell us where to find you. Estate, gate, floor. We send a <strong>WhatsApp</strong>{" "}
                when we&rsquo;re 15 minutes out.
              </p>
            </div>
            <div>
              <p className="t-step__num">04</p>
              <p className="t-step__narrative">
                Pay on your phone — <strong>M-Pesa STK</strong> or card. Both confirm before we ring the gate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* SUBSCRIPTIONS                                         */}
      {/* ===================================================== */}
      <section id="subscriptions" className="t-section t-section--bordered">
        <div className="t-container">
          <div className="t-section-head">
            <div>
              <p className="t-eyebrow">Subscriptions</p>
              <h2 className="t-section-title">
                A standing reservation, on your <em>terms</em>.
              </h2>
            </div>
            <p className="t-lead">
              For clients who book the same week every month. You get a reserved seat in the
              rotation and a per-cut rate that beats walking up to any salon in Section 58.
              Cancel any time — no penalties, no minimum term.
            </p>
          </div>

          <BillingToggle />

          <div className="t-plans">
            <PlanCard
              name="Starter"
              slug="starter"
              tagline="Two cuts a month for clients who keep it tight."
              monthlyPrice="KES 3,200"
              yearlyPrice="KES 32,000"
              monthlyWas="KES 4,000"
              yearlyWas="KES 48,000"
              features={[
                "2 standard cuts per month",
                "Saturday + one weekday slot",
                "Priority over walk-up bookings",
                "WhatsApp confirmation, every visit",
              ]}
              ctaLabel="Start with Starter"
              ctaVariant="secondary"
            />
            <PlanCard
              name="Regular"
              slug="regular"
              tagline="Weekly cuts. The best per-cut rate Trimly offers."
              monthlyPrice="KES 5,600"
              yearlyPrice="KES 56,000"
              monthlyWas="KES 8,000"
              yearlyWas="KES 96,000"
              features={[
                "4 standard cuts per month",
                "Reserved weekly slot of your choice",
                "Beard touch-up between cuts on request",
                "Free reschedule up to 4 hours before",
                "WhatsApp confirmation, every visit",
              ]}
              ctaLabel="Start with Regular"
              ctaVariant="primary"
              popular
            />
            <PlanCard
              name="Executive"
              slug="executive"
              tagline="Weekly executive cut + beard maintenance."
              monthlyPrice="KES 7,800"
              yearlyPrice="KES 78,000"
              monthlyWas="KES 10,000"
              yearlyWas="KES 120,000"
              features={[
                "4 executive cuts per month",
                "2 beard touch-ups in between",
                "Hot-towel + scalp treatment, every visit",
                "First slot of the week, guaranteed",
                "Concierge WhatsApp line",
              ]}
              ctaLabel="Start with Executive"
              ctaVariant="secondary"
            />
          </div>

          <p className="t-plan__note">
            <strong>About M-Pesa renewals.</strong> Paystack does not support automatic M-Pesa
            debit. If you subscribe with M-Pesa, you will approve an STK prompt on your phone
            each cycle. Card subscriptions renew automatically. We will text you the morning
            of renewal either way.
          </p>
        </div>
      </section>

      {/* ===================================================== */}
      {/* AREAS SERVED                                          */}
      {/* ===================================================== */}
      <section id="areas" className="t-section t-section--bordered">
        <div className="t-container">
          <div className="t-section-head">
            <div>
              <p className="t-eyebrow">Areas served</p>
              <h2 className="t-section-title">Two cities, two tiers.</h2>
            </div>
            <p className="t-lead">
              Nakuru is the home base — Monday to Saturday, standard pricing. Nairobi runs on
              selected days, at travel-premium pricing, because the round trip costs the
              founder half a day. The price difference is visible before you book; never a
              surprise at checkout.
            </p>
          </div>

          <div className="t-areas">
            <div className="t-area-tier">
              <div className="t-area-tier__head">
                <p className="t-eyebrow t-eyebrow--accent">Home base · Standard pricing</p>
                <h3 className="t-area-tier__name">Nakuru</h3>
                <p className="t-area-tier__city-meta">
                  Where the barber lives, where most weeks are. Service runs Monday through Saturday.
                </p>
              </div>
              <div className="t-area-tier__price-row">
                <p className="t-price t-area-tier__price">KES 2,000</p>
                <span className="t-area-tier__price-unit">/ cut · standard</span>
              </div>
              <ul className="t-area-tier__neighborhoods">
                {[
                  "Section 58 / Milimani",
                  "Naka",
                  "Kiamunyi",
                  "Pipeline",
                  "Lanet",
                  "Bahati",
                  "Nakuru CBD",
                ].map((neighborhood) => (
                  <li key={neighborhood}>
                    <span className="t-area-tier__pin t-area-tier__pin--nakuru" />
                    {neighborhood}
                  </li>
                ))}
              </ul>
            </div>

            <div className="t-area-tier t-area-tier--travel">
              <div className="t-area-tier__head">
                <p className="t-eyebrow">Travel visit · Premium pricing</p>
                <h3 className="t-area-tier__name">Nairobi</h3>
                <p className="t-area-tier__city-meta">
                  A four-to-six hour round trip from Nakuru. Booked on selected days only — we batch
                  trips to keep prices fair.
                </p>
              </div>
              <div className="t-area-tier__price-row">
                <p className="t-price t-area-tier__price">KES 5,000</p>
                <span className="t-area-tier__price-unit">/ cut · travel premium</span>
              </div>
              <ul className="t-area-tier__neighborhoods">
                {["Westlands", "Kilimani", "Karen", "Lavington", "Runda", "Kileleshwa"].map(
                  (neighborhood) => (
                    <li key={neighborhood}>
                      <span className="t-area-tier__pin t-area-tier__pin--nairobi" />
                      {neighborhood}
                    </li>
                  )
                )}
              </ul>
              <p className="t-area-tier__note">
                Nairobi visits are most economical for households of two or more. Add a second
                guest at KES 4,500 and split the travel premium between you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* CLIENT STORIES                                        */}
      {/* ===================================================== */}
      <section id="stories" className="t-section t-section--bordered">
        <div className="t-container">
          <div className="t-section-head">
            <div>
              <p className="t-eyebrow">In their words</p>
              <h2 className="t-section-title">From the clients in the rotation.</h2>
            </div>
            <p className="t-lead">
              Three real Nakuru and Nairobi clients on what changed when the cut started coming
              to them. Names and neighborhoods, not avatars.
            </p>
          </div>

          <div className="t-stories">
            <Story
              quote="For two years I left work twenty minutes early on a Friday to make a barbershop appointment. Now Trimly arrives at my front door in Milimani at six. The hour I get back goes to my daughter’s homework."
              name="Daniel Mwangi"
              meta="Hospital administrator · Section 58 / Milimani, Nakuru"
            />
            <Story
              quote="I needed someone who could match my old barber in Karen but actually arrive on time. The standard cut here is sharper than the salon I left, and the Nairobi day is fixed, so I plan my morning around it. Worth the premium."
              name="Wanjiku Otieno"
              meta="Investment analyst · Lavington, Nairobi"
            />
            <Story
              quote="My father is eighty-one and the steps at his local salon were a problem. We started the Regular plan in March; two cuts a month, our living room, brass clippers and a Maasai shuka over the chair. He talks about it all week."
              name="Peter Kiprotich"
              meta="Lawyer · Kiamunyi, Nakuru"
            />
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* THE STANDARD                                          */}
      {/* ===================================================== */}
      <section className="t-section t-section--bordered">
        <div className="t-container">
          <div className="t-section-head">
            <div>
              <p className="t-eyebrow">The standard</p>
              <h2 className="t-section-title">Six commitments, every visit.</h2>
            </div>
            <p className="t-lead">
              These are the rules the founder writes for himself before each week. Each one is
              a thing a barbershop usually charges extra for, or quietly drops. We do not.
            </p>
          </div>

          <ol className="t-standard">
            <Commitment
              statement={
                <>
                  Clippers, scissors and combs are <em>sterilised in barbicide</em> for the full
                  ten-minute cycle before every single client.
                </>
              }
              detail="A fresh sealed pouch travels with the chair. You see it opened. If you ever do not, the cut is free."
            />
            <Commitment
              statement="A new clipper guard, every visit. Disposable neck strips. A fresh towel per client."
              detail="Cost passes through; the line item never does."
            />
            <Commitment
              statement={
                <>
                  If we are more than <em>fifteen minutes late</em>, the visit is half-price.
                </>
              }
              detail='No "matatu traffic" excuses, no rounding the clock. You see the timestamp on the WhatsApp arrival ping.'
            />
            <Commitment
              statement="An M-Pesa receipt, or a Paystack reference, for every single transaction."
              detail="Itemised on email within the hour. Useful for company-reimbursable visits."
            />
            <Commitment
              statement={
                <>
                  A refund inside <em>twenty-four hours</em>, no debate, if you tell us the cut
                  was off.
                </>
              }
              detail="M-Pesa refunds run through Paystack support and take two business days; cards are instant."
            />
            <Commitment
              statement="Quiet by default. We do not make small talk unless you start it."
              detail="For half our clients, the forty-five minutes is the only quiet they get all week. We respect that."
            />
          </ol>
        </div>
      </section>

      {/* ===================================================== */}
      {/* FAQ                                                   */}
      {/* ===================================================== */}
      <section className="t-section t-section--bordered">
        <div className="t-container">
          <div className="t-section-head">
            <div>
              <p className="t-eyebrow">Questions</p>
              <h2 className="t-section-title">The ones we get asked first.</h2>
            </div>
            <p className="t-lead">
              Nine answers that close the most common loops. If yours isn&rsquo;t here, the
              WhatsApp link in the footer reaches the founder directly.
            </p>
          </div>

          <div className="t-faq">
            <Faq q="How do I book?">
              Pick a city, a service, a date, an address, and a payment method — five steps on a
              single page. The whole flow runs on your phone in about ninety seconds. No phone
              call, no email back-and-forth.
            </Faq>
            <Faq q="What does a Nakuru standard cut actually include?">
              Forty-five minutes of clipper and scissor work — line-up, fade, taper, and a clean
              neck shave-down. A hot-towel finish closes every cut. Beard work is included if your
              beard is part of the cut; full beard sculpting is the Executive service.
            </Faq>
            <Faq q="Do you bring the chair?">
              No. We work from any dining or kitchen chair in your home. A counter or window with
              daylight helps; we will move things gently into place. The whole setup leaves no
              trace — we sweep and pack out every visit.
            </Faq>
            <Faq q="What happens if I need to cancel?">
              Free reschedule up to four hours before the appointment. Inside four hours, we
              charge fifty percent if the slot can&rsquo;t be filled. No-shows are charged in
              full. Subscribers get one free late cancel per cycle.
            </Faq>
            <Faq q="How does the M-Pesa payment work?">
              We send an STK prompt to your phone via Paystack. You approve it with your M-Pesa
              PIN — no need to navigate the Lipa Na M-Pesa menu yourself. You receive an M-Pesa
              SMS receipt as confirmation, plus an emailed line-item receipt within the hour.
            </Faq>
            <Faq q="Is paying by card secure?">
              Yes. Card details are tokenised by Paystack — they never touch Trimly&rsquo;s
              servers. The form on this site sends an encrypted token to Paystack, who handle
              PCI-DSS compliance. We see only the last four digits and the card brand on your
              receipt.
            </Faq>
            <Faq q="Do you serve outside Nakuru and Nairobi?">
              Not yet. Nakuru is the home base; Nairobi is the only travel city. Nakuru-adjacent
              towns (Naivasha, Gilgil, Eldama Ravine) are case-by-case for executive subscribers
              — message the founder if you are in one.
            </Faq>
            <Faq q="Can I put my household on one subscription?">
              Yes — the Father &amp; Son service is built for it, and any subscription can be
              shared between two members of the same household. Add a second profile under your
              account; we&rsquo;ll alternate the cuts.
            </Faq>
            <Faq q="What if I don't like the cut?">
              Tell the founder before we leave, and we fix it on the spot. Tell us in the next
              twenty-four hours, and we refund in full. The Standard commitment is unconditional
              — there&rsquo;s nothing to argue about.
            </Faq>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* CLOSING CTA                                           */}
      {/* ===================================================== */}
      <section className="t-closing" id="book">
        <div className="t-container">
          <p className="t-eyebrow t-eyebrow--accent" style={{ marginBottom: 32 }}>
            The next cut
          </p>
          <h2 className="t-display">
            Your next cut shouldn&rsquo;t cost you a <em>Saturday</em>.
          </h2>
          <div className="t-closing__cta">
            <Link href="/book" className="t-btn t-btn--primary t-btn--lg">
              Book a cut · from KES 2,000
            </Link>
            <a
              href="https://wa.me/254700000000?text=Hi%2C%20I%27d%20like%20to%20book%20a%20cut"
              target="_blank"
              rel="noopener noreferrer"
              className="t-btn t-btn--secondary t-btn--lg">
              WhatsApp the founder
            </a>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* FOOTER                                                */}
      {/* ===================================================== */}
      <footer className="t-footer">
        <div className="t-container">
          <div className="t-footer__grid">
            <div className="t-footer__brand">
              <Link href="/" className="t-wordmark">
                Trim<em>ly</em>
              </Link>
              <p>
                A house-call barber for premium clients in Nakuru and Nairobi. Built around the
                cut, the chair you already have, and the half-hour the salon never gives back.
              </p>
            </div>
            <div>
              <h4>Services</h4>
              <ul>
                <li><Link href="/services/standard">The standard</Link></li>
                <li><Link href="/services/executive">The executive</Link></li>
                <li><Link href="/services/beard">The beard</Link></li>
                <li><Link href="/services/household">Father &amp; son</Link></li>
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li><Link href="/stories">Stories</Link></li>
                <li><Link href="/areas">Areas served</Link></li>
                <li><Link href="/legal/terms">Terms</Link></li>
                <li><Link href="/legal/privacy">Privacy</Link></li>
                <li><Link href="/legal/refund-policy">Refunds</Link></li>
              </ul>
            </div>
            <div>
              <h4>Reach us</h4>
              <ul>
                <li>
                  <a href="https://wa.me/254700000000" target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </li>
                <li><a href="mailto:hello@trimly.co.ke">hello@trimly.co.ke</a></li>
                <li>
                  <a href="https://instagram.com/trimly.co.ke" target="_blank" rel="noopener noreferrer">
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="t-footer__base">
            <p>© 2026 Trimly Co. · Nakuru, Kenya</p>
            <p>Built around the cut. Powered by Paystack &amp; Safaricom M-Pesa.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ============================================================= */
/* Inline sub-components — kept in this file because they are     */
/* used nowhere else. Extract to _components/ when reuse appears. */
/* ============================================================= */

type ServiceCardProps = {
  name: string;
  duration: string;
  desc: string;
  priceKES: number;
  unit: string;
  iconPath?: string;
  iconCircle?: boolean;
};

function ServiceCard({ name, duration, desc, priceKES, unit, iconPath, iconCircle }: ServiceCardProps) {
  return (
    <div className="t-service">
      <svg
        className="t-service__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden>
        {iconCircle ? (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M9 12l2 2 4-4" />
          </>
        ) : (
          <path d={iconPath} />
        )}
      </svg>
      <h3 className="t-service__name">{name}</h3>
      <p className="t-service__duration">{duration}</p>
      <p className="t-service__desc">{desc}</p>
      <p className="t-service__price">
        KES {priceKES.toLocaleString("en-KE")}
        <span className="t-service__price-unit">{unit}</span>
      </p>
    </div>
  );
}

type PlanCardProps = {
  name: string;
  slug: string;
  tagline: string;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyWas: string;
  yearlyWas: string;
  features: string[];
  ctaLabel: string;
  ctaVariant: "primary" | "secondary";
  popular?: boolean;
};

function PlanCard({
  name,
  slug,
  tagline,
  monthlyPrice,
  yearlyPrice,
  monthlyWas,
  yearlyWas,
  features,
  ctaLabel,
  ctaVariant,
  popular,
}: PlanCardProps) {
  return (
    <div className={popular ? "t-plan t-plan--popular" : "t-plan"}>
      {popular ? <p className="t-plan__badge">Most popular</p> : null}
      <div className="t-plan__head">
        <h3 className="t-plan__name">{name}</h3>
        <p className="t-plan__tagline">{tagline}</p>
      </div>
      <div className="t-plan__price-row">
        <p className="t-price t-plan__price" data-monthly={monthlyPrice} data-yearly={yearlyPrice}>
          {monthlyPrice}
        </p>
        <span className="t-plan__price-unit" data-monthly="/ month" data-yearly="/ year">
          / month
        </span>
        <span className="t-plan__price-was" data-monthly={monthlyWas} data-yearly={yearlyWas}>
          {monthlyWas}
        </span>
      </div>
      <ul className="t-plan__features">
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <PlanCardCTA slug={slug} label={ctaLabel} variant={ctaVariant} />
    </div>
  );
}

function Story({ quote, name, meta }: { quote: string; name: string; meta: string }) {
  return (
    <article className="t-story">
      <p className="t-story__quote">{quote}</p>
      <div className="t-story__attribution">
        <span className="t-story__name">{name}</span>
        <span className="t-story__meta">{meta}</span>
      </div>
    </article>
  );
}

function Commitment({
  statement,
  detail,
}: {
  statement: React.ReactNode;
  detail: string;
}) {
  return (
    <li>
      <div>
        <p className="t-standard__statement">{statement}</p>
        <p className="t-standard__detail">{detail}</p>
      </div>
    </li>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details>
      <summary>{q}</summary>
      <p className="t-faq__answer">{children}</p>
    </details>
  );
}
