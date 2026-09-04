-- Seed catalog permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "updatedAt")
VALUES
  ('permission_category_create', 'category:create', 'Create categories', 'Create catalog categories.', CURRENT_TIMESTAMP),
  ('permission_category_update', 'category:update', 'Update categories', 'Update catalog categories.', CURRENT_TIMESTAMP),
  ('permission_category_delete', 'category:delete', 'Delete categories', 'Delete catalog categories.', CURRENT_TIMESTAMP),
  ('permission_option_create', 'option:create', 'Create options', 'Create catalog options.', CURRENT_TIMESTAMP),
  ('permission_option_update', 'option:update', 'Update options', 'Update catalog options and option values.', CURRENT_TIMESTAMP),
  ('permission_option_delete', 'option:delete', 'Delete options', 'Delete catalog options and option values.', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updatedAt" = CURRENT_TIMESTAMP;

-- ADMIN receives every catalog permission.
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permissions" p ON p."code" IN (
  'category:create',
  'category:update',
  'category:delete',
  'option:create',
  'option:update',
  'option:delete'
)
WHERE r."code" = 'ADMIN'
ON CONFLICT DO NOTHING;

-- STAFF can maintain catalog data but cannot delete category/option structures by default.
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permissions" p ON p."code" IN (
  'category:create',
  'category:update',
  'option:create',
  'option:update'
)
WHERE r."code" = 'STAFF'
ON CONFLICT DO NOTHING;
