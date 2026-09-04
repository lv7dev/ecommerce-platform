-- CreateTable
CREATE TABLE "role_translations" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "role_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_translations" (
    "id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permission_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_translations_role_id_locale_key" ON "role_translations"("role_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "permission_translations_permission_id_locale_key" ON "permission_translations"("permission_id", "locale");

-- AddForeignKey
ALTER TABLE "role_translations" ADD CONSTRAINT "role_translations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_translations" ADD CONSTRAINT "permission_translations_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed role translations
INSERT INTO "role_translations" ("id", "role_id", "locale", "name", "description")
SELECT
  'role_translation_' || lower(r."code") || '_en',
  r."id",
  'en'::"Locale",
  v."name_en",
  v."description_en"
FROM "roles" r
JOIN (
  VALUES
    ('ADMIN', 'Administrator', 'Full back-office access.'),
    ('STAFF', 'Staff', 'Operational back-office access.'),
    ('CUSTOMER', 'Customer', 'Default shopper access.')
) AS v("code", "name_en", "description_en") ON v."code" = r."code"
ON CONFLICT ("role_id", "locale") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description";

INSERT INTO "role_translations" ("id", "role_id", "locale", "name", "description")
SELECT
  'role_translation_' || lower(r."code") || '_vi',
  r."id",
  'vi'::"Locale",
  v."name_vi",
  v."description_vi"
FROM "roles" r
JOIN (
  VALUES
    ('ADMIN', 'Quản trị viên', 'Toàn quyền truy cập khu vực quản trị.'),
    ('STAFF', 'Nhân viên', 'Quyền vận hành khu vực quản trị.'),
    ('CUSTOMER', 'Khách hàng', 'Quyền mua sắm mặc định.')
) AS v("code", "name_vi", "description_vi") ON v."code" = r."code"
ON CONFLICT ("role_id", "locale") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description";

-- Seed permission translations
INSERT INTO "permission_translations" ("id", "permission_id", "locale", "name", "description")
SELECT
  'permission_translation_' || replace(p."code", ':', '_') || '_en',
  p."id",
  'en'::"Locale",
  v."name_en",
  v."description_en"
FROM "permissions" p
JOIN (
  VALUES
    ('auth:me', 'Read own profile', 'View the authenticated user profile.'),
    ('cart:manage_own', 'Manage own cart', 'Create and update the authenticated user cart.'),
    ('order:create_own', 'Create own order', 'Create orders for the authenticated user.'),
    ('order:read_own', 'Read own orders', 'View orders owned by the authenticated user.'),
    ('category:create', 'Create categories', 'Create catalog categories.'),
    ('category:update', 'Update categories', 'Update catalog categories.'),
    ('category:delete', 'Delete categories', 'Delete catalog categories.'),
    ('option:create', 'Create options', 'Create catalog options.'),
    ('option:update', 'Update options', 'Update catalog options and option values.'),
    ('option:delete', 'Delete options', 'Delete catalog options and option values.'),
    ('product:create', 'Create products', 'Create catalog products.'),
    ('product:update', 'Update products', 'Update catalog products.'),
    ('product:delete', 'Delete products', 'Delete catalog products.'),
    ('order:read', 'Read orders', 'View customer orders.'),
    ('order:update_status', 'Update order status', 'Change order fulfillment and payment status.'),
    ('user:read', 'Read users', 'View user accounts.'),
    ('user:update', 'Update users', 'Update user accounts.'),
    ('user:manage_roles', 'Manage user roles', 'Assign and remove user roles.'),
    ('user:suspend', 'Suspend users', 'Temporarily block user access.'),
    ('user:ban', 'Ban users', 'Permanently block user access.'),
    ('session:revoke', 'Revoke sessions', 'Force logout user sessions.')
) AS v("code", "name_en", "description_en") ON v."code" = p."code"
ON CONFLICT ("permission_id", "locale") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description";

INSERT INTO "permission_translations" ("id", "permission_id", "locale", "name", "description")
SELECT
  'permission_translation_' || replace(p."code", ':', '_') || '_vi',
  p."id",
  'vi'::"Locale",
  v."name_vi",
  v."description_vi"
FROM "permissions" p
JOIN (
  VALUES
    ('auth:me', 'Xem hồ sơ cá nhân', 'Xem hồ sơ của người dùng đang đăng nhập.'),
    ('cart:manage_own', 'Quản lý giỏ hàng cá nhân', 'Tạo và cập nhật giỏ hàng của người dùng đang đăng nhập.'),
    ('order:create_own', 'Tạo đơn hàng cá nhân', 'Tạo đơn hàng cho người dùng đang đăng nhập.'),
    ('order:read_own', 'Xem đơn hàng cá nhân', 'Xem đơn hàng thuộc về người dùng đang đăng nhập.'),
    ('category:create', 'Tạo danh mục', 'Tạo danh mục sản phẩm.'),
    ('category:update', 'Cập nhật danh mục', 'Cập nhật danh mục sản phẩm.'),
    ('category:delete', 'Xóa danh mục', 'Xóa danh mục sản phẩm.'),
    ('option:create', 'Tạo thuộc tính', 'Tạo thuộc tính sản phẩm.'),
    ('option:update', 'Cập nhật thuộc tính', 'Cập nhật thuộc tính và giá trị thuộc tính sản phẩm.'),
    ('option:delete', 'Xóa thuộc tính', 'Xóa thuộc tính và giá trị thuộc tính sản phẩm.'),
    ('product:create', 'Tạo sản phẩm', 'Tạo sản phẩm trong catalog.'),
    ('product:update', 'Cập nhật sản phẩm', 'Cập nhật sản phẩm trong catalog.'),
    ('product:delete', 'Xóa sản phẩm', 'Xóa sản phẩm trong catalog.'),
    ('order:read', 'Xem đơn hàng', 'Xem đơn hàng của khách hàng.'),
    ('order:update_status', 'Cập nhật trạng thái đơn hàng', 'Thay đổi trạng thái thanh toán và xử lý đơn hàng.'),
    ('user:read', 'Xem người dùng', 'Xem tài khoản người dùng.'),
    ('user:update', 'Cập nhật người dùng', 'Cập nhật tài khoản người dùng.'),
    ('user:manage_roles', 'Quản lý vai trò người dùng', 'Gán và gỡ vai trò của người dùng.'),
    ('user:suspend', 'Tạm khóa người dùng', 'Tạm thời chặn quyền truy cập của người dùng.'),
    ('user:ban', 'Cấm người dùng', 'Chặn vĩnh viễn quyền truy cập của người dùng.'),
    ('session:revoke', 'Thu hồi phiên đăng nhập', 'Buộc đăng xuất các phiên của người dùng.')
) AS v("code", "name_vi", "description_vi") ON v."code" = p."code"
ON CONFLICT ("permission_id", "locale") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description";
