import type { CollectionConfig } from "payload";

export const Areas: CollectionConfig = {
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
