import { expect, test } from '@playwright/test';
import {
  effectiveOpacity,
  expectAllRevealed,
  hiddenReveals,
  scrollThrough,
  settle,
} from './helpers';

test.describe('scroll reveals', () => {
  for (const path of ['/', '/projects/florasense']) {
    test(`${path}: every [data-reveal] ends fully visible`, async ({ page }) => {
      await page.goto(path);
      await settle(page);
      expect(await page.locator('[data-reveal]').count()).toBeGreaterThan(0);
      await scrollThrough(page);
      await expectAllRevealed(page);
    });
  }
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('content is visible immediately, without scrolling', async ({ page }) => {
    await page.goto('/');
    expect(await hiddenReveals(page)).toEqual([]);
    for (const o of await effectiveOpacity(page, 'main h1, main h2')) expect(o).toBe(1);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const path of ['/', '/pt/', '/projects/florasense']) {
    test(`${path}: all headings are visible`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('html')).not.toHaveClass(/\bjs\b/);
      const headings = page.locator('main h1, main h2, main h3');
      expect(await headings.count()).toBeGreaterThan(0);
      for (const h of await headings.all()) await expect(h).toBeVisible();
      const opacities = await effectiveOpacity(page, 'main h1, main h2, main h3');
      expect(opacities.filter((o) => o < 1)).toEqual([]);
      expect(await hiddenReveals(page)).toEqual([]);
    });
  }
});
