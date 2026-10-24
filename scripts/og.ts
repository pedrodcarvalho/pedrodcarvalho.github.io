/**
 * Build-time Open Graph images (1200×630 PNG) for the home page and every case
 * study, in both locales. Runs before `astro build`; outputs go to public/og/.
 *
 *   node scripts/og.ts           # regenerate stale images only
 *   node scripts/og.ts --force   # regenerate everything
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori, { type Font } from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { en } from '../src/i18n/en.ts';
import { pt } from '../src/i18n/pt.ts';
import { profile } from '../src/data/profile.ts';

type Locale = 'en' | 'pt';
type Style = Record<string, string | number>;
type Node = {
  type: string;
  props: { style?: Style; children?: Child | undefined } & Record<string, unknown>;
};
type Child = Node | string | (Node | string)[];

const W = 1200;
const H = 630;
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'public/og');
const CONTENT = join(ROOT, 'src/content/projects');
const SITE = 'pedrodcarvalho.github.io';
const dict = { en, pt } as const;

const c = {
  bg: '#0a0b0d',
  surface: '#171a1f',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.16)',
  fg: '#e8eaed',
  muted: '#9aa0a6',
  subtle: '#8a9097',
  accent: '#3ddccb',
};

/* ---------- fonts ---------- */

const require = createRequire(import.meta.url);
const fontFile = (pkg: string, file: string) =>
  join(require.resolve(`${pkg}/package.json`), '..', 'files', file);

const FONT_FILES = [
  ['Geist', '@fontsource/geist', 'geist-latin-400-normal.woff', 400],
  ['Geist', '@fontsource/geist', 'geist-latin-500-normal.woff', 500],
  ['Geist', '@fontsource/geist', 'geist-latin-600-normal.woff', 600],
  ['Geist Mono', '@fontsource/geist-mono', 'geist-mono-latin-400-normal.woff', 400],
  ['Geist Mono', '@fontsource/geist-mono', 'geist-mono-latin-500-normal.woff', 500],
] as const;

const fontPaths = FONT_FILES.map(([, pkg, file]) => fontFile(pkg, file));

function loadFonts(): Font[] {
  return FONT_FILES.map(([name, , , weight], i) => ({
    name,
    weight,
    style: 'normal',
    data: readFileSync(fontPaths[i]!),
  }));
}

/* ---------- element helpers (JSX-less satori nodes) ---------- */

function h(
  type: string,
  style: Style,
  children?: Child,
  extra: Record<string, unknown> = {},
): Node {
  return { type, props: { style: { display: 'flex', ...style }, children, ...extra } };
}

const svgUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

/** The site's logo mark (see Nav.astro), drawn at 2× for crispness. */
const LOGO = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
    `<rect x="1" y="1" width="30" height="30" rx="8" fill="${c.surface}" stroke="${c.lineStrong}"/>` +
    `<path d="M10 22V10h5.5a3.75 3.75 0 0 1 0 7.5H10" fill="none" stroke="${c.fg}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="22" cy="21" r="2" fill="${c.accent}"/></svg>`,
);

/** 24px engineering dot grid (an SVG pattern renders far faster than 1k gradient tiles). */
const DOTS = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
    `<defs><pattern id="d" width="24" height="24" patternUnits="userSpaceOnUse">` +
    `<circle cx="12" cy="12" r="1.25" fill="#fff" fill-opacity="0.11"/></pattern></defs>` +
    `<rect width="100%" height="100%" fill="url(#d)"/></svg>`,
);

/** Concentric "signal" rings radiating from the top-right corner. */
const RINGS = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">` +
    [120, 220, 320, 420, 520]
      .map(
        (r, i) =>
          `<circle cx="640" cy="0" r="${r}" fill="none" stroke="${c.accent}" stroke-opacity="${(0.16 - i * 0.028).toFixed(3)}" stroke-width="1.25"${i % 2 ? ' stroke-dasharray="2 8"' : ''}/>`,
      )
      .join('') +
    `<circle cx="640" cy="0" r="5" fill="${c.accent}"/></svg>`,
);

