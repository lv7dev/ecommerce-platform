import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UserStatus } from '../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AuthAccountService } from './auth-account.service';
import { AuthAuditService } from './auth-audit.service';
import { AuthOpaqueTokenService } from './auth-opaque-token.service';
import { AuthSessionService } from './auth-session.service';
import { JwtTokenService } from './jwt-token.service';

type AuthSessionPrismaMock = {
  $transaction: jest.Mock;
  authSession: {
    create: jest.Mock;
    findUnique: jest.Mock;
    updateMany: jest.Mock;
  };
};

type SessionRotationArgs = {
  data: {
    expiresAt: Date;
    refreshTokenHash: string;
  };
  where: {
    expiresAt: {
      gt: Date;
    };
    id: string;
    refreshTokenHash: string;
    revokedAt: null;
  };
};

type SessionRevokeArgs = {
  data: {
    revokedAt: Date;
  };
  where: {
    id: string;
    revokedAt: null;
  };
};

describe('AuthSessionService', () => {
  let service: AuthSessionService;
  let prisma: AuthSessionPrismaMock;
  let authAuditService: {
    create: jest.Mock;
  };
  let authOpaqueTokenService: {
    createRefreshToken: jest.Mock;
    getRefreshTokenSessionId: jest.Mock;
    hash: jest.Mock;
    verify: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(
        (callback: (tx: AuthSessionPrismaMock) => Promise<unknown>) =>
          callback(prisma),
      ),
      authSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    authAuditService = {
      create: jest.fn(() => Promise.resolve()),
    };
    authOpaqueTokenService = {
      createRefreshToken: jest.fn(() => 'session-id.next-secret'),
      getRefreshTokenSessionId: jest.fn(() => 'session-id'),
      hash: jest.fn((token: string) => `hash:${token}`),
      verify: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthSessionService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: JwtTokenService,
          useValue: {
            signAccessToken: jest.fn(() => ({
              accessToken: 'access-token',
              expiresIn: 900,
            })),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => 30 * 24 * 60 * 60),
          },
        },
        {
          provide: AuthAccountService,
          useValue: {
            ensureUserCanAuthenticate: jest.fn(),
          },
        },
        {
          provide: AuthAuditService,
          useValue: authAuditService,
        },
        {
          provide: AuthOpaqueTokenService,
          useValue: authOpaqueTokenService,
        },
      ],
    }).compile();

    service = module.get(AuthSessionService);
  });

  it('rotates the refresh token with a conditional session update', async () => {
    prisma.authSession.findUnique.mockResolvedValue(createSession());
    prisma.authSession.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.refresh('session-id.current-secret', {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      }),
    ).resolves.toMatchObject({
      accessToken: 'access-token',
      expiresIn: 900,
      refreshToken: 'session-id.next-secret',
      user: {
        id: 'user-id',
      },
    });

    const rotationArgs = getCallArg<SessionRotationArgs>(
      prisma.authSession.updateMany,
      0,
    );
    expect(rotationArgs.where.id).toBe('session-id');
    expect(rotationArgs.where.refreshTokenHash).toBe('current-refresh-hash');
    expect(rotationArgs.where.revokedAt).toBeNull();
    expect(rotationArgs.where.expiresAt.gt).toBeInstanceOf(Date);
    expect(rotationArgs.data.refreshTokenHash).toBe(
      'hash:session-id.next-secret',
    );
    expect(rotationArgs.data.expiresAt).toBeInstanceOf(Date);
  });

  it('revokes the session when another request already rotated the token', async () => {
    prisma.authSession.findUnique.mockResolvedValue(createSession());
    prisma.authSession.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });

    await expect(
      service.refresh('session-id.current-secret', {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      }),
    ).rejects.toThrow(UnauthorizedException);

    const revokeArgs = getCallArg<SessionRevokeArgs>(
      prisma.authSession.updateMany,
      1,
    );
    expect(revokeArgs.where).toEqual({
      id: 'session-id',
      revokedAt: null,
    });
    expect(revokeArgs.data.revokedAt).toBeInstanceOf(Date);
    expect(authAuditService.create).toHaveBeenCalledWith({
      action: 'auth.refresh_token_reuse_detected',
      actorId: 'user-id',
      ipAddress: '127.0.0.1',
      metadata: {
        reason: 'refresh_token_rotation_conflict',
      },
      targetId: 'session-id',
      targetType: 'AuthSession',
      userAgent: 'test-agent',
    });
  });

  it('revokes the session when a stale refresh token is reused', async () => {
    authOpaqueTokenService.verify.mockReturnValue(false);
    prisma.authSession.findUnique.mockResolvedValue(createSession());
    prisma.authSession.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.refresh('session-id.old-secret', {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      }),
    ).rejects.toThrow(UnauthorizedException);

    const revokeArgs = getCallArg<SessionRevokeArgs>(
      prisma.authSession.updateMany,
      0,
    );
    expect(revokeArgs.where).toEqual({
      id: 'session-id',
      revokedAt: null,
    });
    expect(revokeArgs.data.revokedAt).toBeInstanceOf(Date);
    expect(authAuditService.create).toHaveBeenCalledWith({
      action: 'auth.refresh_token_reuse_detected',
      actorId: 'user-id',
      ipAddress: '127.0.0.1',
      metadata: {
        reason: 'refresh_token_hash_mismatch',
      },
      targetId: 'session-id',
      targetType: 'AuthSession',
      userAgent: 'test-agent',
    });
  });
});

function createSession() {
  return {
    createdAt: new Date('2026-09-07T00:00:00.000Z'),
    expiresAt: new Date(Date.now() + 60_000),
    id: 'session-id',
    ipAddress: '127.0.0.1',
    refreshTokenHash: 'current-refresh-hash',
    revokedAt: null,
    updatedAt: new Date('2026-09-07T00:00:00.000Z'),
    user: createUser(),
    userAgent: 'test-agent',
    userId: 'user-id',
  };
}

function createUser() {
  return {
    createdAt: new Date('2026-09-07T00:00:00.000Z'),
    email: 'customer@example.com',
    emailVerifiedAt: null,
    id: 'user-id',
    lastLoginAt: null,
    name: 'Customer',
    passwordHash: 'password-hash',
    roles: [],
    status: UserStatus.ACTIVE,
    updatedAt: new Date('2026-09-07T00:00:00.000Z'),
  };
}

function getCallArg<T>(mock: jest.Mock, callIndex: number): T {
  const calls = mock.mock.calls as [T][];

  return calls[callIndex][0];
}
