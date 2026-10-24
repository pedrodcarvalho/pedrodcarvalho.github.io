import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { certifications, education } from '@/data/education';
import { experience } from '@/data/experience';
import { cv, cvFor, metrics, profile } from '@/data/profile';
import { repos } from '@/data/repos';
import { skillGroups, spokenLanguages } from '@/data/skills';
import { dictionaries, locales } from '@/i18n';

const root = fileURLToPath(new URL('../../', import.meta.url));

type Found = { path: string; value: Record<string, unknown> };

/** Every `{ en, pt }` object (a `Localized<T>`) anywhere inside `value`. */
function findLocalized(value: unknown, path: string, out: Found[] = []): Found[] {
  if (Array.isArray(value)) {
    value.forEach((v, i) => findLocalized(v, `${path}[${i}]`, out));
  } else if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    if (keys.join() === [...locales].sort().join()) out.push({ path, value: obj });
    for (const [k, v] of Object.entries(obj)) findLocalized(v, `${path}.${k}`, out);
  }
  return out;
}

/** True when a localized value is "present": non-blank strings, non-empty arrays/objects. */
function isFilled(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0 && value.every(isFilled);
  if (value && typeof value === 'object') return Object.values(value).every(isFilled);
  return value !== undefined && value !== null;
}

const sources = {
  profile,
  cv,
  metrics,
  education,
  certifications,
  experience,
  repos,
  skillGroups,
  spokenLanguages,
};

describe('localized data', () => {
  const found = Object.entries(sources).flatMap(([name, v]) => findLocalized(v, name));

  it('finds localized fields to check', () => {
    expect(found.length).toBeGreaterThan(40);
  });

  it('every localized field has a non-empty value for every locale', () => {
    const missing = found.flatMap(({ path, value }) =>
      locales.filter((loc) => !isFilled(value[loc])).map((loc) => `${path}.${loc}`),
    );
    expect(missing).toEqual([]);
  });

  it('localized arrays have the same length in every locale', () => {
    const mismatched = found
      .filter(({ value }) => Array.isArray(value.en))
      .filter(({ value }) =>
        locales.some((loc) => (value[loc] as unknown[]).length !== (value.en as unknown[]).length),
      )
      .map(({ path }) => path);
    expect(mismatched).toEqual([]);
  });
});

describe('experience', () => {
  const diagram = readFileSync(`${root}src/components/V2XDiagram.astro`, 'utf8');
  // Literal `data-node="x"` attributes plus the `{ id: 'x' … }` boxes rendered via `data-node={b.id}`.
  const literal = [...diagram.matchAll(/data-node="([\w-]+)"/g)].map((m) => m[1]!);
  const fromBoxes = [...diagram.matchAll(/\bid:\s*'([\w-]+)'/g)].map((m) => m[1]!);
  const diagramNodes = new Set([...literal, ...fromBoxes]);

  it('extracts the diagram node ids', () => {
    for (const id of ['obu-lead', 'obu-follow', 'link', 'can', 'rsu', 'robot']) {
      expect(diagramNodes, id).toContain(id);
    }
  });

  it('renders boxes with dynamic data-node attributes', () => {
    expect(diagram).toMatch(/data-node=\{\w+\.id\}/);
  });

  const highlights = experience.flatMap((r) => r.highlights);

  it('has highlights with unique ids', () => {
    const ids = highlights.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(highlights.map((h) => [h.id, h] as const))(
    'highlight %s references existing diagram nodes',
    (_id, h) => {
      expect(h.nodes.length).toBeGreaterThan(0);
      expect(h.nodes.filter((n) => !diagramNodes.has(n))).toEqual([]);
      expect(new Set(h.nodes).size).toBe(h.nodes.length);
      expect(h.tags.length).toBeGreaterThan(0);
    },
  );

  it('roles have valid ISO year-month dates and at most one current role', () => {
    for (const r of experience) {
      expect(r.start).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
      if (r.end !== null) {
        expect(r.end).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
        expect(r.end >= r.start).toBe(true);
      }
      expect(r.companyUrl).toMatch(/^https:\/\//);
    }
    expect(experience.filter((r) => r.end === null).length).toBeLessThanOrEqual(1);
  });
});

describe('metrics', () => {
  it('has unique, translated labels', () => {
    const keys = metrics.map((m) => m.labelKey);
    expect(new Set(keys).size).toBe(keys.length);
    for (const loc of locales) for (const k of keys) expect(dictionaries[loc][k]).toBeTruthy();
  });

  it.each(metrics.map((m) => [m.labelKey, m] as const))('%s is sane', (_key, m) => {
    expect(Number.isFinite(m.value)).toBe(true);
    expect(m.value).toBeGreaterThan(0);
    const decimals = m.decimals ?? 0;
    expect(Number.isInteger(decimals)).toBe(true);
    expect(decimals).toBeGreaterThanOrEqual(0);
    expect(decimals).toBeLessThanOrEqual(3);
    // The counter animates to `value` rounded to `decimals`; it must land exactly on the value.
    expect(Number(m.value.toFixed(decimals))).toBe(m.value);
  });

  it('certification count matches the data', () => {
    const certs = metrics.find((m) => m.labelKey === 'metrics.certs');
    expect(certs?.value).toBe(certifications.length);
  });
});

describe('education & certifications', () => {
  it.each(certifications.map((c) => [c.name.en, c] as const))(
    '%s has a plausible year',
    (_n, c) => {
      expect(Number.isInteger(c.year)).toBe(true);
      expect(c.year).toBeGreaterThanOrEqual(2015);
      expect(c.year).toBeLessThanOrEqual(2030);
    },
  );

  it('schools link over https', () => {
    for (const e of education) expect(e.url).toMatch(/^https:\/\//);
  });
});

describe('links', () => {
  it('repos and profile links are https GitHub/LinkedIn URLs', () => {
    for (const r of repos)
      expect(r.url).toMatch(/^https:\/\/github\.com\/pedrodcarvalho\/[\w.-]+$/);
    expect(profile.links.github).toMatch(/^https:\/\/github\.com\//);
    expect(profile.links.linkedin).toMatch(/^https:\/\/www\.linkedin\.com\//);
    expect(profile.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/);
  });

  it('skill groups are non-empty and unique', () => {
    const ids = skillGroups.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of skillGroups) {
      expect(g.items.length).toBeGreaterThan(0);
      expect(new Set(g.items).size).toBe(g.items.length);
    }
  });
});

describe('CV files', () => {
  it.each(locales)('%s CV exists in /public', (loc) => {
    const { href, label } = cvFor(loc);
    expect(href).toMatch(/^\/cv\/[\w.-]+\.pdf$/);
    expect(label.trim()).not.toBe('');
    const file = `${root}public${href}`;
    expect(existsSync(file), file).toBe(true);
    expect(statSync(file).size).toBeGreaterThan(1024);
    expect(readFileSync(file).subarray(0, 5).toString()).toBe('%PDF-');
  });
});
