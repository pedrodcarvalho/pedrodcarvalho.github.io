import { describe, expect, it } from 'vitest';
import {
  defaultLocale,
  dictionaries,
  htmlLang,
  isLocale,
  l,
  localeFromPath,
  localizePath,
  locales,
  ogLocale,
  stripLocale,
  switchLocalePath,
  useTranslations,
} from '@/i18n';

describe('dictionaries', () => {
  const enKeys = Object.keys(dictionaries.en).sort();

  it('has a dictionary for every locale', () => {
    expect(Object.keys(dictionaries).sort()).toEqual([...locales].sort());
  });

  it.each(locales)('%s has exactly the same keys as en', (locale) => {
    expect(Object.keys(dictionaries[locale]).sort()).toEqual(enKeys);
  });

  it.each(locales)('%s has no empty strings', (locale) => {
    const empty = Object.entries(dictionaries[locale])
      .filter(([, v]) => typeof v !== 'string' || v.trim() === '')
      .map(([k]) => k);
    expect(empty).toEqual([]);
  });

  it.each(locales)('%s has no leftover placeholders or untrimmed values', (locale) => {
    const bad = Object.entries(dictionaries[locale])
      .filter(([, v]) => v !== v.trim() || /TODO|FIXME|\{\{|\}\}/.test(v))
      .map(([k]) => k);
    expect(bad).toEqual([]);
  });

  it('actually translates most strings', () => {
    // Brand names and identical labels are fine, but a dictionary that is mostly English is not.
    const same = enKeys.filter(
      (k) => dictionaries.pt[k as keyof typeof dictionaries.pt] === dictionaries.en[k as never],
    );
    expect(same.length / enKeys.length).toBeLessThan(0.2);
  });

  it('useTranslations returns the locale value', () => {
    expect(useTranslations('en')('nav.projects')).toBe('Projects');
    expect(useTranslations('pt')('nav.projects')).toBe('Projetos');
  });
});

describe('locale metadata', () => {
  it('maps every locale to an html lang and og locale', () => {
    expect(htmlLang).toEqual({ en: 'en', pt: 'pt-BR' });
    expect(ogLocale).toEqual({ en: 'en_US', pt: 'pt_BR' });
  });

  it('defaults to en', () => {
    expect(defaultLocale).toBe('en');
  });

  it('l() picks the right value', () => {
    expect(l({ en: 'a', pt: 'b' }, 'pt')).toBe('b');
    expect(l({ en: 'a', pt: 'b' }, 'en')).toBe('a');
  });
});

describe('isLocale', () => {
  it.each([
    ['en', true],
    ['pt', true],
    ['pt-BR', false],
    ['PT', false],
    ['de', false],
    ['', false],
    [undefined, false],
    [null, false],
    [1, false],
  ])('isLocale(%j) → %s', (value, expected) => {
    expect(isLocale(value)).toBe(expected);
  });
});

describe('localeFromPath', () => {
  it.each([
    ['/', 'en'],
    ['', 'en'],
    ['/projects/x', 'en'],
    ['/pt', 'pt'],
    ['/pt/', 'pt'],
    ['/pt/projects/x', 'pt'],
    ['/ptx', 'en'],
    ['/ptx/projects', 'en'],
    ['/en/projects/x', 'en'],
    ['/projects/pt', 'en'],
  ])('localeFromPath(%j) → %s', (path, expected) => {
    expect(localeFromPath(path)).toBe(expected);
  });
});

describe('stripLocale', () => {
  it.each([
    ['/', '/'],
    ['', '/'],
    ['/projects/x', '/projects/x'],
    ['/pt', '/'],
    ['/pt/', '/'],
    ['/pt/projects/x', '/projects/x'],
    ['/pt/projects/x/', '/projects/x/'],
    ['/ptx', '/ptx'],
    ['/ptx/projects', '/ptx/projects'],
  ])('stripLocale(%j) → %j', (path, expected) => {
    expect(stripLocale(path)).toBe(expected);
  });
});

describe('localizePath', () => {
  it.each([
    ['/', 'en', '/'],
    ['/', 'pt', '/pt/'],
    ['/projects/x', 'en', '/projects/x'],
    ['/projects/x', 'pt', '/pt/projects/x'],
    ['projects/x', 'pt', '/pt/projects/x'],
    ['projects/x', 'en', '/projects/x'],
    ['/#projects', 'pt', '/pt/#projects'],
  ] as const)('localizePath(%j, %s) → %j', (path, locale, expected) => {
    expect(localizePath(path, locale)).toBe(expected);
  });
});

describe('switchLocalePath', () => {
  it.each([
    ['/', 'pt', '/pt/'],
    ['/', 'en', '/'],
    ['/projects/x', 'pt', '/pt/projects/x'],
    ['/pt', 'en', '/'],
    ['/pt/', 'en', '/'],
    ['/pt/', 'pt', '/pt/'],
    ['/pt/projects/x', 'en', '/projects/x'],
    ['/pt/projects/x', 'pt', '/pt/projects/x'],
    ['/ptx', 'pt', '/pt/ptx'],
  ] as const)('switchLocalePath(%j, %s) → %j', (path, target, expected) => {
    expect(switchLocalePath(path, target)).toBe(expected);
  });

  it('round-trips between locales', () => {
    for (const path of ['/', '/projects/florasense', '/projects/snake-ai']) {
      expect(switchLocalePath(switchLocalePath(path, 'pt'), 'en')).toBe(path);
    }
  });
});
