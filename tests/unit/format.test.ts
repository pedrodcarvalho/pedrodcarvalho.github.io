import { describe, expect, it } from 'vitest';
import { formatBuildDate, formatNumber } from '@/lib/format';

describe('formatNumber', () => {
  it.each([
    [900, 'en', 0, '900'],
    [900, 'pt', 0, '900'],
    [1000, 'en', 0, '1,000'],
    [1000, 'pt', 0, '1.000'],
    [7.3, 'en', 1, '7.3'],
    [7.3, 'pt', 1, '7,3'],
    [2, 'en', 1, '2.0'],
    [2, 'pt', 2, '2,00'],
    [7.25, 'en', 0, '7'],
    [0, 'pt', 0, '0'],
  ] as const)('formatNumber(%d, %s, %d) → %s', (value, locale, decimals, expected) => {
    expect(formatNumber(value, locale, decimals)).toBe(expected);
  });

  it('defaults to zero decimals', () => {
    expect(formatNumber(7.3, 'en')).toBe('7');
    expect(formatNumber(7.6, 'pt')).toBe('8');
  });
});

describe('formatBuildDate', () => {
  it('formats in English', () => {
    expect(formatBuildDate('2026-10-23T15:00:00Z', 'en')).toBe('Oct 23, 2026');
  });

  it('formats in Brazilian Portuguese', () => {
    const out = formatBuildDate('2026-10-23T15:00:00Z', 'pt');
    expect(out).toMatch(/^23 de out\.? de 2026$/);
  });

  it('uses the São Paulo time zone (UTC−3)', () => {
    // 01:30 UTC on the 24th is still the evening of the 23rd in Campinas.
    expect(formatBuildDate('2026-10-24T01:30:00Z', 'en')).toBe('Oct 23, 2026');
    expect(formatBuildDate('2026-10-24T03:30:00Z', 'en')).toBe('Oct 24, 2026');
  });
});
