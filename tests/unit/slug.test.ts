import { describe, expect, it } from 'vitest';

import { toSlug } from '@/utils/slug';

describe('toSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(toSlug('Hydrating Rose Serum')).toBe('hydrating-rose-serum');
  });

  it('strips diacritics and punctuation', () => {
    expect(toSlug('Crème de la Crème!')).toBe('creme-de-la-creme');
  });

  it('collapses repeated separators and trims edges', () => {
    expect(toSlug('  --Gold__Edit--  ')).toBe('gold-edit');
  });

  it('caps length at 80 characters', () => {
    expect(toSlug('a'.repeat(200)).length).toBe(80);
  });
});
