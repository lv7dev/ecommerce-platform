import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogActorEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ example: 'admin@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'Demo Admin' })
  name: string | null;
}

export class AuditLogEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiPropertyOptional({ type: AuditLogActorEntity })
  actor: AuditLogActorEntity | null;

  @ApiProperty({ example: 'user.status_updated' })
  action: string;

  @ApiPropertyOptional({ example: 'User' })
  targetType: string | null;

  @ApiPropertyOptional({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  targetId: string | null;

  @ApiPropertyOptional({
    example: { previousStatus: 'ACTIVE', nextStatus: 'SUSPENDED' },
  })
  metadata: unknown;

  @ApiPropertyOptional({ example: '127.0.0.1' })
  ipAddress: string | null;

  @ApiPropertyOptional({ example: 'Mozilla/5.0' })
  userAgent: string | null;

  @ApiProperty({ example: '2026-09-04T00:00:00.000Z' })
  createdAt: string;
}

export class AuditLogListEntity {
  @ApiProperty({ type: [AuditLogEntity] })
  items: AuditLogEntity[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}
