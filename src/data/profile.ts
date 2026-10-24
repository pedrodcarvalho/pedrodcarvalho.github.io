import type { Locale, Localized } from '@/i18n';

export const profile = {
  name: 'Pedro Domitti de Carvalho',
  shortName: 'Pedro Carvalho',
  initials: 'PDC',
  email: 'pedrodc51203@gmail.com',
  location: 'Campinas, SP, Brazil',
  role: {
    en: 'Computer Engineer · AI & Embedded Systems',
    pt: 'Engenheiro de Computação · IA e Sistemas Embarcados',
  } satisfies Localized<string>,
  links: {
    github: 'https://github.com/pedrodcarvalho',
    linkedin: 'https://www.linkedin.com/in/pedro-domitti-de-carvalho',
    source: 'https://github.com/pedrodcarvalho/pedrodcarvalho.github.io',
  },
} as const;

/** CV PDFs shipped in /public/cv. */
export const cv: Localized<{ href: string; label: string }> = {
  en: { href: '/cv/Pedro_Domitti_de_Carvalho_CV_EN.pdf', label: 'CV (EN, PDF)' },
  pt: { href: '/cv/Pedro_Domitti_de_Carvalho_CV_PT.pdf', label: 'Currículo (PT, PDF)' },
};

export function cvFor(locale: Locale) {
  return cv[locale];
}

export type Metric = {
  value: number;
  /** Digits after the decimal point when animating the counter. */
  decimals?: number;
  prefix?: string;
  suffix: string;
  labelKey: 'metrics.range' | 'metrics.rnd' | 'metrics.rank' | 'metrics.certs';
};

export const metrics: Metric[] = [
  { value: 900, suffix: '+ m', labelKey: 'metrics.range' },
  { value: 2, suffix: '', labelKey: 'metrics.rnd' },
  { value: 7.3, decimals: 1, prefix: 'Top ', suffix: '%', labelKey: 'metrics.rank' },
  { value: 6, suffix: '', labelKey: 'metrics.certs' },
];
