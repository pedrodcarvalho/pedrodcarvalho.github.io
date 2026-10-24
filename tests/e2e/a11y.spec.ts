import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectAllRevealed, scrollThrough, settle } from './helpers';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
const PATHS = ['/', '/pt/', '/projects/florasense'];

// Reduced motion makes the final, settled state deterministic (no mid-animation
// opacity/contrast). The motion spec separately checks that animations end there.
test.use({ reducedMotion: 'reduce' });

for (const theme of ['dark', 'light'] as const) {
  for (const path of PATHS) {
    test(`${path} (${theme}) has no axe violations`, async ({ page }) => {
      await page.addInitScript((t) => {
        try {
          localStorage.setItem('theme', t);
        } catch {
          /* ignore */
        }
      }, theme);
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await settle(page);
      await scrollThrough(page, { backToTop: true });
      await expectAllRevealed(page);
      await page.waitForTimeout(500);

      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      const summary = violations.map((v) => ({
        rule: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.map((n) => ({
          target: n.target.join(' '),
          summary: n.failureSummary?.split('\n').slice(0, 3).join(' '),
        })),
      }));
      expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
    });
  }
}
