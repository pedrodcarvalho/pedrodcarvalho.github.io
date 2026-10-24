/**
 * Hero "signal field": vehicles / edge nodes drift along gentle lanes, link up
 * when in radio range, relay packets and broadcast ripples. The pointer acts as
 * a roadside unit (RSU). Plain canvas 2D, no allocations in the frame loop.
 */

type RGB = readonly [number, number, number];
type Ctx = CanvasRenderingContext2D;

const MAX_NODES = 80;
const MAX_LINKS = (MAX_NODES * (MAX_NODES - 1)) / 2;
const MAX_LANES = 9;
const PLATOON = 3;
const MAX_PACKETS = 6;
const MAX_RIPPLES = 4;
const RSU_RANGE = 160;
const PACKET_SPEED = 240; // px/s
const WRAP = 0.05; // off-screen margin, as a fraction of width
const TAU = Math.PI * 2;

/** Parse `#rgb`, `#rrggbb(aa)` or `rgb()/rgba()` (comma or space syntax). */
export function parseColor(input: string, fallback: RGB): RGB {
  const s = input.trim();
  if (s.startsWith('#')) {
    let hex = s.slice(1);
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join('');
    const n = Number.parseInt(hex.slice(0, 6), 16);
    return hex.length < 6 || Number.isNaN(n)
      ? fallback
      : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : fallback;
}

const rgba = ([r, g, b]: RGB, a = 1): string => `rgba(${r}, ${g}, ${b}, ${a})`;
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, v: number): number => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const rand = (lo: number, hi: number): number => lo + Math.random() * (hi - lo);

