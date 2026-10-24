# pedrodcarvalho.github.io

[![CI](https://github.com/pedrodcarvalho/pedrodcarvalho.github.io/actions/workflows/ci.yml/badge.svg)](https://github.com/pedrodcarvalho/pedrodcarvalho.github.io/actions/workflows/ci.yml)

Personal portfolio of **Pedro Domitti de Carvalho**, a computer engineer working on AI, embedded systems and connected vehicles (V2X).

**Live:** https://pedrodcarvalho.github.io · [Português](https://pedrodcarvalho.github.io/pt/)

## Highlights

- **Static and fast.** Astro 7 with zero UI framework. Pages ship as HTML and CSS, and about 53 KB of gzipped JS loads after the critical path. Lighthouse scores 99 / 100 / 100 / 100 under mobile emulation.
- **Bilingual.** English at `/` and Portuguese at `/pt/`. A typed dictionary (`pt` must satisfy `en`'s keys), `hreflang` alternates, and a localized sitemap.
- **Interactive engineering storytelling:**
  - a live V2X "signal field" canvas in the hero
  - an architecture diagram that lights up as you explore each Eldorado highlight
  - case-study pages that morph in with native cross-document view transitions
- **Command palette.** Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> or <kbd>/</kbd> to navigate, switch theme or language, copy the email, or download the résumé. It follows the WAI-ARIA combobox pattern.
- **Accessible.** axe-core shows zero violations in both themes, plus visible focus, a skip link, `prefers-reduced-motion` support everywhere, and full content without JavaScript.
- **Secure by default.** A hash-based Content-Security-Policy, no third-party requests, no cookies, no trackers.
- **Complete metadata:**
  - build-time Open Graph images per page and locale
  - JSON-LD `Person` schema
  - favicons and a PWA manifest
  - a print stylesheet that turns the page into a clean CV
  - a themed 404 page

## Stack

| Layer     | Choice                                                                          |
| --------- | ------------------------------------------------------------------------------- |
| Framework | [Astro 7](https://astro.build) (static output), TypeScript (strictest)          |
| Styling   | Plain CSS: design tokens, cascade layers, fluid type, Lightning CSS             |
| Motion    | GSAP + ScrollTrigger, Canvas 2D, native View Transitions                        |
| Content   | Astro content collections (Markdown + Zod) and typed data modules (no database) |
| Fonts     | Geist / Geist Mono, self-hosted via the Astro Fonts API                         |
| OG images | Satori + resvg at build time                                                    |
| Quality   | ESLint, Prettier, `astro check`, Vitest, Playwright + axe-core, Lighthouse CI   |
| Delivery  | GitHub Actions → GitHub Pages                                                   |

## Project structure

```
src/
  components/     UI sections (Hero, Experience, V2XDiagram, Projects, …) and page templates
  content/        Case studies: projects/<locale>/<slug>.md
  data/           Typed profile, experience, skills, education and repo data
  i18n/           en.ts / pt.ts dictionaries and locale helpers
  layouts/        Base layout (SEO, theme bootstrap, nav, footer, palette)
  scripts/        Client modules: theme, nav, palette, motion, signal-field, …
  styles/         tokens.css, base.css, components.css, motion.css, print.css
scripts/          Build-time OG image and icon generators
tests/            unit (Vitest) and e2e (Playwright + axe)
```

## Development

Requires Node 22.12+ (see `.nvmrc`) and pnpm.

```sh
pnpm install
pnpm dev            # http://localhost:4321
pnpm build          # generates OG images, then builds to dist/
pnpm preview        # serve the production build

pnpm lint           # ESLint + Prettier
pnpm check          # type-check .astro and .ts files
pnpm test           # unit tests
pnpm test:e2e       # e2e + accessibility (run `pnpm build` first)
pnpm lhci           # Lighthouse CI against dist/
```

### Updating content

- **Text and data:** `src/data/*.ts` holds experience, skills, education and certifications; UI strings live in `src/i18n/{en,pt}.ts`.
- **Case studies:** add `src/content/projects/en/<slug>.md` and `src/content/projects/pt/<slug>.md` with the same frontmatter. The schema is in `src/content.config.ts`, and unit tests enforce that the two locales match.
- **Headshot:** drop a square photo at `src/assets/headshot.jpg` (or `.png`, `.webp`, `.avif`). It is picked up automatically and optimized to AVIF/WebP.
- **Résumé PDFs:** replace the files in `public/cv/`.

## CI/CD

`.github/workflows/ci.yml` runs on every push and pull request:

1. **quality:** lint, type-check, unit tests, build
2. **e2e:** Playwright on Chromium, Firefox, WebKit, Pixel 7 and iPhone 14, including axe-core scans
3. **lighthouse:** Lighthouse CI budgets
4. **deploy** (`main` only, after quality and e2e): publishes `dist/` to GitHub Pages

## License

The code is under the [MIT](LICENSE) license. The written content, résumé PDFs and photo are © Pedro Domitti de Carvalho.
