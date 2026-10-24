/**
 * Command palette: a native modal <dialog> with a WAI-ARIA combobox + listbox.
 * Options are server-rendered by CommandPalette.astro; this file only filters,
 * moves the active option and runs the chosen command.
 */
import { toggleTheme } from './theme';
import { copyText } from './interactions';
import { toast } from './toast';

type Entry = { el: HTMLElement; label: string; keywords: string };

/** Lowercase and strip diacritics: "Ações" → "acoes". */
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const isWordStart = (text: string, i: number) => i === 0 || !/[\p{L}\p{N}]/u.test(text[i - 1]!);

/**
 * Fuzzy score of `query` in `text` (-1 when it doesn't match). A plain
 * substring always matches; otherwise the query must be a subsequence that
 * starts at a word and stays compact ("flra" → "florasense", "lpdc" → "lpd
 * compiler"), so scattered letters across a long keyword list don't count.
 * Word-start and contiguous hits weigh more.
 */
export function fuzzyScore(query: string, text: string): number {
  if (!query) return 0;
  const sub = text.indexOf(query);
  let best = sub < 0 ? -1 : query.length * 4 + (isWordStart(text, sub) ? 8 : 0);
  const maxSpan = query.length * 2 + 2;
  for (let s = text.indexOf(query[0]!); s >= 0; s = text.indexOf(query[0]!, s + 1)) {
    if (!isWordStart(text, s)) continue;
    let score = 5;
    let qi = 1;
    let prev = s;
    for (let i = s + 1; i < text.length && i - s < maxSpan && qi < query.length; i++) {
      if (text[i] !== query[qi]) continue;
      score += 1 + (isWordStart(text, i) ? 4 : 0) + (i === prev + 1 ? 3 : 0);
      prev = i;
      qi++;
    }
    if (qi === query.length) best = Math.max(best, score);
  }
  return best;
}

/** Every whitespace-separated term must match the label (preferred) or the keywords. */
function rank(entry: Entry, terms: string[]): number {
  let total = 0;
  for (const term of terms) {
    const s = Math.max(fuzzyScore(term, entry.label) * 2, fuzzyScore(term, entry.keywords));
    if (s < 0) return -1;
    total += s;
  }
  return total;
}

