import { expect, test, type Page } from '@playwright/test';
import { settle } from './helpers';

/**
 * Contract: Ctrl/⌘+K or `[data-palette-open]` opens a `<dialog open>` with a
 * `role="combobox"` input; results are `role="option"`; Enter follows the selected
 * option; Escape closes the dialog.
 */
const palette = (page: Page) =>
  page.locator('dialog[open]').filter({ has: page.getByRole('combobox') });

test.describe('command palette', () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard-driven palette is a desktop feature');
    await page.goto('/');
    await settle(page);
  });

  test('opens with the keyboard shortcut and closes with Escape', async ({ page, browserName }) => {
    await page.keyboard.press(browserName === 'webkit' ? 'Meta+K' : 'Control+K');
    await expect(palette(page)).toBeVisible();
    await expect(page.getByRole('combobox')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });

  test('opens from the search button', async ({ page }) => {
    await page.locator('[data-palette-open]').first().click();
    await expect(palette(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });

  test('filters results and navigates to a project', async ({ page }) => {
    await page.locator('[data-palette-open]').first().click();
    const input = palette(page).getByRole('combobox');
    await input.fill('flora');

    const option = palette(page).getByRole('option').filter({ hasText: 'FloraSense' }).first();
    await expect(option).toBeVisible();

    // Move the active option onto FloraSense (it may already be selected).
    for (let i = 0; i < 10 && (await option.getAttribute('aria-selected')) !== 'true'; i++) {
      await input.press('ArrowDown');
    }
    await expect(option).toHaveAttribute('aria-selected', 'true');

    await input.press('Enter');
    await expect(page).toHaveURL(/\/projects\/florasense\/?$/);
    await expect(page.locator('main h1')).toContainText('FloraSense');
  });
});
