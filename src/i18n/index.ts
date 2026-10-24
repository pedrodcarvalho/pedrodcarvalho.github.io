import { en } from './en';
import { pt } from './pt';
import {
  defaultLocale,
  locales,
  type Dictionary,
  type Locale,
  type Localized,
  type UIKey,
} from './types';

export { defaultLocale, locales };
export type { Locale, Localized, UIKey };

export const dictionaries: Record<Locale, Dictionary> = { en, pt };

export const htmlLang: Record<Locale, string> = { en: 'en', pt: 'pt-BR' };
export const ogLocale: Record<Locale, string> = { en: 'en_US', pt: 'pt_BR' };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function useTranslations(locale: Locale) {
  const dict = dictionaries[locale];
  return (key: UIKey): string => dict[key];
}

/** Pick the value for `locale` out of a localized record. */
export function l<T>(value: Localized<T>, locale: Locale): T {
  return value[locale];
}

/** Infer the locale from a pathname such as `/pt/projects/x`. */
export function localeFromPath(pathname: string): Locale {
  const first = pathname.split('/').filter(Boolean)[0];
  return isLocale(first) && first !== defaultLocale ? first : defaultLocale;
}

/** Remove the locale prefix: `/pt/projects/x` → `/projects/x`. */
export function stripLocale(pathname: string): string {
  const locale = localeFromPath(pathname);
  if (locale === defaultLocale) return pathname || '/';
  const rest = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '');
  return rest === '' ? '/' : rest;
}

/** Build an internal URL for `locale`: `localizePath('/projects/x', 'pt')` → `/pt/projects/x`. */
export function localizePath(path: string, locale: Locale): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === defaultLocale) return clean;
  return clean === '/' ? `/${locale}/` : `/${locale}${clean}`;
}

/** The same page in another locale. */
export function switchLocalePath(pathname: string, target: Locale): string {
  return localizePath(stripLocale(pathname), target);
}
