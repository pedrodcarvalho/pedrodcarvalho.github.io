import { expect, type Page } from '@playwright/test';

export const SLUGS = ['florasense', 'iottendance', 'snake-ai', 'lpd-compiler'] as const;
export const SECTIONS = ['experience', 'projects', 'skills', 'education', 'contact'] as const;

/** Scroll the whole page in viewport-sized steps so scroll-triggered code runs, then return to top. */
export async function scrollThrough(page: Page, { backToTop = false } = {}): Promise<void> {
  await page.evaluate(async (back) => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.6));
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await wait(60);
    }
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
    await wait(200);
    if (back) window.scrollTo({ top: 0, behavior: 'instant' });
  }, backToTop);
}

/** Selectors of `[data-reveal]` elements whose own computed opacity is not 1. */
export function hiddenReveals(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-reveal]')]
      .filter((el) => Number(getComputedStyle(el).opacity) < 0.999)
      .map((el) => {
        const cls = [...el.classList].slice(0, 2).join('.');
        return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''} (opacity ${getComputedStyle(el).opacity})`;
      }),
  );
}

/** Wait until every reveal element has finished animating in. */
export async function expectAllRevealed(page: Page, timeout = 10_000): Promise<void> {
  await expect
    .poll(() => hiddenReveals(page), { timeout, message: '[data-reveal] elements still hidden' })
    .toEqual([]);
}

/** Opacity of an element multiplied by all of its ancestors' opacity. */
export function effectiveOpacity(page: Page, selector: string): Promise<number[]> {
  return page.$$eval(selector, (els) =>
    els.map((el) => {
      let o = 1;
      for (let n: Element | null = el; n; n = n.parentElement) {
        o *= Number(getComputedStyle(n).opacity);
      }
      return o;
    }),
  );
}

/**
 * Collect console errors, uncaught exceptions and CSP violations for the page's lifetime.
 * Call before `page.goto`.
 */
export async function trackErrors(page: Page): Promise<() => Promise<string[]>> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: string[] };
    w.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      w.__csp.push(`csp: ${e.violatedDirective} blocked ${e.blockedURI || '(inline)'}`);
    });
  });
  return async () => {
    const csp = await page
      .evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? [])
      .catch(() => []);
    return [...errors, ...csp];
  };
}

/**
 * Wait for `load`, then give lazy modules a bounded chance to reach network idle.
 * (`networkidle` alone is flaky under heavy parallel load, especially in Firefox.)
 */
export async function settle(page: Page, idleTimeout = 3_000): Promise<void> {
  await page.waitForLoadState('load');
  await page.waitForLoadState('networkidle', { timeout: idleTimeout }).catch(() => {});
}
