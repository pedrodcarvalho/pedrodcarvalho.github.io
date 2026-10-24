import { expect, test, type Page } from '@playwright/test';

const html = (page: Page) => page.locator('html');
const stored = (page: Page) => page.evaluate(() => localStorage.getItem('theme'));

test('defaults to dark, regardless of the OS preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  expect(await stored(page)).toBeNull();
});

test('toggle switches theme and persists across reloads', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('header [data-theme-toggle]').first();

  await toggle.click();
  await expect(html(page)).toHaveAttribute('data-theme', 'light');
  expect(await stored(page)).toBe('light');

  await page.reload();
  await expect(html(page)).toHaveAttribute('data-theme', 'light');

  await page.locator('header [data-theme-toggle]').first().click();
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  expect(await stored(page)).toBe('dark');

  await page.reload();
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
});

test('saved theme carries over to other pages', async ({ page }) => {
  await page.goto('/');
  await page.locator('header [data-theme-toggle]').first().click();
  await expect(html(page)).toHaveAttribute('data-theme', 'light');
  await page.goto('/pt/projects/florasense');
  await expect(html(page)).toHaveAttribute('data-theme', 'light');
});
