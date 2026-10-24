import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { locales } from '@/i18n';

const dir = fileURLToPath(new URL('../../src/content/projects/', import.meta.url));

/**
 * Minimal frontmatter reader: returns the raw value of every top-level `key: value` line.
 * Enough to compare scalar fields between locales without pulling in a YAML parser.
 */
function frontmatter(source: string): Record<string, string> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  if (!match) throw new Error('missing frontmatter');
  const out: Record<string, string> = {};
  for (const line of match[1]!.split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (kv) out[kv[1]!] = kv[2]!.trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

function slugs(locale: string): string[] {
  return readdirSync(`${dir}${locale}`)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => f.replace(/\.md$/, ''))
    .sort();
}

function read(locale: string, slug: string) {
  return frontmatter(readFileSync(`${dir}${locale}/${slug}.md`, 'utf8'));
}

const enSlugs = slugs('en');

describe('project content', () => {
  it('has case studies', () => {
    expect(enSlugs).toEqual(
      expect.arrayContaining(['florasense', 'iottendance', 'snake-ai', 'lpd-compiler']),
    );
  });

  it.each(locales)('%s has exactly the same slugs as en', (locale) => {
    expect(slugs(locale)).toEqual(enSlugs);
  });

  it.each(enSlugs)('%s shares order, visual, year and repo across locales', (slug) => {
    const en = read('en', slug);
    for (const locale of locales) {
      const fm = read(locale, slug);
      for (const key of ['order', 'visual', 'year', 'repo']) {
        expect(fm[key], `${locale}/${slug}: ${key}`).toBeTruthy();
        expect(fm[key], `${locale}/${slug}: ${key}`).toBe(en[key]);
      }
      expect(fm.badge === undefined, `${locale}/${slug}: badge presence`).toBe(
        en.badge === undefined,
      );
      for (const key of ['title', 'tagline', 'summary', 'role']) {
        expect(fm[key]?.trim(), `${locale}/${slug}: ${key}`).toBeTruthy();
      }
    }
  });

  it.each(enSlugs)('%s has sane scalar fields', (slug) => {
    const fm = read('en', slug);
    expect(fm.repo).toMatch(/^https:\/\/github\.com\/pedrodcarvalho\/[\w.-]+$/);
    expect(Number(fm.year)).toBeGreaterThanOrEqual(2015);
    expect(Number(fm.year)).toBeLessThanOrEqual(2030);
    expect(['flora', 'rfid', 'snake', 'compiler']).toContain(fm.visual);
  });

  it('orders are unique', () => {
    const orders = enSlugs.map((s) => read('en', s).order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it.each(enSlugs)('%s has a body in every locale', (slug) => {
    for (const locale of locales) {
      const body = readFileSync(`${dir}${locale}/${slug}.md`, 'utf8').replace(
        /^---[\s\S]*?\n---/,
        '',
      );
      expect(body.trim().length, `${locale}/${slug}`).toBeGreaterThan(200);
      expect(body).toMatch(/^## /m);
    }
  });
});
