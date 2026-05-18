-- Seed admin user: justinequartz@gmail.com
INSERT INTO "users" (email, username, "completedOnboarding", "identityProvider", locale, "timeZone", metadata, uuid, role, name, "emailVerified")
VALUES (
  'justinequartz@gmail.com',
  'justinequartz',
  true,
  'CAL',
  'en',
  'Africa/Nairobi',
  '{}',
  gen_random_uuid(),
  'ADMIN',
  'Justine Quartz',
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Set password (Ch%L$ea#1)
INSERT INTO "UserPassword" ("userId", hash)
SELECT id, '$2a$10$AHgUeojQCx/WinQ.Xx81F.yjampbxGzb7dDF4Ri8QHSurb89qRLVO'
FROM "users" WHERE email = 'justinequartz@gmail.com'
ON CONFLICT ("userId") DO NOTHING;
