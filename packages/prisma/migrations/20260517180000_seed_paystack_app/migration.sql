-- Seed Paystack as a payment app and create a default credential for it
INSERT INTO "App" (slug, "dirName", keys, categories, "createdAt", "updatedAt", enabled)
VALUES (
  'paystack',
  'paystackpayment',
  '{"secret_key": "", "public_key": ""}',
  ARRAY['payment']::"AppCategories"[],
  NOW(),
  NOW(),
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Create a credential so the payment service can be instantiated.
-- The actual keys come from env vars, not from the credential row.
INSERT INTO "Credential" (type, key, "appId")
VALUES (
  'paystack_payment',
  '{}',
  'paystack'
)
ON CONFLICT DO NOTHING;
