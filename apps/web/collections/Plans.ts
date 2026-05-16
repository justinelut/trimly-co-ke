import type { CollectionConfig } from "payload";

export const Plans: CollectionConfig = {
  slug: "plans",
  admin: { useAsTitle: "name" },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "tagline", type: "text", required: true },
    { name: "monthlyPrice", type: "number", required: true, label: "Monthly KES" },
    { name: "yearlyPrice", type: "number", required: true, label: "Yearly KES" },
    { name: "monthlyWas", type: "number", label: "Monthly was KES (strikethrough)" },
    { name: "yearlyWas", type: "number", label: "Yearly was KES (strikethrough)" },
    {
      name: "features",
      type: "array",
      fields: [{ name: "feature", type: "text", required: true }],
    },
    { name: "ctaLabel", type: "text", defaultValue: "Get started" },
    { name: "popular", type: "checkbox", defaultValue: false },
    { name: "order", type: "number", defaultValue: 0 },
    { name: "isActive", type: "checkbox", defaultValue: true },
  ],
};
