import type { Localized } from '@/i18n';

export type Education = {
  school: string;
  url: string;
  degree: Localized<string>;
  period: Localized<string>;
  location: Localized<string>;
  note?: Localized<string>;
};

export const education: Education[] = [
  {
    school: 'PUC-Campinas',
    url: 'https://www.puc-campinas.edu.br/',
    degree: {
      en: 'B.Eng. Computer Engineering',
      pt: 'Bacharelado em Engenharia de Computação',
    },
    period: { en: '2021 – Dec 2026', pt: '2021 – dez 2026' },
    location: { en: 'Campinas, Brazil', pt: 'Campinas, Brasil' },
  },
  {
    school: 'Vrije Universiteit Amsterdam',
    url: 'https://vu.nl/en',
    degree: {
      en: 'Exchange semester, Computer Science',
      pt: 'Intercâmbio, Ciência da Computação',
    },
    period: { en: 'Aug – Dec 2022', pt: 'ago – dez 2022' },
    location: { en: 'Amsterdam, Netherlands', pt: 'Amsterdã, Holanda' },
    note: {
      en: 'Grade 8.3/10 · top 7.3% of the cohort (47th of 650)',
      pt: 'Nota 8,3/10 · top 7,3% da turma (47º de 650)',
    },
  },
];

export type Certification = {
  name: Localized<string>;
  issuer: Localized<string>;
  year: number;
};

export const certifications: Certification[] = [
  {
    name: { en: 'TensorFlow Developer Specialization', pt: 'TensorFlow Developer Specialization' },
    issuer: { en: 'DeepLearning.AI', pt: 'DeepLearning.AI' },
    year: 2026,
  },
  {
    name: { en: 'Google Prompting Essentials', pt: 'Google Prompting Essentials' },
    issuer: { en: 'Google', pt: 'Google' },
    year: 2026,
  },
  {
    name: { en: 'Machine Learning Specialization', pt: 'Machine Learning Specialization' },
    issuer: { en: 'Stanford & DeepLearning.AI', pt: 'Stanford e DeepLearning.AI' },
    year: 2025,
  },
  {
    name: {
      en: 'Generative AI Journey with IBM Granite',
      pt: 'Jornada em IA Generativa com IBM Granite',
    },
    issuer: { en: 'IBM SkillsBuild', pt: 'IBM SkillsBuild' },
    year: 2025,
  },
  {
    name: { en: 'Writing, Running & Fixing Code in C', pt: 'Writing, Running & Fixing Code in C' },
    issuer: { en: 'Duke University', pt: 'Duke University' },
    year: 2025,
  },
  {
    name: {
      en: 'CS50: Introduction to Computer Science',
      pt: 'CS50: Introduction to Computer Science',
    },
    issuer: { en: 'Harvard University', pt: 'Harvard University' },
    year: 2023,
  },
];
