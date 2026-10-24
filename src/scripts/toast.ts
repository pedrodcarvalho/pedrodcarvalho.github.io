let timer: ReturnType<typeof setTimeout> | undefined;

/** Show a short status message in the shared live region. */
export function toast(message: string, ms = 2200): void {
  const el = document.querySelector<HTMLElement>('[data-toast]');
  if (!el) return;
  el.textContent = message;
  el.setAttribute('data-open', '');
  clearTimeout(timer);
  timer = setTimeout(() => el.removeAttribute('data-open'), ms);
}
