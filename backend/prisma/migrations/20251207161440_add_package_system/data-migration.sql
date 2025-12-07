-- Data Migration Script: Convert existing subscriptions to use packages
-- This script creates "legacy" packages for each unique service+planType combination
-- and updates existing subscriptions to reference these packages

-- Step 1: Create legacy packages for each unique service+planType combination in existing subscriptions
INSERT INTO packages (id, name, description, plan_type, base_price, discount_amount, final_price, is_active, created_at, updated_at)
SELECT
  gen_random_uuid(),
  CONCAT('Pacote ', s.name, ' - ',
    CASE sub.plan_type
      WHEN 'WEEKLY' THEN 'Semanal'
      WHEN 'BIWEEKLY' THEN 'Quinzenal'
    END) as name,
  'Pacote criado automaticamente na migração de dados' as description,
  sub.plan_type,
  s.price as base_price,
  0 as discount_amount,
  s.price as final_price,
  true as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM (
  SELECT DISTINCT service_id, plan_type
  FROM subscriptions
  WHERE service_id IS NOT NULL
) sub
INNER JOIN services s ON s.id = sub.service_id;

-- Step 2: Create PackageService relationships for the legacy packages
INSERT INTO package_services (id, package_id, service_id, created_at)
SELECT
  gen_random_uuid(),
  p.id,
  ps.service_id,
  NOW()
FROM packages p
INNER JOIN (
  SELECT DISTINCT sub.service_id, sub.plan_type
  FROM subscriptions sub
  WHERE sub.service_id IS NOT NULL
) ps ON p.plan_type = ps.plan_type
  AND p.description = 'Pacote criado automaticamente na migração de dados'
  AND EXISTS (
    SELECT 1 FROM services s
    WHERE s.id = ps.service_id
      AND p.name LIKE CONCAT('Pacote ', s.name, '%')
  );

-- Step 3: Update subscriptions to use packageId
UPDATE subscriptions sub
SET package_id = (
  SELECT p.id
  FROM packages p
  INNER JOIN package_services pserv ON pserv.package_id = p.id
  WHERE p.plan_type = sub.plan_type
    AND pserv.service_id = sub.service_id
    AND p.description = 'Pacote criado automaticamente na migração de dados'
  LIMIT 1
)
WHERE sub.service_id IS NOT NULL
  AND sub.package_id IS NULL;

-- Step 4: Create AppointmentService entries for existing appointments
-- This maintains compatibility with the new multi-service system
INSERT INTO appointment_services (id, appointment_id, service_id, created_at)
SELECT
  gen_random_uuid(),
  a.id,
  a.service_id,
  NOW()
FROM appointments a
WHERE a.service_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM appointment_services aps
    WHERE aps.appointment_id = a.id AND aps.service_id = a.service_id
  );

-- Verify migration results
-- Uncomment these to check migration status:
-- SELECT COUNT(*) as legacy_packages_created FROM packages WHERE description = 'Pacote criado automaticamente na migração de dados';
-- SELECT COUNT(*) as subscriptions_migrated FROM subscriptions WHERE package_id IS NOT NULL;
-- SELECT COUNT(*) as subscriptions_pending FROM subscriptions WHERE service_id IS NOT NULL AND package_id IS NULL;
-- SELECT COUNT(*) as appointment_services_created FROM appointment_services;
