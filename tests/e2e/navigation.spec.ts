import { expect, test } from '@playwright/test';
import { SECTIONS, SLUGS } from './helpers';

test.describe('section navigation', () => {
  test('desktop nav links scroll to their sections', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop navigation is hidden on mobile');
    await page.goto('/');
    const nav = page.locator('header[data-nav] nav');
    for (const id of SECTIONS) {
      await nav.locator(`a[data-section-link="${id}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect(page.locator(`#${id}`)).toBeInViewport();
    }
  });

  test('mobile menu opens a dialog and closes on navigation', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'the menu sheet is only used on small screens');
    await page.goto('/');
    const menu = page.locator('dialog[data-menu]');
    await expect(menu).toBeHidden();

    await page.locator('[data-menu-open]').click();
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('open', '');

    await menu.locator('a[data-menu-link][href$="#projects"]').click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/#projects$/);
    await expect(page.locator('#projects')).toBeInViewport();

    // Reopen and close with the close button.
    await page.locator('[data-menu-open]').click();
    await expect(menu).toBeVisible();
    await menu.locator('[data-menu-close]').click();
    await expect(menu).toBeHidden();
  });
});

test.describe('language switch', () => {
  const langLink = (lang: string) => `header[data-nav] a[hreflang="${lang}"]`;

  test('home: en → pt → en', async ({ page }) => {
    await page.goto('/');
    await page.locator(langLink('pt-BR')).click();
    await expect(page).toHaveURL(/\/pt\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');

    await page.locator(langLink('en')).click();
    await expect(page).toHaveURL(/:\d+\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('case study keeps the same page', async ({ page }) => {
    await page.goto('/projects/florasense');
    await page.locator(langLink('pt-BR')).click();
    await expect(page).toHaveURL(/\/pt\/projects\/florasense\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');

    await page.locator(langLink('en')).click();
    await expect(page).toHaveURL(/:\d+\/projects\/florasense\/?$/);
  });
});

test.describe('case studies', () => {
  for (const locale of ['en', 'pt'] as const) {
    for (const slug of SLUGS) {
      const path = `${locale === 'pt' ? '/pt' : ''}/projects/${slug}`;
      test(`${path} renders its title and GitHub link`, async ({ page }) => {
        const res = await page.goto(path);
        expect(res?.status()).toBe(200);
        await expect(page.locator('html')).toHaveAttribute(
          'lang',
          locale === 'pt' ? 'pt-BR' : 'en',
        );
        const h1 = page.locator('main h1');
        await expect(h1).toHaveCount(1);
        await expect(h1).toBeVisible();
        await expect(h1).not.toBeEmpty();
        const repo = page.locator('main a[href^="https://github.com/pedrodcarvalho/"]').first();
        await expect(repo).toBeAttached();
        await expect(repo).toHaveAttribute('target', '_blank');
        await expect(repo).toHaveAttribute('rel', /noopener/);
      });
    }
  }
});

test('unknown routes show the 404 page', async ({ page }) => {
  const res = await page.goto('/this-page-does-not-exist');
  expect(res?.status()).toBe(404);
  await expect(page.getByText('Signal lost.').first()).toBeVisible();
});

test('the legacy /portfolio URL redirects home', async ({ page }) => {
  await page.goto('/portfolio');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('h1')).toBeVisible();
});
