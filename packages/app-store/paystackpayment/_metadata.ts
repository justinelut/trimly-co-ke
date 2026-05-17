import type { AppMeta } from "@calcom/types/App";

export const metadata = {
  name: "Paystack",
  description: "Accept payments via M-Pesa and Card through Paystack. Custom checkout UI — no redirects.",
  installed: !!(process.env.PAYSTACK_SECRET_KEY && process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY),
  slug: "paystack",
  category: "payment",
  categories: ["payment"],
  logo: "icon.svg",
  publisher: "Trimly",
  title: "Paystack",
  type: "paystack_payment",
  url: "https://paystack.com",
  docsUrl: "https://paystack.com/docs",
  variant: "payment",
  extendsFeature: "EventType",
  email: "hello@trimly.co.ke",
  dirName: "paystackpayment",
  isOAuth: false,
} as AppMeta;

export default metadata;
