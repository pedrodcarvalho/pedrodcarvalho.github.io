import { expect, test } from '@playwright/test';
import { scrollThrough, settle, trackErrors } from './helpers';

const SITE = 'https://pedrodcarvalho.github.io';

const pages = [
  { path: '/', lang: 'en', canonical: `${SITE}/` },
  { path: '/pt/', lang: 'pt-BR', canonical: `${SITE}/pt/` },
];

for (const p of pages) {
  test.describe(`home ${p.path}`, () => {
    test('renders without errors or CSP violations', async ({ page }) => {
      const errors = await trackErrors(page);
      const res = await page.goto(p.path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', p.lang);
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page).toHaveTitle(/Pedro Domitti de Carvalho/);

      // Exercise lazily loaded modules (motion, canvas) before collecting errors.
      await settle(page);
      await scrollThrough(page);
      await page.waitForTimeout(300);
      expect(await errors()).toEqual([]);
    });

    test('has a Person JSON-LD block', async ({ page }) => {
      await page.goto(p.path);
      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(blocks.length).toBeGreaterThan(0);
      const parsed = blocks.map((b) => JSON.parse(b) as Record<string, unknown>);
      const person = parsed.find((d) => d['@type'] === 'Person');
      expect(person).toBeDefined();
      expect(person?.['@context']).toBe('https://schema.org');
      expect(person?.name).toBe('Pedro Domitti de Carvalho');
    });

    test('has canonical and hreflang links', async ({ page }) => {
      await page.goto(p.path);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', p.canonical);
      const alt = (lang: string) => page.locator(`link[rel="alternate"][hreflang="${lang}"]`);
      await expect(alt('en')).toHaveAttribute('href', `${SITE}/`);
      await expect(alt('pt-BR')).toHaveAttribute('href', `${SITE}/pt/`);
      await expect(alt('x-default')).toHaveAttribute('href', `${SITE}/`);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{50,}/);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        /^https:\/\/.+\.png$/,
      );
    });
  });
}

test('case study renders without errors or CSP violations', async ({ page }) => {
  const errors = await trackErrors(page);
  const res = await page.goto('/projects/florasense');
  expect(res?.status()).toBe(200);
  await expect(page.locator('h1')).toBeVisible();
  await settle(page);
  await scrollThrough(page);
  await page.waitForTimeout(300);
  expect(await errors()).toEqual([]);
});
