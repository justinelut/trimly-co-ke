-- Seed TrimlyPlan with default subscription plans
INSERT INTO "TrimlyPlan" (id, slug, name, "cutsPerMonth", "priceKES", "intervalMonths", "isActive") VALUES
  ('plan_starter', 'starter', 'Starter', 2, 3200, 1, true),
  ('plan_regular', 'regular', 'Regular', 4, 5600, 1, true),
  ('plan_executive', 'executive', 'Executive', 4, 7800, 1, true)
ON CONFLICT (slug) DO NOTHING;