export function mountSignalField(
  canvas: HTMLCanvasElement,
  { reducedMotion }: { reducedMotion: boolean },
): void {
  const maybeCtx = canvas.getContext('2d');
  if (!maybeCtx) return;
  const ctx: Ctx = maybeCtx;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Palette (re-read on theme change).
  let cAccent = '';
  let cLive = '';
  let cNode = '';
  let cLine = '';
  let cLineRgb: RGB = [255, 255, 255];
  let linkAlpha = 0.3;
  let laneAlpha = 0.06;
  let laneStroke: CanvasGradient | string = '';

  // Layout.
  let w = 0;
  let h = 0;
  let count = 0;
  let lanes = 5;
  let range = 120;
  let intensity = 1;

  // Nodes (structure of arrays). `u` is the normalized x position.
  const nU = new Float32Array(MAX_NODES);
  const nLane = new Uint8Array(MAX_NODES);
  const nOff = new Float32Array(MAX_NODES);
  const nSpeed = new Float32Array(MAX_NODES);
  const nAccent = new Uint8Array(MAX_NODES);
  const nFlash = new Float32Array(MAX_NODES);
  const nRsu = new Float32Array(MAX_NODES);
  const nX = new Float32Array(MAX_NODES);
  const nY = new Float32Array(MAX_NODES);
  const nDepth = new Float32Array(MAX_NODES);
  const nFade = new Float32Array(MAX_NODES);
  let seeded = 0;

  const laneT = new Float32Array(MAX_LANES);
  const laneDir = new Int8Array(MAX_LANES);
  const lanePhase = new Float32Array(MAX_LANES);
  for (let l = 0; l < MAX_LANES; l++) {
    laneDir[l] = l % 2 ? -1 : 1;
    lanePhase[l] = Math.random() * TAU;
  }

  // Active links this frame.
  const lA = new Uint8Array(MAX_LINKS);
  const lB = new Uint8Array(MAX_LINKS);
  const lAlpha = new Float32Array(MAX_LINKS);
  let links = 0;

  // Packets relayed hop by hop along links.
  const pOn = new Uint8Array(MAX_PACKETS);
  const pA = new Uint8Array(MAX_PACKETS);
  const pB = new Uint8Array(MAX_PACKETS);
  const pT = new Float32Array(MAX_PACKETS);
  const pDur = new Float32Array(MAX_PACKETS);
  const pHops = new Uint8Array(MAX_PACKETS);
  const pLive = new Uint8Array(MAX_PACKETS);
  let nextPacket = 0.6;

  // Broadcast ripples (fixed centre).
  const rOn = new Uint8Array(MAX_RIPPLES);
  const rX = new Float32Array(MAX_RIPPLES);
  const rY = new Float32Array(MAX_RIPPLES);
  const rAge = new Float32Array(MAX_RIPPLES);
  const rMax = new Float32Array(MAX_RIPPLES);
  let nextRipple = 1.2;

  // Pointer as RSU.
  let ptrX = 0;
  let ptrY = 0;
  let ptrIn = false;
  let rsu = 0; // smoothed presence 0..1
  let rsuX = 0;
  let rsuY = 0;
  let rsuPulse = 0;

  // Loop state.
  let raf = 0;
  let last = 0;
  let inView = true;
  let shown = false;

  function readPalette(): void {
    const cs = getComputedStyle(document.documentElement);
    const v = (name: string) => cs.getPropertyValue(name);
    cAccent = rgba(parseColor(v('--accent'), [61, 220, 203]));
    cLive = rgba(parseColor(v('--live'), [255, 181, 71]));
    cNode = rgba(parseColor(v('--fg-subtle'), [138, 144, 151]));
    cLineRgb = parseColor(v('--line-strong'), [255, 255, 255]);
    cLine = rgba(cLineRgb);
    const light = document.documentElement.dataset['theme'] === 'light';
    linkAlpha = light ? 0.34 : 0.3;
    laneAlpha = light ? 0.07 : 0.06;
    if (w) laneStroke = laneGradient();
  }

  /** Nodes come in small platoons that share a lane and (roughly) a speed. */
  function seedNode(i: number): void {
    const lead = i % PLATOON === 0;
    const prev = lead ? 0 : i - 1;
    // Leaders are stratified along their lane so no stretch of road sits empty.
    const k = (i / PLATOON) | 0;
    const slots = Math.ceil(Math.ceil(count / PLATOON) / lanes);
    nU[i] = lead
      ? ((((k / lanes) | 0) % slots) + rand(0.15, 0.85)) / slots
      : nU[prev]! + rand(0.02, 0.05) * -laneDir[nLane[prev]!]!;
    nOff[i] = rand(-1, 1);
    nSpeed[i] = lead ? rand(0.8, 1.2) : nSpeed[prev]! * rand(0.96, 1.04);
    nAccent[i] = Math.random() < 0.12 ? 1 : 0;
    nFlash[i] = 0;
  }

  function layout(): void {
    const rect = canvas.getBoundingClientRect();
    w = Math.round(rect.width);
    h = Math.round(rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const small = !finePointer || w < 640;
    count = clamp(Math.round((w * h) / 14000), 24, MAX_NODES);
    if (small) count = Math.max(16, Math.round(count * 0.6));
    lanes = clamp(Math.round(h / 95), 5, MAX_LANES);
    for (let l = 0; l < lanes; l++) laneT[l] = lanes > 1 ? l / (lanes - 1) : 1;
    for (let i = 0; i < MAX_NODES; i++) nLane[i] = ((i / PLATOON) | 0) % lanes;
    for (; seeded < count; seeded++) seedNode(seeded);
    range = clamp(Math.sqrt((w * h) / count) * 1.45, 100, 170);
    intensity = w < 720 ? 0.7 : 1;
    laneStroke = laneGradient();
  }

  /** Lane guides fade in from the text side. */
  function laneGradient(): CanvasGradient {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0.1, rgba(cLineRgb, 0));
    g.addColorStop(0.65, rgba(cLineRgb, laneAlpha));
    g.addColorStop(1, rgba(cLineRgb, laneAlpha * 0.6));
    return g;
  }

  function laneY(l: number, u: number): number {
    const t = laneT[l]!;
    return h * (0.12 + 0.8 * t ** 1.4) + h * 0.025 * Math.sin(u * TAU * 0.8 + lanePhase[l]!);
  }

  /** Advance the simulation and compute screen positions. */
  function step(dt: number): void {
    for (let i = 0; i < count; i++) {
      const l = nLane[i]!;
      const t = laneT[l]!;
      const dir = laneDir[l]!;
      // Nearer lanes (bottom) move faster: cheap perspective.
      let u = nU[i]! + (dir * (8 + 28 * t) * nSpeed[i]! * dt) / w;
      if (u > 1 + WRAP) u -= 1 + 2 * WRAP;
      else if (u < -WRAP) u += 1 + 2 * WRAP;
      nU[i] = u;
      const x = u * w;
      nX[i] = x;
      nY[i] = laneY(l, u) + nOff[i]! * (3 + 6 * t);
      nDepth[i] = t;
      // Keep the text side calm; the overlay does the rest.
      nFade[i] = 0.25 + 0.75 * smooth(0.12 * w, 0.6 * w, x);
      nFlash[i] = Math.max(0, nFlash[i]! - dt * 1.6);
      nRsu[i] = 0;
    }
  }

  function findLinks(): void {
    links = 0;
    const r2 = range * range;
    for (let i = 0; i < count; i++) {
      const xi = nX[i]!;
      const yi = nY[i]!;
      for (let j = i + 1; j < count; j++) {
        const dx = nX[j]! - xi;
        const dy = nY[j]! - yi;
        if (dx > range || dx < -range || dy > range || dy < -range) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const k = 1 - Math.sqrt(d2) / range;
        lA[links] = i;
        lB[links] = j;
        lAlpha[links] = k * k * Math.min(nFade[i]!, nFade[j]!);
        links++;
      }
    }
  }

  function updatePackets(dt: number): void {
    nextPacket -= dt;
    if (nextPacket <= 0 && links > 0) {
      nextPacket = rand(0.35, 0.9);
      const slot = pOn.indexOf(0);
      if (slot >= 0) {
        const li = (Math.random() * links) | 0;
        const fwd = Math.random() < 0.5;
        launch(slot, fwd ? lA[li]! : lB[li]!, fwd ? lB[li]! : lA[li]!);
        pHops[slot] = 0;
        pLive[slot] = Math.random() < 0.2 ? 1 : 0;
      }
    }
    for (let p = 0; p < MAX_PACKETS; p++) {
      if (!pOn[p]) continue;
      const a = pA[p]!;
      const b = pB[p]!;
      // Drop packets whose link broke (node wrapped around or drifted away).
      if (Math.hypot(nX[b]! - nX[a]!, nY[b]! - nY[a]!) > range * 1.3) {
        pOn[p] = 0;
        continue;
      }
      pT[p] = pT[p]! + dt / pDur[p]!;
      if (pT[p]! < 1) continue;
      nFlash[b] = 1;
      const next = pHops[p]! < 3 && Math.random() < 0.65 ? neighbour(b, a) : -1;
      if (next < 0) pOn[p] = 0;
      else {
        launch(p, b, next);
        pHops[p] = pHops[p]! + 1;
      }
    }
  }

  function launch(p: number, a: number, b: number): void {
    pOn[p] = 1;
    pA[p] = a;
    pB[p] = b;
    pT[p] = 0;
    pDur[p] = Math.max(0.25, Math.hypot(nX[b]! - nX[a]!, nY[b]! - nY[a]!) / PACKET_SPEED);
  }

  /** A random linked neighbour of `n` other than `from` (reservoir pick), or -1. */
  function neighbour(n: number, from: number): number {
    let pick = -1;
    let seen = 0;
    for (let k = 0; k < links; k++) {
      const other = lA[k] === n ? lB[k]! : lB[k] === n ? lA[k]! : -1;
      if (other < 0 || other === from) continue;
      if (Math.random() * ++seen < 1) pick = other;
    }
    return pick;
  }

  function updateRipples(dt: number): void {
    nextRipple -= dt;
    if (nextRipple <= 0 && count > 0) {
      nextRipple = rand(1.4, 3);
      const slot = rOn.indexOf(0);
      if (slot >= 0) emit(slot, pickEmitter(), 0);
    }
    for (let r = 0; r < MAX_RIPPLES; r++) {
      if (!rOn[r]) continue;
      rAge[r] = rAge[r]! + dt / 1.9;
      if (rAge[r]! >= 1) {
        rOn[r] = 0;
        continue;
      }
      // Nodes light up as the wavefront reaches them.
      const radius = rippleRadius(r);
      for (let i = 0; i < count; i++) {
        const d = Math.hypot(nX[i]! - rX[r]!, nY[i]! - rY[r]!);
        if (Math.abs(d - radius) < 5) nFlash[i] = Math.max(nFlash[i]!, 0.9 * (1 - rAge[r]!));
      }
    }
  }

  /** Prefer accent nodes on the visible (right) side. */
  function pickEmitter(): number {
    let best = (Math.random() * count) | 0;
    for (let tries = 0; tries < 6; tries++) {
      const i = (Math.random() * count) | 0;
      if (nX[i]! > w * 0.4 && nX[i]! < w * 0.97 && (nAccent[i] || tries > 2)) return i;
      best = i;
    }
    return best;
  }

  function emit(slot: number, node: number, age: number): void {
    rOn[slot] = 1;
    rX[slot] = nX[node]!;
    rY[slot] = nY[node]!;
    rAge[slot] = age;
    rMax[slot] = rand(48, 76) * (0.8 + 0.4 * nDepth[node]!);
    nFlash[node] = 1;
  }

  const rippleRadius = (r: number): number => rMax[r]! * (1 - (1 - rAge[r]!) ** 3);

  function updateRsu(dt: number): void {
    let target = 0;
    if (ptrIn) {
      const rect = canvas.getBoundingClientRect();
      const x = ptrX - rect.left;
      const y = ptrY - rect.top;
      if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        rsuX = x;
        rsuY = y;
        target = 1;
      }
    }
    rsu += (target - rsu) * Math.min(1, dt * 5);
    rsuPulse = (rsuPulse + dt / 2.4) % 1;
  }

  function draw(): void {
    const c = ctx;
    c.clearRect(0, 0, w, h);
    c.lineCap = 'round';
    drawLanes(c);
    drawLinks(c);
    if (rsu > 0.01) drawRsu(c);
    drawRipples(c);
    drawPackets(c);
    drawNodes(c);
  }

  function drawLanes(c: Ctx): void {
    c.strokeStyle = laneStroke;
    c.lineWidth = 1;
    c.globalAlpha = intensity;
    c.beginPath();
    for (let l = 0; l < lanes; l++) {
      c.moveTo(0, laneY(l, 0));
      for (let x = 24; x < w + 24; x += 24) c.lineTo(x, laneY(l, x / w));
    }
    c.stroke();
  }

  function drawLinks(c: Ctx): void {
    c.lineWidth = 1;
    // Neutral links first, then links touching an accent node.
    for (let pass = 0; pass < 2; pass++) {
      c.strokeStyle = pass ? cAccent : cLine;
      const scale = (pass ? 0.75 : 1) * linkAlpha * intensity;
      for (let k = 0; k < links; k++) {
        const accent = nAccent[lA[k]!]! | nAccent[lB[k]!]!;
        if (accent !== pass) continue;
        c.globalAlpha = lAlpha[k]! * scale;
        c.beginPath();
        c.moveTo(nX[lA[k]!]!, nY[lA[k]!]!);
        c.lineTo(nX[lB[k]!]!, nY[lB[k]!]!);
        c.stroke();
      }
    }
  }

  function drawRsu(c: Ctx): void {
    c.strokeStyle = cAccent;
    c.lineWidth = 1;
    for (let i = 0; i < count; i++) {
      const d = Math.hypot(nX[i]! - rsuX, nY[i]! - rsuY);
      if (d > RSU_RANGE) continue;
      const k = (1 - d / RSU_RANGE) ** 1.5 * rsu;
      nRsu[i] = k;
      c.globalAlpha = k * 0.55;
      c.beginPath();
      c.moveTo(rsuX, rsuY);
      c.lineTo(nX[i]!, nY[i]!);
      c.stroke();
    }
    // Range pulse and the unit itself.
    c.globalAlpha = (1 - rsuPulse) ** 2 * 0.22 * rsu;
    c.beginPath();
    c.arc(rsuX, rsuY, RSU_RANGE * rsuPulse, 0, TAU);
    c.stroke();
    c.globalAlpha = 0.75 * rsu;
    c.beginPath();
    c.arc(rsuX, rsuY, 4, 0, TAU);
    c.stroke();
    c.fillStyle = cAccent;
    c.beginPath();
    c.arc(rsuX, rsuY, 1.5, 0, TAU);
    c.fill();
  }

  function drawRipples(c: Ctx): void {
    c.strokeStyle = cAccent;
    c.lineWidth = 1;
    for (let r = 0; r < MAX_RIPPLES; r++) {
      if (!rOn[r]) continue;
      c.globalAlpha = (1 - rAge[r]!) ** 1.6 * 0.4 * intensity;
      c.beginPath();
      c.arc(rX[r]!, rY[r]!, rippleRadius(r), 0, TAU);
      c.stroke();
    }
  }

  function drawPackets(c: Ctx): void {
    c.lineWidth = 1.25;
    for (let p = 0; p < MAX_PACKETS; p++) {
      if (!pOn[p]) continue;
      const a = pA[p]!;
      const b = pB[p]!;
      const t = pT[p]!;
      const t0 = Math.max(0, t - 0.3);
      const ax = nX[a]!;
      const ay = nY[a]!;
      const dx = nX[b]! - ax;
      const dy = nY[b]! - ay;
      const x = ax + dx * t;
      const y = ay + dy * t;
      const color = pLive[p] ? cLive : cAccent;
      c.strokeStyle = color;
      c.fillStyle = color;
      c.globalAlpha = 0.5 * intensity;
      c.beginPath();
      c.moveTo(ax + dx * t0, ay + dy * t0);
      c.lineTo(x, y);
      c.stroke();
      c.globalAlpha = 0.16 * intensity;
      c.beginPath();
      c.arc(x, y, 5, 0, TAU);
      c.fill();
      c.globalAlpha = intensity;
      c.beginPath();
      c.arc(x, y, 1.7, 0, TAU);
      c.fill();
    }
  }

  function drawNodes(c: Ctx): void {
    for (let i = 0; i < count; i++) {
      const x = nX[i]!;
      const y = nY[i]!;
      if (x < -8 || x > w + 8) continue;
      const t = nDepth[i]!;
      const r = 1.4 + 1.1 * t;
      const base = (0.4 + 0.45 * t) * nFade[i]! * intensity;
      const glow = Math.max(nFlash[i]!, nRsu[i]!);
      if (nAccent[i]) {
        c.fillStyle = cAccent;
        c.globalAlpha = base * 0.14;
        c.beginPath();
        c.arc(x, y, r * 3.4, 0, TAU);
        c.fill();
        c.globalAlpha = Math.min(1, base * 1.4);
      } else {
        c.fillStyle = cNode;
        c.globalAlpha = base;
      }
      c.beginPath();
      c.arc(x, y, r, 0, TAU);
      c.fill();
      if (glow > 0.02) {
        c.fillStyle = cAccent;
        c.globalAlpha = glow * 0.9;
        c.beginPath();
        c.arc(x, y, r + glow, 0, TAU);
        c.fill();
      }
    }
    c.globalAlpha = 1;
  }

  function reveal(): void {
    if (shown) return;
    shown = true;
    canvas.setAttribute('data-ready', '');
  }

  // A single still frame for reduced motion: links, nodes and one broadcast.
  function renderStatic(): void {
    if (!w || !h) return;
    step(0);
    findLinks();
    rOn.fill(0);
    emit(0, pickEmitter(), 0.35);
    nFlash.fill(0);
    draw();
    reveal();
  }

  function frame(now: number): void {
    raf = 0;
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    step(dt);
    findLinks();
    updatePackets(dt);
    updateRipples(dt);
    updateRsu(dt);
    draw();
    reveal();
    start();
  }

  function start(): void {
    if (raf || reducedMotion || !inView || document.hidden || !w || !h) return;
    if (!last) last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop(): void {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0; // resume from "now", no time jump
  }

  readPalette();

  new ResizeObserver(() => {
    layout();
    if (reducedMotion) renderStatic();
    else {
      // Resizing clears the bitmap: redraw now rather than wait a frame.
      step(0);
      findLinks();
      draw();
      start();
    }
  }).observe(canvas);

  window.addEventListener('themechange', () => {
    readPalette();
    if (reducedMotion) renderStatic();
    else draw();
  });

  if (reducedMotion) return;

  new IntersectionObserver(([entry]) => {
    inView = entry?.isIntersecting ?? true;
    if (inView) start();
    else stop();
  }).observe(canvas);

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  if (finePointer) {
    window.addEventListener(
      'pointermove',
      (e) => {
        ptrX = e.clientX;
        ptrY = e.clientY;
        ptrIn = true;
      },
      { passive: true },
    );
    document.addEventListener('pointerout', (e) => {
      if (!e.relatedTarget) ptrIn = false;
    });
    window.addEventListener('blur', () => (ptrIn = false));
  }
}
