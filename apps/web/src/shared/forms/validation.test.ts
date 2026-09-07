import { describe, expect, it } from 'vitest';
import { passwordSchema } from './validation';

describe('passwordSchema', () => {
  it('rejects passwords shorter than 12 characters', () => {
    const result = passwordSchema.safeParse('short123');

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Password must be at least 12 characters.');
  });

  it('rejects common passwords even when they meet the minimum length', () => {
    const result = passwordSchema.safeParse('Password-1234');

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      'Password is too common. Please choose a more unique password.',
    );
  });

  it('allows long non-common passwords', () => {
    const result = passwordSchema.safeParse('correct horse battery staple');

    expect(result.success).toBe(true);
  });
});
