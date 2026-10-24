/** Header background on scroll, active-section indicator and the mobile menu sheet. */
export function initNav(): void {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (nav) {
    let ticking = false;
    const update = () => {
      nav.toggleAttribute('data-scrolled', window.scrollY > 8);
      ticking = false;
    };
    update();
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true },
    );
  }

  // Active section: the last section whose top has crossed 40% of the viewport.
  const links = new Map<string, HTMLElement>();
  document.querySelectorAll<HTMLElement>('[data-section-link]').forEach((a) => {
    links.set(a.dataset.sectionLink!, a);
  });
  const sections = [...links.keys()]
    .map((id) => document.getElementById(id))
    .filter((s): s is HTMLElement => s !== null);
  if (sections.length) {
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        const active = sections.find((s) => visible.has(s.id))?.id;
        links.forEach((a, id) => {
          if (id === active) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    sections.forEach((s) => io.observe(s));
  }

  // Mobile menu (<dialog>).
  const menu = document.querySelector<HTMLDialogElement>('[data-menu]');
  if (menu) {
    document.querySelector('[data-menu-open]')?.addEventListener('click', () => menu.showModal());
    menu.querySelector('[data-menu-close]')?.addEventListener('click', () => menu.close());
    menu
      .querySelectorAll('[data-menu-link]')
      .forEach((a) => a.addEventListener('click', () => menu.close()));
    // Click on the backdrop closes the sheet.
    menu.addEventListener('click', (e) => {
      if (e.target === menu) menu.close();
    });
    window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => {
      if (e.matches && menu.open) menu.close();
    });
  }
}
