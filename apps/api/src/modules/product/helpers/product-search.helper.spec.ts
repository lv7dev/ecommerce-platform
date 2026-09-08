import { normalizeSearchText } from './product-search.helper';

describe('product search helper', () => {
  it('normalizes Vietnamese accents, casing, punctuation, and whitespace', () => {
    expect(normalizeSearchText('  Áo THUN Đen!! Size-M / Cotton   ')).toBe(
      'ao thun den size-m cotton',
    );
  });

  it('keeps numeric SKU fragments searchable', () => {
    expect(normalizeSearchText('SKU: BASIC-TEE-2026 Đợt 02')).toBe(
      'sku basic-tee-2026 dot 02',
    );
  });
});
