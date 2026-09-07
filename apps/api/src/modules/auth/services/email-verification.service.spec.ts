import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { AuthAccountService } from './auth-account.service';
import { AuthAuditService } from './auth-audit.service';
import { AuthOpaqueTokenService } from './auth-opaque-token.service';
import { EmailVerificationService } from './email-verification.service';

type EmailVerificationPrismaMock = {
  $transaction: jest.Mock;
  emailVerificationToken: {
    findUnique: jest.Mock;
    updateMany: jest.Mock;
  };
  user: {
    update: jest.Mock;
  };
};

type VerificationTokenClaimArgs = {
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
    emailVerifiedAt: Date;
  };
  include: object;
  where: {
    id: string;
  };
};

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;
  let prisma: EmailVerificationPrismaMock;
  let authOpaqueTokenService: {
    getOpaqueTokenId: jest.Mock;
    verify: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(
        (callback: (tx: EmailVerificationPrismaMock) => Promise<unknown>) =>
          callback(prisma),
      ),
      emailVerificationToken: {
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
        EmailVerificationService,
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
          provide: AuthAccountService,
          useValue: {
            ensureUserCanAuthenticate: jest.fn(),
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
      ],
    }).compile();

    service = module.get(EmailVerificationService);
  });

  it('claims the email verification token atomically before updating the user', async () => {
    const updatedUser = createUser({ emailVerifiedAt: new Date() });
    prisma.emailVerificationToken.findUnique.mockResolvedValue(
      createVerificationToken(),
    );
    prisma.emailVerificationToken.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.update.mockResolvedValue(updatedUser);

    await expect(
      service.verifyEmail(
        {
          token: 'token-id.secret',
        },
        {},
      ),
    ).resolves.toMatchObject({
      verified: true,
      user: {
        id: 'user-id',
      },
    });

    const tokenClaimArgs = getFirstCallArg<VerificationTokenClaimArgs>(
      prisma.emailVerificationToken.updateMany,
    );
    expect(tokenClaimArgs.where.id).toBe('token-id');
    expect(tokenClaimArgs.where.usedAt).toBeNull();
    expect(tokenClaimArgs.where.expiresAt.gt).toBeInstanceOf(Date);
    expect(tokenClaimArgs.data.usedAt).toBeInstanceOf(Date);

    const userUpdateArgs = getFirstCallArg<UserUpdateArgs>(prisma.user.update);
    expect(userUpdateArgs.where).toEqual({ id: 'user-id' });
    expect(userUpdateArgs.data.emailVerifiedAt).toBeInstanceOf(Date);
    expect(userUpdateArgs.include).toEqual(expect.any(Object));
  });

  it('rejects verification when another request already claimed the token', async () => {
    prisma.emailVerificationToken.findUnique.mockResolvedValue(
      createVerificationToken(),
    );
    prisma.emailVerificationToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.verifyEmail(
        {
          token: 'token-id.secret',
        },
        {},
      ),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.emailVerificationToken.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

function createVerificationToken() {
  return {
    expiresAt: new Date(Date.now() + 60_000),
    id: 'token-id',
    tokenHash: 'token-hash',
    usedAt: null,
    user: createUser({ emailVerifiedAt: null }),
    userId: 'user-id',
  };
}

function createUser(input: { emailVerifiedAt: Date | null }) {
  return {
    createdAt: new Date('2026-09-07T00:00:00.000Z'),
    email: 'customer@example.com',
    emailVerifiedAt: input.emailVerifiedAt,
    id: 'user-id',
    lastLoginAt: null,
    name: 'Customer',
    passwordHash: 'password-hash',
    roles: [],
    status: UserStatus.ACTIVE,
    updatedAt: new Date('2026-09-07T00:00:00.000Z'),
  };
}

function getFirstCallArg<T>(mock: jest.Mock): T {
  const calls = mock.mock.calls as [T][];

  return calls[0][0];
}
