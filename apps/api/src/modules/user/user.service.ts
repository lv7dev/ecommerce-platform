import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { userInclude } from './constants/user.include';
import { AssignRoleDto } from './dto/assign-role.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserEntity, UserListEntity } from './entities/user.entity';
import { toUserEntity } from './mappers/user.mapper';

interface UserActionContext {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(query: FindUsersQueryDto): Promise<UserListEntity> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhereInput(query);

    const { items, total } = await this.prisma.$transaction(async (tx) => {
      const items = await tx.user.findMany({
        where,
        include: userInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await tx.user.count({ where });

      return { items, total };
    });

    return {
      items: items.map((user) => toUserEntity(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<UserEntity> {
    return toUserEntity(await this.ensureUserExists(id));
  }

  async updateStatus(
    id: string,
    updateUserStatusDto: UpdateUserStatusDto,
    actor: AuthenticatedUser,
    context: UserActionContext,
  ): Promise<UserEntity> {
    const previousUser = await this.ensureUserExists(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { status: updateUserStatusDto.status },
      include: userInclude,
    });

    if (updateUserStatusDto.status !== UserStatus.ACTIVE) {
      await this.revokeAllSessions(id);
    }

    await this.auditLogService.create({
      actorId: actor.id,
      action: 'user.status_updated',
      targetType: 'User',
      targetId: id,
      metadata: {
        previousStatus: previousUser.status,
        nextStatus: updateUserStatusDto.status,
      },
      ...context,
    });

    return toUserEntity(user);
  }

  async assignRole(
    id: string,
    assignRoleDto: AssignRoleDto,
    actor: AuthenticatedUser,
    context: UserActionContext,
  ): Promise<UserEntity> {
    await this.ensureUserExists(id);
    const role = await this.prisma.role.findUnique({
      where: { code: assignRoleDto.roleCode },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        roles: {
          connectOrCreate: {
            where: {
              userId_roleId: {
                userId: id,
                roleId: role.id,
              },
            },
            create: {
              roleId: role.id,
            },
          },
        },
      },
      include: userInclude,
    });

    await this.auditLogService.create({
      actorId: actor.id,
      action: 'user.role_assigned',
      targetType: 'User',
      targetId: id,
      metadata: { roleCode: role.code },
      ...context,
    });

    return toUserEntity(user);
  }

  async removeRole(
    id: string,
    roleCode: string,
    actor: AuthenticatedUser,
    context: UserActionContext,
  ): Promise<UserEntity> {
    await this.ensureUserExists(id);
    const role = await this.prisma.role.findUnique({
      where: { code: roleCode },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const userRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: id,
          roleId: role.id,
        },
      },
    });

    if (userRole) {
      await this.prisma.userRole.delete({
        where: {
          userId_roleId: {
            userId: id,
            roleId: role.id,
          },
        },
      });
    }

    await this.auditLogService.create({
      actorId: actor.id,
      action: 'user.role_removed',
      targetType: 'User',
      targetId: id,
      metadata: { roleCode: role.code, removed: Boolean(userRole) },
      ...context,
    });

    return toUserEntity(await this.ensureUserExists(id));
  }

  async revokeSessions(
    id: string,
    actor: AuthenticatedUser,
    context: UserActionContext,
  ): Promise<{ revokedCount: number }> {
    await this.ensureUserExists(id);
    const revokedCount = await this.revokeAllSessions(id);

    await this.auditLogService.create({
      actorId: actor.id,
      action: 'user.sessions_revoked',
      targetType: 'User',
      targetId: id,
      metadata: { revokedCount },
      ...context,
    });

    return { revokedCount };
  }

  private async revokeAllSessions(userId: string): Promise<number> {
    const result = await this.prisma.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return result.count;
  }

  private async ensureUserExists(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: userInclude,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private buildWhereInput(query: FindUsersQueryDto): Prisma.UserWhereInput {
    const conditions: Prisma.UserWhereInput[] = [];

    if (query.status) {
      conditions.push({ status: query.status });
    }

    if (query.roleCode) {
      conditions.push({
        roles: {
          some: {
            role: {
              code: query.roleCode,
            },
          },
        },
      });
    }

    if (query.search) {
      conditions.push({
        OR: [
          { email: { contains: query.search, mode: 'insensitive' } },
          { name: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    return conditions.length ? { AND: conditions } : {};
  }
}
