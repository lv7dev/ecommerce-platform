-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'DELETED');

-- AlterTable
ALTER TABLE "users"
ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "email_verified_at" TIMESTAMP(3),
ADD COLUMN "last_login_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateIndex
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions"("user_id");

-- CreateIndex
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed system roles
INSERT INTO "roles" ("id", "code", "name", "description", "is_system", "updatedAt")
VALUES
  ('role_admin', 'ADMIN', 'Administrator', 'Full back-office access.', true, CURRENT_TIMESTAMP),
  ('role_staff', 'STAFF', 'Staff', 'Operational back-office access.', true, CURRENT_TIMESTAMP),
  ('role_customer', 'CUSTOMER', 'Customer', 'Default shopper access.', true, CURRENT_TIMESTAMP);

-- Seed system permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "updatedAt")
VALUES
  ('permission_auth_me', 'auth:me', 'Read own profile', 'View the authenticated user profile.', CURRENT_TIMESTAMP),
  ('permission_cart_manage_own', 'cart:manage_own', 'Manage own cart', 'Create and update the authenticated user cart.', CURRENT_TIMESTAMP),
  ('permission_order_create_own', 'order:create_own', 'Create own order', 'Create orders for the authenticated user.', CURRENT_TIMESTAMP),
  ('permission_order_read_own', 'order:read_own', 'Read own orders', 'View orders owned by the authenticated user.', CURRENT_TIMESTAMP),
  ('permission_product_create', 'product:create', 'Create products', 'Create catalog products.', CURRENT_TIMESTAMP),
  ('permission_product_update', 'product:update', 'Update products', 'Update catalog products.', CURRENT_TIMESTAMP),
  ('permission_product_delete', 'product:delete', 'Delete products', 'Delete catalog products.', CURRENT_TIMESTAMP),
  ('permission_order_read', 'order:read', 'Read orders', 'View customer orders.', CURRENT_TIMESTAMP),
  ('permission_order_update_status', 'order:update_status', 'Update order status', 'Change order fulfillment and payment status.', CURRENT_TIMESTAMP),
  ('permission_user_read', 'user:read', 'Read users', 'View user accounts.', CURRENT_TIMESTAMP),
  ('permission_user_update', 'user:update', 'Update users', 'Update user accounts.', CURRENT_TIMESTAMP),
  ('permission_user_manage_roles', 'user:manage_roles', 'Manage user roles', 'Assign and remove user roles.', CURRENT_TIMESTAMP),
  ('permission_user_suspend', 'user:suspend', 'Suspend users', 'Temporarily block user access.', CURRENT_TIMESTAMP),
  ('permission_user_ban', 'user:ban', 'Ban users', 'Permanently block user access.', CURRENT_TIMESTAMP),
  ('permission_session_revoke', 'session:revoke', 'Revoke sessions', 'Force logout user sessions.', CURRENT_TIMESTAMP);

-- Assign default role permissions
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."code" = 'ADMIN';

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permissions" p ON p."code" IN (
  'order:read',
  'order:update_status',
  'product:create',
  'product:update',
  'user:read'
)
WHERE r."code" = 'STAFF';

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permissions" p ON p."code" IN (
  'auth:me',
  'cart:manage_own',
  'order:create_own',
  'order:read_own'
)
WHERE r."code" = 'CUSTOMER';
