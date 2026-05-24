-- =============================================================================
-- Re-seed Trimly data after the TRIMLY_FORCE_RESET_DB drift.
--
-- TRIMLY_FORCE_RESET_DB (b445eb0 / c4db469) dropped TrimlyPlan, TrimlyService,
-- and the Paystack App + Credential rows, then deleted the trimly_initial
-- migration record so Prisma would replay it. The replay never finished
-- successfully, but Prisma kept the LATER seed migrations
-- (20260516160000_seed_trimly_plans, 20260517180000_seed_paystack_app)
-- recorded as applied. So when the schema came back, the seed rows were
-- gone and Prisma had no reason to re-insert them.
--
-- Symptom: visiting /account/subscription?plan=starter shows "Plan not
-- found" because prisma.trimlyPlan.findUnique returns null on an empty
-- table.
--
-- This migration is idempotent (ON CONFLICT DO NOTHING) so:
--   - On a healthy DB where the rows already exist, it's a no-op.
--   - On a drifted DB where the rows are missing, it inserts them.
--   - On a fresh DB it ALSO inserts them, then 20260516160000_seed_trimly_plans
--     and 20260517180000_seed_paystack_app run later and become no-ops too.
--
-- Forward-only, additive, never deletes anything.
-- =============================================================================

-- Trimly subscription plans -------------------------------------------------
INSERT INTO "TrimlyPlan" (id, slug, name, "cutsPerMonth", "priceKES", "intervalMonths", "isActive") VALUES
  ('plan_starter',   'starter',   'Starter',   2, 3200, 1, true),
  ('plan_regular',   'regular',   'Regular',   4, 5600, 1, true),
  ('plan_executive', 'executive', 'Executive', 4, 7800, 1, true)
ON CONFLICT (slug) DO NOTHING;

-- Paystack App row (so Cal's payment system can locate the integration) ----
-- Mirrors 20260517180000_seed_paystack_app exactly; safe to re-run.
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

-- Paystack Credential row (the runtime keys come from env vars, not this row,
-- but the row needs to exist for the payment service to instantiate) -------
INSERT INTO "Credential" (type, key, "appId")
SELECT 'paystack_payment', '{}'::jsonb, 'paystack'
WHERE NOT EXISTS (
  SELECT 1 FROM "Credential" WHERE type = 'paystack_payment' AND "appId" = 'paystack'
);