function frame(locale: Locale, body: Node[], footRight: Node): Node {
  return h(
    'div',
    {
      position: 'relative',
      width: W,
      height: H,
      flexDirection: 'column',
      backgroundColor: c.bg,
      fontFamily: 'Geist',
      color: c.fg,
    },
    [
      // Dot grid, faded toward the bottom-left by the overlay below.
      h('img', { position: 'absolute', top: 0, left: 0, width: W, height: H }, undefined, {
        src: DOTS,
        width: W,
        height: H,
      }),
      h('div', {
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(ellipse 120% 110% at 80% 0%, transparent 15%, ${c.bg} 100%)`,
      }),
      h('div', {
        position: 'absolute',
        inset: 0,
        backgroundImage:
          'radial-gradient(ellipse 55% 60% at 92% 4%, rgba(61,220,203,0.20) 0%, rgba(61,220,203,0.06) 45%, transparent 75%)',
      }),
      h('img', { position: 'absolute', top: 0, right: 0, width: 640, height: 640 }, undefined, {
        src: RINGS,
        width: 640,
        height: 640,
      }),
      // Content
      h(
        'div',
        { position: 'absolute', inset: 0, flexDirection: 'column', padding: '64px 80px 0' },
        [
          h('div', { alignItems: 'center', gap: 20 }, [
            h('img', { width: 64, height: 64 }, undefined, { src: LOGO, width: 64, height: 64 }),
            h('div', { flexDirection: 'column', gap: 4 }, [
              h('div', { fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }, profile.name),
              h(
                'div',
                { fontFamily: 'Geist Mono', fontSize: 19, color: c.muted, letterSpacing: '0.01em' },
                profile.role[locale],
              ),
            ]),
          ]),
          h(
            'div',
            { flexDirection: 'column', flexGrow: 1, justifyContent: 'center', paddingBottom: 8 },
            body,
          ),
          h(
            'div',
            {
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 88,
              borderTop: `1px solid ${c.line}`,
              fontFamily: 'Geist Mono',
              fontSize: 20,
              color: c.subtle,
            },
            [
              h('div', { alignItems: 'center', gap: 14 }, [
                h('div', { width: 9, height: 9, borderRadius: 9, backgroundColor: c.accent }),
                h('div', { color: c.muted }, SITE),
              ]),
              footRight,
            ],
          ),
        ],
      ),
    ],
  );
}

function eyebrow(text: string): Node {
  return h(
    'div',
    {
      alignItems: 'center',
      gap: 16,
      fontFamily: 'Geist Mono',
      fontSize: 20,
      fontWeight: 500,
      color: c.accent,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      marginBottom: 26,
    },
    [
      text,
      h('div', {
        width: 56,
        height: 1,
        backgroundImage: `linear-gradient(90deg, ${c.accent}, transparent)`,
      }),
    ],
  );
}

const titleStyle: Style = {
  fontSize: 84,
  fontWeight: 600,
  letterSpacing: '-0.045em',
  lineHeight: 1.04,
};

function homeCard(locale: Locale): Node {
  const t = dict[locale];
  return frame(
    locale,
    [
      eyebrow(t['hero.kicker']),
      h('div', { ...titleStyle, flexDirection: 'column' }, [
        h('div', {}, t['hero.title.a']),
        h('div', { color: c.accent }, t['hero.title.b']),
      ]),
    ],
    h('div', { letterSpacing: '0.12em', textTransform: 'uppercase' }, t['contact.location']),
  );
}

function projectCard(locale: Locale, slug: string, title: string, tagline: string): Node {
  const t = dict[locale];
  return frame(
    locale,
    [
      eyebrow(t['nav.projects']),
      h('div', { ...titleStyle, fontSize: 92 }, title),
      h(
        'div',
        { marginTop: 22, fontSize: 38, color: c.muted, letterSpacing: '-0.02em', lineHeight: 1.25 },
        tagline,
      ),
    ],
    h('div', {}, `/${locale === 'en' ? '' : 'pt/'}projects/${slug}`),
  );
}

/* ---------- inputs ---------- */

type Job = { file: string; node: () => Node; inputs: string[] };

function frontmatter(path: string): Record<string, string> {
  const src = readFileSync(path, 'utf8');
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(src)?.[1] ?? '';
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/^(\w+):\s*(.+)$/gm)) {
    out[m[1]!] = m[2]!.trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

function jobs(): Job[] {
  const shared = [
    fileURLToPath(import.meta.url),
    join(ROOT, 'src/i18n/en.ts'),
    join(ROOT, 'src/i18n/pt.ts'),
    join(ROOT, 'src/data/profile.ts'),
    ...fontPaths,
  ];
  const list: Job[] = (['en', 'pt'] as const).map((locale) => ({
    file: `home-${locale}.png`,
    node: () => homeCard(locale),
    inputs: shared,
  }));
  for (const locale of ['en', 'pt'] as const) {
    const dir = join(CONTENT, locale);
    for (const md of readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_'))) {
      const path = join(dir, md);
      const slug = basename(md, '.md');
      const fm = frontmatter(path);
      if (!fm.title || !fm.tagline) throw new Error(`${path}: missing title or tagline`);
      list.push({
        file: `${slug}-${locale}.png`,
        node: () => projectCard(locale, slug, fm.title!, fm.tagline!),
        inputs: [...shared, path],
      });
    }
  }
  return list.sort((a, b) => a.file.localeCompare(b.file));
}

const mtime = (p: string) => {
  try {
    return statSync(p).mtimeMs;
  } catch {
    return -1;
  }
};

const isFresh = (out: string, inputs: string[]) => mtime(out) > Math.max(...inputs.map(mtime));

/* ---------- render ---------- */

async function render(node: Node, fonts: Font[]): Promise<Buffer> {
  const svg = await satori(node, { width: W, height: H, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: W }, font: { loadSystemFonts: false } })
    .render()
    .asPng();
}

async function main(): Promise<void> {
  const start = performance.now();
  const force = process.argv.includes('--force');
  mkdirSync(OUT, { recursive: true });

  const todo = jobs().filter((j) => force || !isFresh(join(OUT, j.file), j.inputs));
  if (todo.length) {
    const fonts = loadFonts();
    await Promise.all(
      todo.map(async (j) => writeFileSync(join(OUT, j.file), await render(j.node(), fonts))),
    );
  }
  const ms = Math.round(performance.now() - start);
  console.log(
    `[og] ${todo.length} image(s) generated, ${jobs().length - todo.length} up to date (${ms} ms)`,
  );
}

await main();
