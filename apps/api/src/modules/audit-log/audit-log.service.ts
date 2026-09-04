import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FindAuditLogsQueryDto } from './dto/find-audit-logs-query.dto';
import {
  AuditLogEntity,
  AuditLogListEntity,
} from './entities/audit-log.entity';

export interface CreateAuditLogInput {
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: input.actorId,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId,
          metadata: input.metadata,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to write audit log for action ${input.action}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async findAll(query: FindAuditLogsQueryDto): Promise<AuditLogListEntity> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhereInput(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toEntity(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private buildWhereInput(
    query: FindAuditLogsQueryDto,
  ): Prisma.AuditLogWhereInput {
    const conditions: Prisma.AuditLogWhereInput[] = [];

    if (query.actorId) {
      conditions.push({ actorId: query.actorId });
    }

    if (query.action) {
      conditions.push({ action: query.action });
    }

    if (query.targetType) {
      conditions.push({ targetType: query.targetType });
    }

    if (query.targetId) {
      conditions.push({ targetId: query.targetId });
    }

    return conditions.length ? { AND: conditions } : {};
  }

  private toEntity(
    item: Prisma.AuditLogGetPayload<{
      include: {
        actor: {
          select: {
            id: true;
            email: true;
            name: true;
          };
        };
      };
    }>,
  ): AuditLogEntity {
    return {
      id: item.id,
      actor: item.actor,
      action: item.action,
      targetType: item.targetType,
      targetId: item.targetId,
      metadata: item.metadata,
      ipAddress: item.ipAddress,
      userAgent: item.userAgent,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
