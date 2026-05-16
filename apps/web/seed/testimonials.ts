import type { Payload } from "payload";

export async function seedTestimonials(payload: Payload) {
  const data = [
    { name: "Daniel Mwangi", meta: "Hospital administrator · Section 58 / Milimani, Nakuru", quote: "For two years I left work twenty minutes early on a Friday to make a barbershop appointment. Now Trimly arrives at my front door in Milimani at six. The hour I get back goes to my daughter's homework.", order: 1 },
    { name: "Wanjiku Otieno", meta: "Investment analyst · Lavington, Nairobi", quote: "I needed someone who could match my old barber in Karen but actually arrive on time. The standard cut here is sharper than the salon I left, and the Nairobi day is fixed, so I plan my morning around it. Worth the premium.", order: 2 },
    { name: "Peter Kiprotich", meta: "Lawyer · Kiamunyi, Nakuru", quote: "My father is eighty-one and the steps at his local salon were a problem. We started the Regular plan in March; two cuts a month, our living room, brass clippers and a Maasai shuka over the chair. He talks about it all week.", order: 3 },
  ];
  for (const d of data) await payload.create({ collection: "testimonials", data: { ...d, isActive: true } });
  payload.logger.info(`[seed] ${data.length} testimonials`);
}
