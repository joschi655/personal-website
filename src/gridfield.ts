// fixed power-flow field behind the page. The topology is seeded, not random on
// every load, so it behaves like an instrument rather than decorative confetti.

export type GridLoadDetail = { progress: number; impulse: number };

type Node = { x: number; y: number; size: number };
type Edge = { a: number; b: number };
type Pulse = { edge: number; t: number; speed: number };

const css = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function seeded(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function initGridfield(): void {
  const canvas = document.querySelector<HTMLCanvasElement>("[data-gridfield]");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, dpr = 1;
  let nodes: Node[] = [], edges: Edge[] = [], pulses: Pulse[] = [];
  let colors = { line: "#1E2830", muted: "#93A1AB", signal: "#5E8BFF", warn: "#FFB454" };
  let progress = 0, impulse = 0, pointerX = -999, pointerY = -999, pointerStrength = 0;
  let raf = 0, last = 0;

  const readColors = () => {
    colors = {
      line: css("--line") || colors.line,
      muted: css("--muted") || colors.muted,
      signal: css("--signal") || colors.signal,
      warn: css("--warn") || colors.warn,
    };
  };

  const build = () => {
    const rand = seeded(0x4a4f5343 + Math.round(w / 100));
    const count = w < 680 ? 13 : w < 1100 ? 20 : 29;
    nodes = Array.from({ length: count }, (_, i) => {
      const band = i % 5;
      return {
        x: ((band + .12 + rand() * .76) / 5) * w,
        y: (rand() * .92 + .04) * h,
        size: rand() > .82 ? 2.4 : 1.45,
      };
    });

    const seen = new Set<string>();
    edges = [];
    nodes.forEach((a, ai) => {
      const closest = nodes
        .map((b, bi) => ({ bi, d: bi === ai ? Infinity : Math.hypot(a.x - b.x, a.y - b.y) }))
        .sort((x, y) => x.d - y.d)
        .slice(0, ai % 3 === 0 ? 3 : 2);
      closest.forEach(({ bi }) => {
        const key = ai < bi ? `${ai}:${bi}` : `${bi}:${ai}`;
        if (!seen.has(key)) { seen.add(key); edges.push({ a: ai, b: bi }); }
      });
    });

    pulses = Array.from({ length: w < 680 ? 4 : 9 }, (_, i) => ({
      edge: edges.length ? (i * 7 + 3) % edges.length : 0,
      t: rand(),
      speed: .035 + rand() * .035,
    }));
  };

  const resize = () => {
    w = innerWidth;
    h = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  };

  const point = (n: Node): { x: number; y: number } => {
    if (pointerStrength < .01) return n;
    const dx = n.x - pointerX;
    const dy = n.y - pointerY;
    const d = Math.max(1, Math.hypot(dx, dy));
    const push = Math.max(0, 1 - d / 180) * 11 * pointerStrength;
    return { x: n.x + dx / d * push, y: n.y + dy / d * push };
  };

  const bezierPoint = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => {
    const mid = (a.x + b.x) / 2;
    const u = 1 - t;
    return {
      x: u * u * u * a.x + 3 * u * u * t * mid + 3 * u * t * t * mid + t * t * t * b.x,
      y: u * u * u * a.y + 3 * u * u * t * a.y + 3 * u * t * t * b.y + t * t * t * b.y,
    };
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const lab = document.body.classList.contains("lab");
    const signal = lab ? colors.warn : colors.signal;
    const shifted = progress * 18;

    ctx.lineWidth = 1.1;
    ctx.strokeStyle = lab ? signal : colors.muted;
    ctx.globalAlpha = lab ? .28 + impulse * .14 : .20 + impulse * .09;
    edges.forEach((edge) => {
      const a0 = point(nodes[edge.a]), b0 = point(nodes[edge.b]);
      const a = { x: a0.x, y: a0.y - shifted };
      const b = { x: b0.x, y: b0.y - shifted };
      const mid = (a.x + b.x) / 2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.bezierCurveTo(mid, a.y, mid, b.y, b.x, b.y);
      ctx.stroke();
    });

    ctx.fillStyle = signal;
    nodes.forEach((node, i) => {
      const p = point(node);
      const near = Math.max(0, 1 - Math.hypot(p.x - pointerX, p.y - pointerY) / 180) * pointerStrength;
      ctx.globalAlpha = .30 + near * .46 + (i % 7 === 0 ? .14 : 0);
      ctx.fillRect(p.x - node.size, p.y - shifted - node.size, node.size * 2, node.size * 2);
    });

    pulses.forEach((pulse, i) => {
      const edge = edges[pulse.edge];
      if (!edge) return;
      const a0 = point(nodes[edge.a]), b0 = point(nodes[edge.b]);
      const p = bezierPoint(a0, b0, reduced ? ((i + 1) / (pulses.length + 1)) : pulse.t);
      ctx.globalAlpha = lab ? .88 : .58 + impulse * .32;
      ctx.beginPath();
      ctx.arc(p.x, p.y - shifted, lab ? 2.3 : 1.8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  const frame = (now: number) => {
    raf = 0;
    if (document.hidden) return;
    const dt = Math.min(.05, (now - last) / 1000 || .016);
    last = now;
    pointerStrength += ((pointerX < -100 ? 0 : 1) - pointerStrength) * .08;
    pulses.forEach((pulse) => {
      pulse.t += dt * (pulse.speed + impulse * .13);
      if (pulse.t > 1) {
        pulse.t -= 1;
        pulse.edge = (pulse.edge + 5) % Math.max(1, edges.length);
      }
    });
    draw();
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (reduced || raf || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

  readColors();
  resize();
  draw();

  addEventListener("resize", () => { resize(); draw(); });
  new MutationObserver(() => { readColors(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  new MutationObserver(draw).observe(document.body, { attributes: true, attributeFilter: ["class"] });

  if (reduced) return;
  addEventListener("pointermove", (event) => { pointerX = event.clientX; pointerY = event.clientY; }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { pointerX = -999; pointerY = -999; });
  addEventListener("joschi:grid-load", ((event: CustomEvent<GridLoadDetail>) => {
    progress = event.detail.progress;
    impulse = event.detail.impulse;
  }) as EventListener);
  document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
  start();
}
