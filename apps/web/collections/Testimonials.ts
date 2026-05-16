import type { CollectionConfig } from "payload";

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  admin: { useAsTitle: "name" },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "meta", type: "text", required: true, admin: { description: "e.g. 'Lawyer · Kiamunyi, Nakuru'" } },
    { name: "quote", type: "textarea", required: true },
    { name: "order", type: "number", defaultValue: 0 },
    { name: "isActive", type: "checkbox", defaultValue: true },
  ],
};
