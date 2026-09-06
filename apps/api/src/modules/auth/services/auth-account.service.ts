import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { UserStatus } from '../../../generated/prisma/client';

@Injectable()
export class AuthAccountService {
  constructor(private readonly prisma: PrismaService) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  ensureUserCanAuthenticate(status: UserStatus): void {
    if (status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User account is not active');
    }
  }

  async ensureEmailIsAvailable(email: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
  }

  async ensureSystemRoles(): Promise<void> {
    await this.prisma.role.upsert({
      where: { code: 'CUSTOMER' },
      update: {},
      create: {
        code: 'CUSTOMER',
        description: 'Default shopper access.',
        isSystem: true,
        name: 'Customer',
      },
    });

    await this.prisma.role.upsert({
      where: { code: 'ADMIN' },
      update: {},
      create: {
        code: 'ADMIN',
        description: 'Full back-office access.',
        isSystem: true,
        name: 'Administrator',
      },
    });
  }
}
