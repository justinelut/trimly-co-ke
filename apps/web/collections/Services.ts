import type { CollectionConfig } from "payload";

export const Services: CollectionConfig = {
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
    { name: "iconPath", type: "text", admin: { description: "SVG path d attribute for the service icon" } },
    { name: "isActive", type: "checkbox", defaultValue: true },
    { name: "order", type: "number", defaultValue: 0 },
  ],
};
