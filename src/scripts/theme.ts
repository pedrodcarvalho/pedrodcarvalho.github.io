export type Theme = 'dark' | 'light';

const THEME_COLOR: Record<Theme, string> = { dark: '#0a0b0d', light: '#f6f6f3' };

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function setTheme(theme: Theme): void {
  const root = document.documentElement;
  // Suppress transitions for one frame so colors swap instantly.
  root.classList.add('theme-switching');
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  try {
    localStorage.setItem('theme', theme);
  } catch {
    /* storage unavailable (private mode): theme still applies for this page */
  }
  requestAnimationFrame(() =>
    requestAnimationFrame(() => root.classList.remove('theme-switching')),
  );
  window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
}

export function toggleTheme(): void {
  setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
}

export function initTheme(): void {
  const theme = currentTheme();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', toggleTheme);
  });
}
