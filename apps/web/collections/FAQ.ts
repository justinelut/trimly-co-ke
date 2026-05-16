import type { CollectionConfig } from "payload";

export const FAQ: CollectionConfig = {
  slug: "faq",
  admin: { useAsTitle: "question" },
  fields: [
    { name: "question", type: "text", required: true },
    { name: "answer", type: "textarea", required: true },
    { name: "order", type: "number", defaultValue: 0 },
    { name: "isActive", type: "checkbox", defaultValue: true },
  ],
};
