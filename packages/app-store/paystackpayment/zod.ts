import { z } from "zod";

export const appDataSchema = z.object({
  price: z.number(),
  currency: z.string().default("KES"),
  paymentOption: z.enum(["ON_BOOKING"]).default("ON_BOOKING"),
});

export const appKeysSchema = z.object({
  secret_key: z.string(),
  public_key: z.string(),
});
