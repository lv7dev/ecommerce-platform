import type { ExecutionContext } from '@nestjs/common';
import {
  getAuthIdentityTracker,
  getAuthIpTracker,
} from './auth-throttle.decorator';

describe('auth throttle trackers', () => {
  const context = {} as ExecutionContext;

  it('tracks IP limits by request IP', () => {
    expect(getAuthIpTracker({ ip: '203.0.113.10' }, context)).toBe(
      '203.0.113.10',
    );
  });

  it('normalizes email identity trackers', () => {
    expect(
      getAuthIdentityTracker(
        {
          body: {
            email: ' Customer@Example.COM ',
          },
          ip: '203.0.113.10',
        },
        context,
      ),
    ).toBe('203.0.113.10:email:customer@example.com');
  });

  it('uses only the opaque token id for token identity trackers', () => {
    expect(
      getAuthIdentityTracker(
        {
          body: {
            token: 'token-id.secret-value',
          },
          ip: '203.0.113.10',
        },
        context,
      ),
    ).toBe('203.0.113.10:token:token-id');
  });
});
