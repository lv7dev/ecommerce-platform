import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  minutes,
  seconds,
  Throttle,
  ThrottlerGuard,
  type ThrottlerGetTrackerFunction,
} from '@nestjs/throttler';

type AuthThrottlePreset =
  'forgotPassword' | 'login' | 'register' | 'resetPassword' | 'verifyEmail';

interface RequestWithBody {
  body?: {
    email?: unknown;
    token?: unknown;
  };
  ip?: string;
}

const presetLimits: Record<
  AuthThrottlePreset,
  {
    identityLimit: number;
    identityTtl: number;
    ipLimit: number;
    ipTtl: number;
  }
> = {
  forgotPassword: {
    identityLimit: 3,
    identityTtl: minutes(60),
    ipLimit: 5,
    ipTtl: minutes(1),
  },
  login: {
    identityLimit: 5,
    identityTtl: minutes(15),
    ipLimit: 20,
    ipTtl: minutes(1),
  },
  register: {
    identityLimit: 3,
    identityTtl: minutes(60),
    ipLimit: 5,
    ipTtl: minutes(1),
  },
  resetPassword: {
    identityLimit: 5,
    identityTtl: minutes(15),
    ipLimit: 10,
    ipTtl: minutes(1),
  },
  verifyEmail: {
    identityLimit: 5,
    identityTtl: minutes(15),
    ipLimit: 10,
    ipTtl: minutes(1),
  },
};

export function AuthThrottle(preset: AuthThrottlePreset) {
  const limits = presetLimits[preset];

  return applyDecorators(
    UseGuards(ThrottlerGuard),
    Throttle({
      authIdentity: {
        blockDuration: limits.identityTtl,
        getTracker: getAuthIdentityTracker,
        limit: limits.identityLimit,
        ttl: limits.identityTtl,
      },
      authIp: {
        blockDuration: seconds(30),
        getTracker: getAuthIpTracker,
        limit: limits.ipLimit,
        ttl: limits.ipTtl,
      },
    }),
  );
}

export const getAuthIpTracker: ThrottlerGetTrackerFunction = (request) =>
  getClientIp(request as RequestWithBody);

export const getAuthIdentityTracker: ThrottlerGetTrackerFunction = (
  request,
) => {
  const typedRequest = request as RequestWithBody;
  const email = normalizeTrackerValue(typedRequest.body?.email);

  if (email) {
    return `${getClientIp(typedRequest)}:email:${email}`;
  }

  const tokenId = getOpaqueTokenId(typedRequest.body?.token);

  if (tokenId) {
    return `${getClientIp(typedRequest)}:token:${tokenId}`;
  }

  return `${getClientIp(typedRequest)}:anonymous`;
};

function getClientIp(request: RequestWithBody): string {
  return request.ip ?? 'unknown';
}

function normalizeTrackerValue(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim().toLowerCase();

  return normalizedValue || undefined;
}

function getOpaqueTokenId(value: unknown): string | undefined {
  const token = normalizeTrackerValue(value);

  return token?.split('.')[0];
}
