import { toast } from './toast';

/** Cursor-following glow on `.card` elements (fine pointers only). */
export function initSpotlight(): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.addEventListener(
    'pointermove',
    (e) => {
      const card = (e.target as Element | null)?.closest?.<HTMLElement>('.card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    },
    { passive: true },
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function initCopy(): void {
  document.querySelectorAll<HTMLElement>('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (await copyText(btn.dataset.copy!)) {
        toast(btn.dataset.copiedLabel ?? 'Copied');
        btn.setAttribute('data-copied', '');
        setTimeout(() => btn.removeAttribute('data-copied'), 1600);
      }
    });
  });
}

/** Local time in Campinas on the hero ID card. */
export function initClock(): void {
  const el = document.querySelector<HTMLTimeElement>('[data-local-clock]');
  if (!el) return;
  const fmt = new Intl.DateTimeFormat(document.documentElement.lang, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  });
  const tick = () => {
    const now = new Date();
    el.textContent = fmt.format(now);
    el.dateTime = now.toISOString();
  };
  tick();
  setInterval(tick, 15_000);
}

/** Show the platform-appropriate shortcut hint (⌘K on Apple devices). */
export function initKbdHints(): void {
  const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
  if (!isApple) return;
  document.querySelectorAll('[data-kbd]').forEach((k) => (k.textContent = '⌘K'));
}
