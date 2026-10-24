import type { en } from './en';

export type UIKey = keyof typeof en;
/** Every locale must provide exactly the keys of the English dictionary. */
export type Dictionary = Record<UIKey, string>;

export const locales = ['en', 'pt'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

/** A value that exists once per locale. */
export type Localized<T> = Record<Locale, T>;
