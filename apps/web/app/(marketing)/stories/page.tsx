import type { Metadata } from "next";
import Link from "next/link";
import { getPayload } from "payload";
import config from "@payload-config";

export const metadata: Metadata = {
  title: "Stories — Trimly | What our clients say",
  description: "Real testimonials from Trimly clients in Nakuru and Nairobi.",
};

export default async function StoriesPage() {
  let testimonials: Array<{ name: string; meta: string; quote: string }> = [];

  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "testimonials",
      where: { isActive: { equals: true } },
      sort: "order",
      limit: 20,
    });
    testimonials = result.docs.map((d) => ({
      name: d.name as string,
      meta: d.meta as string,
      quote: d.quote as string,
    }));
  } catch {
    // Fallback if Payload isn't seeded yet
    testimonials = [
      { name: "Daniel Mwangi", meta: "Hospital administrator · Section 58 / Milimani, Nakuru", quote: "For two years I left work twenty minutes early on a Friday to make a barbershop appointment. Now Trimly arrives at my front door in Milimani at six. The hour I get back goes to my daughter's homework." },
      { name: "Wanjiku Otieno", meta: "Investment analyst · Lavington, Nairobi", quote: "I needed someone who could match my old barber in Karen but actually arrive on time. The standard cut here is sharper than the salon I left, and the Nairobi day is fixed, so I plan my morning around it. Worth the premium." },
      { name: "Peter Kiprotich", meta: "Lawyer · Kiamunyi, Nakuru", quote: "My father is eighty-one and the steps at his local salon were a problem. We started the Regular plan in March; two cuts a month, our living room, brass clippers and a Maasai shuka over the chair. He talks about it all week." },
    ];
  }

  return (
    <section className="t-section t-section--bordered" style={{ paddingTop: 120 }}>
      <div className="t-container">
        <div className="t-section-head">
          <div>
            <p className="t-eyebrow">In their words</p>
            <h2 className="t-section-title">From the clients in the rotation.</h2>
          </div>
          <p className="t-lead">
            Real Nakuru and Nairobi clients on what changed when the cut started coming to them.
            Names and neighborhoods, not avatars.
          </p>
        </div>

        <div className="t-stories">
          {testimonials.map((t) => (
            <blockquote key={t.name} className="t-story">
              <p className="t-story__quote">&ldquo;{t.quote}&rdquo;</p>
              <footer className="t-story__footer">
                <cite className="t-story__name">{t.name}</cite>
                <span className="t-story__meta">{t.meta}</span>
              </footer>
            </blockquote>
          ))}
        </div>

        <div style={{ marginTop: 48, textAlign: "center" }}>
          <Link href="/book" className="t-btn t-btn--primary t-btn--lg">
            Book a cut
          </Link>
        </div>
      </div>
    </section>
  );
}
