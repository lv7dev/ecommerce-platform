import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { AuthRequestContext } from '../types/auth-request-context.type';

export interface AuthAuditInput extends AuthRequestContext {
  action: string;
  actorId?: string | null;
  metadata?: Prisma.InputJsonValue;
  targetId?: string | null;
  targetType?: string | null;
}

@Injectable()
export class AuthAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: AuthAuditInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: input,
      });
    } catch {
      return;
    }
  }
}
