import { describe, expect, it } from 'vitest';
import { getSafeRedirectPath } from './redirect';

describe('getSafeRedirectPath', () => {
  it('allows local paths', () => {
    expect(getSafeRedirectPath('/checkout')).toBe('/checkout');
  });

  it('rejects external paths', () => {
    expect(getSafeRedirectPath('https://example.com')).toBe('/products');
    expect(getSafeRedirectPath('//example.com')).toBe('/products');
  });
});
