import { expect, test } from '@playwright/test';

test('copy email button copies the address and shows a toast', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions can only be granted in Chromium');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  for (const [path, message] of [
    ['/', 'Email copied to clipboard'],
    ['/pt/', 'E-mail copiado'],
  ] as const) {
    await page.goto(path);
    const button = page.locator('[data-copy]').first();
    const email = await button.getAttribute('data-copy');
    expect(email).toMatch(/@/);

    await button.click();
    const toast = page.locator('[data-toast][data-open]');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveText(message);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(email);
  }
});
