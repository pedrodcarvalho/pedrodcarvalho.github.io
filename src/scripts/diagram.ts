/**
 * Experience highlights ↔ V2X diagram. Hovering or focusing a `[data-nodes]`
 * element lights up the matching `[data-node]` groups and wires in the diagram.
 */
export function initDiagram(): void {
  const diagram = document.querySelector<HTMLElement>('[data-diagram]');
  if (!diagram) return;
  const targets = [...diagram.querySelectorAll<SVGElement>('[data-node]')];
  const triggers = [...document.querySelectorAll<HTMLElement>('[data-nodes]')];

  const activate = (trigger: HTMLElement | null) => {
    const ids = new Set(trigger?.dataset.nodes?.split(' ') ?? []);
    diagram.toggleAttribute('data-focus', ids.size > 0);
    for (const el of targets) el.toggleAttribute('data-active', ids.has(el.dataset.node!));
    for (const t of triggers) t.toggleAttribute('data-active', t === trigger);
  };

  for (const t of triggers) {
    t.addEventListener('pointerenter', () => activate(t));
    t.addEventListener('focus', () => activate(t));
    t.addEventListener('pointerleave', () => {
      if (document.activeElement !== t) activate(null);
    });
    t.addEventListener('blur', () => activate(null));
  }
}
