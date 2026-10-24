import type { Locale } from '@/i18n';

/** Format a number the way each locale expects (900 → "900", 7.3 → "7,3" in pt). */
export function formatNumber(value: number, locale: Locale, decimals = 0): string {
  return new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatBuildDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));
}
