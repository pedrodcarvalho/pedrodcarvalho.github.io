/**
 * One-off generator for the favicon set and the web app manifest.
 * The outputs are committed to /public; rerun after changing the logo mark:
 *
 *   node scripts/icons.ts
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { profile } from '../src/data/profile.ts';
import { en } from '../src/i18n/en.ts';

const PUBLIC = fileURLToPath(new URL('../public', import.meta.url));
const BG = '#0a0b0d';

/** The mark from Nav.astro: a "P" stroke and an accent dot in a 32×32 box. */
const GLYPH =
  '<path class="p" d="M10 22V10h5.5a3.75 3.75 0 0 1 0 7.5H10" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<circle class="dot" cx="22" cy="21" r="2"/>';

/** Rounded-square logo with light/dark handling for browser tabs. */
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<style>
.f{fill:#171a1f;stroke:rgb(255 255 255/.16)}.p{stroke:#e8eaed}.dot{fill:#3ddccb}
@media (prefers-color-scheme:light){.f{fill:#fff;stroke:rgb(14 16 19/.18)}.p{stroke:#0e1013}.dot{fill:#0b7a71}}
</style>
<rect class="f" x="1" y="1" width="30" height="30" rx="8"/>
${GLYPH}
</svg>
`;

const darkGlyph = GLYPH.replace('class="p"', 'stroke="#e8eaed"').replace(
  'class="dot"',
  'fill="#3ddccb"',
);

/** Static dark variant of the favicon for raster "any" icons (hairline thins out when large). */
const framedSvg = (line: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<rect x="1" y="1" width="30" height="30" rx="8" fill="#171a1f" stroke="#3a3d42" stroke-width="${line}"/>
${darkGlyph}
</svg>`;

/**
 * Full-bleed square tile (no transparency): the glyph scaled by `k` about the
 * centre over the page background and a faint accent glow. Used for the
 * Apple touch icon and the maskable icon (k ≤ 1 keeps it inside the safe zone).
 */
function tileSvg(k: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<defs><radialGradient id="g" cx="0.85" cy="0.1" r="0.9">
<stop offset="0" stop-color="#3ddccb" stop-opacity="0.16"/><stop offset="1" stop-color="#3ddccb" stop-opacity="0"/>
</radialGradient></defs>
<rect width="32" height="32" fill="${BG}"/><rect width="32" height="32" fill="url(#g)"/>
<g transform="translate(16 16) scale(${k}) translate(-16.45 -16)">${darkGlyph}</g>
</svg>`;
}

function png(svg: string, size: number): Buffer {
  return new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
}

/** Opaque PNG (no alpha channel), as required for the Apple touch icon. */
function opaquePng(svg: string, size: number): Promise<Buffer> {
  return sharp(png(svg, size)).flatten({ background: BG }).removeAlpha().png().toBuffer();
}

/** Pack PNG images into a .ico container (PNG-compressed entries, Vista+). */
function ico(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const manifest = {
  name: profile.name,
  short_name: profile.shortName,
  description: en['meta.description'],
  lang: 'en',
  dir: 'ltr',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: BG,
  theme_color: BG,
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
  ],
};

const out: Record<string, string | Buffer> = {
  'favicon.svg': faviconSvg,
  'favicon.ico': ico([16, 32, 48].map((size) => ({ size, data: png(framedSvg(1), size) }))),
  'apple-touch-icon.png': await opaquePng(tileSvg(1.15), 180),
  'icon-192.png': png(framedSvg(0.6), 192),
  'icon-512.png': png(framedSvg(0.5), 512),
  'icon-maskable-512.png': await opaquePng(tileSvg(1), 512),
  'manifest.webmanifest': `${JSON.stringify(manifest, null, 2)}\n`,
};

for (const [file, data] of Object.entries(out)) writeFileSync(join(PUBLIC, file), data);
console.log(`[icons] wrote ${Object.keys(out).join(', ')}`);
