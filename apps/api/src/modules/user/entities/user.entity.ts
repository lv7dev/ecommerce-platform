import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Locale, UserStatus } from '../../../generated/prisma/client';

export class AccessTranslationEntity {
  @ApiProperty({ enum: Locale, example: Locale.vi })
  locale: Locale;

  @ApiProperty({ example: 'Quản trị viên' })
  name: string;

  @ApiPropertyOptional({ example: 'Toàn quyền truy cập khu vực quản trị.' })
  description: string | null;
}

export class UserRoleEntity {
  @ApiProperty({ example: 'ADMIN' })
  code: string;

  @ApiProperty({ example: 'Administrator' })
  name: string;

  @ApiPropertyOptional({ example: 'Full back-office access.' })
  description: string | null;

  @ApiProperty({ type: [AccessTranslationEntity] })
  translations: AccessTranslationEntity[];
}

export class UserPermissionEntity {
  @ApiProperty({ example: 'user:read' })
  code: string;

  @ApiProperty({ example: 'Read users' })
  name: string;

  @ApiPropertyOptional({ example: 'View user accounts.' })
  description: string | null;

  @ApiProperty({ type: [AccessTranslationEntity] })
  translations: AccessTranslationEntity[];
}

export class UserEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ example: 'customer@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'Luong Anh Tuan' })
  name: string | null;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiPropertyOptional({ example: '2026-09-04T00:00:00.000Z' })
  emailVerifiedAt: string | null;

  @ApiPropertyOptional({ example: '2026-09-04T00:00:00.000Z' })
  lastLoginAt: string | null;

  @ApiProperty({ type: [UserRoleEntity] })
  roles: UserRoleEntity[];

  @ApiProperty({ type: [UserPermissionEntity] })
  permissions: UserPermissionEntity[];

  @ApiProperty({ example: '2026-09-04T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-04T00:00:00.000Z' })
  updatedAt: string;
}

export class UserListEntity {
  @ApiProperty({ type: [UserEntity] })
  items: UserEntity[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}