export function initPalette(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-palette]');
  const input = dialog?.querySelector<HTMLInputElement>('[data-palette-input]');
  if (!dialog || !input) return;

  const empty = dialog.querySelector<HTMLElement>('[data-palette-empty]')!;
  const status = dialog.querySelector<HTMLElement>('[data-palette-status]')!;
  // Each group with its options in server-rendered order (filtering reorders the DOM).
  const groups = [...dialog.querySelectorAll<HTMLElement>('[data-palette-group]')].map((el) => ({
    el,
    options: [...el.querySelectorAll<HTMLElement>('[data-palette-option]')],
  }));
  const entries = new Map<HTMLElement, Entry>();
  dialog.querySelectorAll<HTMLElement>('[data-palette-option]').forEach((el) => {
    const label = el.querySelector('[data-palette-label]')?.textContent?.trim() ?? '';
    entries.set(el, {
      el,
      label: normalize(label),
      keywords: normalize(`${label} ${el.dataset.keywords ?? ''}`),
    });
  });

  let visible: HTMLElement[] = [];
  let active = -1;
  let trigger: HTMLElement | null = null;
  let statusTimer: ReturnType<typeof setTimeout> | undefined;

  function setActive(index: number, scroll = true): void {
    visible[active]?.setAttribute('aria-selected', 'false');
    active = visible.length ? (index + visible.length) % visible.length : -1;
    const el = visible[active];
    if (el) {
      el.setAttribute('aria-selected', 'true');
      input!.setAttribute('aria-activedescendant', el.id);
      if (scroll) el.scrollIntoView({ block: 'nearest' });
    } else {
      input!.removeAttribute('aria-activedescendant');
    }
  }

  function announce(count: number): void {
    const d = dialog!.dataset;
    const msg =
      count === 0
        ? d.emptyLabel
        : count === 1
          ? d.resultLabel
          : d.resultsLabel?.replace('{count}', String(count));
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => (status.textContent = msg ?? ''), 300);
  }

  function filter(): void {
    const terms = normalize(input!.value).split(/\s+/).filter(Boolean);
    visible = [];
    for (const group of groups) {
      const scored = group.options
        .map((el) => ({ el, score: terms.length ? rank(entries.get(el)!, terms) : 0 }))
        .filter((r) => {
          r.el.hidden = r.score < 0;
          r.el.setAttribute('aria-selected', 'false');
          return r.score >= 0;
        });
      // Best matches first while searching; original order otherwise (stable sort).
      if (terms.length) scored.sort((a, b) => b.score - a.score);
      scored.forEach((r) => group.el.append(r.el));
      group.el.hidden = scored.length === 0;
      visible.push(...scored.map((r) => r.el));
    }
    empty.hidden = visible.length > 0;
    input!.setAttribute('aria-expanded', String(visible.length > 0));
    active = -1;
    setActive(0, false);
    dialog!.querySelector('[role="listbox"]')?.scrollTo({ top: 0 });
    announce(visible.length);
  }

  function open(): void {
    if (dialog!.open) return;
    trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    input!.value = '';
    filter();
    dialog!.showModal();
    input!.focus();
  }

  /** Close; focus returns to the trigger unless the command moves it elsewhere. */
  function close(restoreFocus = true): void {
    if (!dialog!.open) return;
    const back = trigger;
    trigger = null;
    dialog!.close();
    if (restoreFocus && back?.isConnected) back.focus({ preventScroll: true });
  }

  /** Same page: scroll in place (top, or the hash target) and move focus there. */
  function jumpTo(url: URL): boolean {
    const here = (p: string) => p.replace(/\/$/, '') || '/';
    if (here(url.pathname) !== here(location.pathname)) return false;
    const id = url.hash ? decodeURIComponent(url.hash.slice(1)) : 'main';
    const target = document.getElementById(id);
    if (!target) return false;
    close(false);
    if (location.hash !== url.hash) history.pushState(null, '', url.href);
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';
    if (url.hash) target.scrollIntoView({ behavior, block: 'start' });
    else window.scrollTo({ top: 0, behavior });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.setAttribute('data-palette-focus', '');
    target.focus({ preventScroll: true });
    return true;
  }

  async function run(el: HTMLElement): Promise<void> {
    const { href, action, value } = el.dataset;
    switch (action) {
      case 'theme':
        close();
        toggleTheme();
        return;
      case 'copy-email':
        close();
        if (value && (await copyText(value))) toast(dialog!.dataset.copiedLabel ?? value);
        return;
      case 'download-cv': {
        close();
        if (!href) return;
        const a = Object.assign(document.createElement('a'), { href, download: '' });
        a.click();
        return;
      }
    }
    if (!href) return;
    if (el.hasAttribute('data-external')) {
      close();
      window.open(href, '_blank', 'noopener');
      return;
    }
    const url = new URL(href, location.href);
    if (jumpTo(url)) return;
    close(false);
    location.assign(url);
  }

  input.addEventListener('input', filter);
  input.addEventListener('keydown', (e) => {
    if (e.isComposing) return;
    const moves: Record<string, number> = {
      ArrowDown: active + 1,
      ArrowUp: active - 1,
      Home: 0,
      End: visible.length - 1,
    };
    if (e.key in moves) {
      e.preventDefault();
      setActive(moves[e.key]!);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const el = visible[active];
      if (el) void run(el);
    }
  });

  const list = dialog.querySelector<HTMLElement>('[role="listbox"]')!;
  list.addEventListener('pointermove', (e) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-palette-option]');
    const i = el ? visible.indexOf(el) : -1;
    if (i >= 0 && i !== active) setActive(i, false);
  });
  list.addEventListener('click', (e) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-palette-option]');
    if (el) void run(el);
  });
  // Keep focus in the input when clicking options (mousedown would blur it).
  list.addEventListener('mousedown', (e) => {
    if ((e.target as Element).closest('[data-palette-option]')) e.preventDefault();
  });

  dialog.querySelector('[data-palette-close]')?.addEventListener('click', () => close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
  // Esc: let the native dialog close, but restore focus ourselves.
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });

  document
    .querySelectorAll('[data-palette-open]')
    .forEach((btn) => btn.addEventListener('click', open));

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (dialog.open) close();
      else open();
    } else if (e.key === '/' && !dialog.open && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const t = e.target as HTMLElement | null;
      if (t?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'))
        return;
      e.preventDefault();
      open();
    }
  });
}
