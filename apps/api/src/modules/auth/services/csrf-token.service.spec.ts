import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { EnvironmentVariables } from '../../../config/env.validation';
import { CsrfTokenService } from './csrf-token.service';

describe('CsrfTokenService', () => {
  let service: CsrfTokenService;
  let ttlSeconds = 86_400;

  const config = {
    get: jest.fn((key: keyof EnvironmentVariables) => {
      const values: Partial<EnvironmentVariables> = {
        CSRF_TOKEN_TTL_SECONDS: ttlSeconds,
        JWT_ACCESS_SECRET: 'test-secret',
      };

      return values[key];
    }),
  };

  beforeEach(async () => {
    ttlSeconds = 86_400;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CsrfTokenService,
        {
          provide: ConfigService,
          useValue: config,
        },
      ],
    }).compile();

    service = module.get(CsrfTokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('creates signed tokens that can be verified', () => {
    const csrfToken = service.createToken();

    expect(csrfToken.token.split('.')).toHaveLength(3);
    expect(csrfToken.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(() => service.verifyToken(csrfToken.token)).not.toThrow();
  });

  it('rejects tampered tokens', () => {
    const csrfToken = service.createToken();

    expect(() => service.verifyToken(`${csrfToken.token}tampered`)).toThrow(
      ForbiddenException,
    );
  });

  it('rejects expired tokens', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-07T00:00:00.000Z'));
    ttlSeconds = 1;
    const csrfToken = service.createToken();

    jest.setSystemTime(new Date('2026-09-07T00:00:02.000Z'));

    expect(() => service.verifyToken(csrfToken.token)).toThrow(
      ForbiddenException,
    );
  });
});
