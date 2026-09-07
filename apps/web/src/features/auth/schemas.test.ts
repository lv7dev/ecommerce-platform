import { describe, expect, it } from 'vitest';
import { loginSchema } from './schemas';

describe('loginSchema', () => {
  it('uses the password policy for login submissions', () => {
    const result = loginSchema.safeParse({
      email: 'customer@example.com',
      password: 'short123',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['password']);
    expect(result.error?.issues[0]?.message).toBe('Password must be at least 12 characters.');
  });
});
