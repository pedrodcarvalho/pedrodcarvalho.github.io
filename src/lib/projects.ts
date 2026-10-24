import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '@/i18n';

export type Project = CollectionEntry<'projects'>;

/** `en/florasense` → `florasense` */
export function projectSlug(entry: Pick<Project, 'id'>): string {
  return entry.id.split('/').slice(1).join('/');
}

export function projectLocale(entry: Pick<Project, 'id'>): string {
  return entry.id.split('/')[0] ?? '';
}

export async function getProjects(locale: Locale): Promise<Project[]> {
  const all = await getCollection('projects', (entry) => projectLocale(entry) === locale);
  return all.sort((a, b) => a.data.order - b.data.order);
}
