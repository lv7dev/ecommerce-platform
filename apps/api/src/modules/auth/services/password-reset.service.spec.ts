import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { AuthAccountService } from './auth-account.service';
import { AuthAuditService } from './auth-audit.service';
import { AuthOpaqueTokenService } from './auth-opaque-token.service';
import { AuthSessionService } from './auth-session.service';
import { PasswordResetService } from './password-reset.service';
import { PasswordService } from './password.service';

type PasswordResetPrismaMock = {
  $transaction: jest.Mock;
  passwordResetToken: {
    findUnique: jest.Mock;
    updateMany: jest.Mock;
  };
  user: {
    update: jest.Mock;
  };
};

type ResetTokenClaimArgs = {
  data: {
    usedAt: Date;
  };
  where: {
    expiresAt: {
      gt: Date;
    };
    id: string;
    usedAt: null;
  };
};

type UserUpdateArgs = {
  data: {
    passwordHash: string;
  };
  where: {
    id: string;
  };
};

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let prisma: PasswordResetPrismaMock;
  let authOpaqueTokenService: {
    getOpaqueTokenId: jest.Mock;
    verify: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(
        (callback: (tx: PasswordResetPrismaMock) => Promise<unknown>) =>
          callback(prisma),
      ),
      passwordResetToken: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
    };
    authOpaqueTokenService = {
      getOpaqueTokenId: jest.fn(() => 'token-id'),
      verify: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {},
        },
        {
          provide: PasswordService,
          useValue: {
            hash: jest.fn(() => Promise.resolve('next-password-hash')),
          },
        },
        {
          provide: AuthAccountService,
          useValue: {
            ensureUserCanAuthenticate: jest.fn(),
            normalizeEmail: jest.fn((email: string) => email.toLowerCase()),
          },
        },
        {
          provide: AuthAuditService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: AuthOpaqueTokenService,
          useValue: authOpaqueTokenService,
        },
        {
          provide: AuthSessionService,
          useValue: {
            revokeActiveSessionsForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(PasswordResetService);
  });

  it('claims the reset token atomically before changing the password', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(createResetToken());
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.resetPassword(
        {
          password: 'new-password',
          token: 'token-id.secret',
        },
        {},
      ),
    ).resolves.toEqual({ reset: true });

    const tokenClaimArgs = getFirstCallArg<ResetTokenClaimArgs>(
      prisma.passwordResetToken.updateMany,
    );
    expect(tokenClaimArgs.where.id).toBe('token-id');
    expect(tokenClaimArgs.where.usedAt).toBeNull();
    expect(tokenClaimArgs.where.expiresAt.gt).toBeInstanceOf(Date);
    expect(tokenClaimArgs.data.usedAt).toBeInstanceOf(Date);

    const userUpdateArgs = getFirstCallArg<UserUpdateArgs>(prisma.user.update);
    expect(userUpdateArgs).toEqual({
      where: { id: 'user-id' },
      data: { passwordHash: 'next-password-hash' },
    });
  });

  it('rejects the reset when another request already claimed the token', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(createResetToken());
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.resetPassword(
        {
          password: 'new-password',
          token: 'token-id.secret',
        },
        {},
      ),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

function createResetToken() {
  return {
    expiresAt: new Date(Date.now() + 60_000),
    id: 'token-id',
    tokenHash: 'token-hash',
    usedAt: null,
    user: {
      status: UserStatus.ACTIVE,
    },
    userId: 'user-id',
  };
}

function getFirstCallArg<T>(mock: jest.Mock): T {
  const calls = mock.mock.calls as [T][];

  return calls[0][0];
}
