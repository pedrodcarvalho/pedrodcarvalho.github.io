/**
 * Client entry point. Everything here is progressive enhancement: the site is
 * fully readable without JavaScript.
 */
import { initTheme } from './theme';
import { initNav } from './nav';
import { initClock, initCopy, initKbdHints, initSpotlight } from './interactions';
import { initDiagram } from './diagram';
import { initPalette } from './palette';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initTheme();
initNav();
initSpotlight();
initCopy();
initClock();
initKbdHints();
initDiagram();
initPalette();

// Animation code is loaded after the critical path. If a chunk fails to load,
// CSS failsafes in motion.css still reveal all content.
import('./motion').then((m) => m.initMotion({ reducedMotion })).catch(() => {});

const canvas = document.querySelector<HTMLCanvasElement>('[data-signal-field]');
if (canvas) {
  import('./signal-field')
    .then((m) => m.mountSignalField(canvas, { reducedMotion }))
    .catch(() => {});
}
