// @ts-check
import { execSync } from 'node:child_process';
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import browserslist from 'browserslist';
import { browserslistToTargets } from 'lightningcss';

const SITE = 'https://pedrodcarvalho.github.io';

/** Short commit hash shown in the footer; CI provides GITHUB_SHA, local builds ask git. */
function commitHash() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'dev';
  }
}

export default defineConfig({
  site: SITE,
  trailingSlash: 'ignore',
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },

  // The previous portfolio lived at /portfolio (printed on older résumés): send it home.
  redirects: { '/portfolio': '/' },

  // Hash-based Content-Security-Policy emitted as a <meta> tag (GitHub Pages can't set headers).
  // Page transitions use the native cross-document View Transition API, which works with CSP.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
      ],
    },
  },

  // Case studies have no code blocks; Shiki's inline styles would also conflict with the CSP.
  markdown: { syntaxHighlight: false },

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pt'],
    routing: { prefixDefaultLocale: false },
  },

  integrations: [
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en-US', pt: 'pt-BR' } },
      filter: (page) => !page.includes('/404') && !page.includes('/portfolio'),
    }),
  ],

  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Geist',
      cssVariable: '--font-sans',
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      options: {
        variants: [
          { weight: '100 900', style: 'normal', src: ['./src/assets/fonts/Geist-Variable.woff2'] },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Geist Mono',
      cssVariable: '--font-mono',
      fallbacks: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      options: {
        variants: [
          {
            weight: '100 900',
            style: 'normal',
            src: ['./src/assets/fonts/GeistMono-Variable.woff2'],
          },
        ],
      },
    },
  ],

  vite: {
    define: {
      __COMMIT__: JSON.stringify(commitHash()),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },
    css: {
      transformer: 'lightningcss',
      lightningcss: { targets: browserslistToTargets(browserslist()) },
    },
    build: { cssMinify: 'lightningcss' },
  },
});
