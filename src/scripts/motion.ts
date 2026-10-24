/**
 * GSAP motion layer: hero intro, scroll reveals and metric counters.
 * CSS in styles/motion.css provides the starting states and a failsafe that
 * shows everything if this module never runs.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const EASE = 'expo.out';
const READY = 'motion-ready';
const REVEALED = 'data-revealed';
const HERO = '[data-hero-title], [data-hero-item], [data-hero-card]';
/** Clip covering the line box plus room for descenders and overhangs. */
const CLIP_OPEN = 'polygon(-5% -20%, 105% -20%, 105% 125%, -5% 125%)';
const CLIP_SHUT = 'polygon(-5% -20%, 105% -20%, 105% -20%, -5% -20%)';

export function initMotion({ reducedMotion }: { reducedMotion: boolean }): void {
  if (reducedMotion) {
    revealAll();
    return;
  }
  try {
    run();
  } catch (err) {
    revealAll();
    console.error('[motion]', err);
  }
}

function run(): void {
  const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  const title = document.querySelector<HTMLElement>('[data-hero-title]');
  // Read before taking over: whatever the CSS failsafe already showed stays put.
  const heroShown = !title || isShown(title);
  const shown = reveals.filter((el) => isShown(el) && el.getBoundingClientRect().top < innerHeight);

  document.documentElement.classList.add(READY);
  shown.forEach(settle);
  if (!heroShown) heroIntro(title);
  initReveals(reveals.filter((el) => !shown.includes(el)));
  initCounters(shown);
}

/** Short (< 1.1 s) intro: the h1 is the LCP element. */
function heroIntro(title: HTMLElement): void {
  const lines = gsap.utils.toArray<HTMLElement>('.hero__line', title);
  const items = gsap.utils.toArray<HTMLElement>('[data-hero-item]');
  const card = document.querySelector<HTMLElement>('[data-hero-card]');
  const heading = lines.length ? lines : [title];
  const all = [...heading, ...items, ...(card ? [card] : [])];

  // CSS transitions on transform (e.g. `.card`) would fight the tween.
  gsap.set(all, { transition: 'none' });
  const tl = gsap.timeline({
    defaults: { ease: EASE },
    onComplete: () => gsap.set(all, { clearProps: 'opacity,transform,clipPath,transition' }),
  });
  // Lines rise through a wipe; the gradient line keeps its background-clip fill.
  tl.fromTo(
    heading,
    { yPercent: 60, opacity: 0, clipPath: CLIP_SHUT },
    { yPercent: 0, opacity: 1, clipPath: CLIP_OPEN, duration: 0.9, stagger: 0.08 },
    0,
  );
  if (items.length) {
    tl.fromTo(
      items,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.06 },
      0.12,
    );
  }
  if (card) {
    tl.fromTo(
      card,
      { y: 24, scale: 0.97, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: 0.9 },
      0.15,
    );
  }
}

function initReveals(els: HTMLElement[]): void {
  if (!els.length) return;
  const done = new WeakSet<Element>();
  const pick = (batch: Element[], triggers: ScrollTrigger[]): HTMLElement[] => {
    triggers.forEach((t) => t.kill());
    const fresh = batch.filter(
      (el): el is HTMLElement => el instanceof HTMLElement && !done.has(el),
    );
    fresh.forEach((el) => done.add(el));
    return fresh;
  };
  const animate = (batch: Element[], triggers: ScrollTrigger[]): void => {
    const fresh = pick(batch, triggers);
    if (!fresh.length) return;
    gsap.set(fresh, { transition: 'none' });
    gsap.fromTo(
      fresh,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: EASE,
        stagger: 0.08,
        overwrite: true,
        onComplete: () => fresh.forEach(settle),
      },
    );
  };
  // Jumped past without entering (anchor link, restored scroll): just show.
  const show = (batch: Element[], triggers: ScrollTrigger[]): void =>
    pick(batch, triggers).forEach(settle);

  ScrollTrigger.batch(els, {
    start: 'top 92%',
    interval: 0.1,
    batchMax: 6,
    onEnter: animate,
    onEnterBack: show,
    onLeave: show,
    onLeaveBack: show,
  });
}

/** Count `[data-count]` values up from zero; `skip` holds already-visible blocks. */
function initCounters(skip: HTMLElement[]): void {
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const host = el.closest<HTMLElement>('[data-reveal]');
    if (host && skip.includes(host)) return;
    const value = Number(el.dataset['count']);
    if (!Number.isFinite(value)) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () => countUp(el, value),
    });
  });
}

// Printing mid-count would freeze an intermediate number on paper: finish them first.
const counting = new Set<gsap.core.Tween>();
window.addEventListener('beforeprint', () => counting.forEach((t) => t.progress(1)));

function countUp(el: HTMLElement, value: number): void {
  const decimals = Number(el.dataset['decimals']) || 0;
  const fmt = new Intl.NumberFormat(el.dataset['locale'], {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const final = fmt.format(value);
  // Reserve the final width so the suffix doesn't shift while counting.
  const width = el.getBoundingClientRect().width;
  Object.assign(el.style, { display: 'inline-block', minWidth: `${width}px`, textAlign: 'end' });
  const state = { v: 0 };
  el.textContent = fmt.format(0);
  const tween = gsap.to(state, {
    v: value,
    duration: 1.6,
    ease: 'power3.out',
    onUpdate: () => {
      el.textContent = fmt.format(state.v);
    },
    onComplete: () => {
      el.textContent = final;
      Object.assign(el.style, { display: '', minWidth: '', textAlign: '' });
      counting.delete(tween);
    },
  });
  counting.add(tween);
}

function isShown(el: Element): boolean {
  return Number.parseFloat(getComputedStyle(el).opacity) > 0.99;
}

/** Final, CSS-owned visible state (see `[data-revealed]` in motion.css). */
function settle(el: HTMLElement): void {
  el.setAttribute(REVEALED, '');
  el.style.removeProperty('opacity');
  el.style.removeProperty('transform');
  el.style.removeProperty('transition');
}

/** Show everything immediately: reduced motion or a failure mid-setup. */
function revealAll(): void {
  document.documentElement.classList.add(READY);
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(settle);
  document.querySelectorAll<HTMLElement>(`${HERO}, .hero__line`).forEach((el) => {
    el.style.removeProperty('opacity');
    el.style.removeProperty('transform');
    el.style.removeProperty('clip-path');
  });
}
