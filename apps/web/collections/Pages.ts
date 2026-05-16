import type { CollectionConfig } from "payload";

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: { useAsTitle: "title" },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    { name: "content", type: "richText" },
    { name: "metaTitle", type: "text" },
    { name: "metaDescription", type: "textarea" },
    { name: "publishedAt", type: "date" },
    { name: "status", type: "select", options: ["draft", "published"], defaultValue: "draft" },
  ],
};
