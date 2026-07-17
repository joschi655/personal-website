// entropy strip: particles drift left→right. left half = chaos (random walk),
// crossing the midline they lock onto ordered lanes. chaos in, order out —
// the whole "annoyance → built" pattern as a picture. own implementation,
// no code taken from the pasted react component.

type P = { x: number; y: number; vy: number; lane: number };

const LANES = 5;
const SPEED = 26; // px/s rightward drift
const LINK_DIST = 46; // px, chaos-side connection lines

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function initEntropy(): void {
  const canvas = document.querySelector<HTMLCanvasElement>("[data-entropy]");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, dpr = 1;
  let parts: P[] = [];
  let colors = { muted: "#93A1AB", signal: "#5E8BFF", line: "#1E2830" };
  let raf = 0, last = 0, visible = false;

  const readColors = () => {
    colors = {
      muted: cssVar("--muted") || colors.muted,
      signal: cssVar("--signal") || colors.signal,
      line: cssVar("--line") || colors.line,
    };
  };

  const laneY = (lane: number) => ((lane + 1) / (LANES + 1)) * h;

  const seed = () => {
    const n = Math.max(36, Math.min(110, Math.floor(w / 12)));
    parts = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vy: 0,
      lane: Math.floor(Math.random() * LANES),
    }));
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = rect.width;
    h = canvas.clientHeight || 140;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  };

  const step = (dt: number) => {
    const mid = w * 0.5;
    for (const p of parts) {
      p.x += SPEED * dt;
      if (p.x > w + 6) {
        p.x = -6;
        p.y = Math.random() * h;
        p.lane = Math.floor(Math.random() * LANES);
        p.vy = 0;
      }
      if (p.x < mid) {
        // chaos: damped random walk
        p.vy += (Math.random() - 0.5) * 34 * dt;
        p.vy *= 0.96;
        p.y += p.vy;
        if (p.y < 4 || p.y > h - 4) { p.vy *= -1; p.y = Math.max(4, Math.min(h - 4, p.y)); }
      } else {
        // order: ease onto the assigned lane
        p.y += (laneY(p.lane) - p.y) * Math.min(1, 4.5 * dt);
        p.vy = 0;
      }
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const mid = w * 0.5;
    // faint lanes on the ordered side
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1;
    for (let l = 0; l < LANES; l++) {
      ctx.beginPath();
      ctx.moveTo(mid, laneY(l));
      ctx.lineTo(w, laneY(l));
      ctx.stroke();
    }
    // chaos-side links
    const chaos = parts.filter(p => p.x < mid);
    ctx.strokeStyle = colors.muted + "2e";
    for (let i = 0; i < chaos.length; i++) {
      for (let j = i + 1; j < chaos.length; j++) {
        const a = chaos[i], b = chaos[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK_DIST) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    // particles: muted while chaotic, signal once ordered
    for (const p of parts) {
      ctx.fillStyle = p.x < mid ? colors.muted : colors.signal;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const frame = (t: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    step(dt);
    draw();
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (reduced || raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

  readColors();
  resize();
  if (reduced) {
    // static but complete: settle the ordered side, draw one frame
    for (let i = 0; i < 120; i++) step(1 / 30);
    draw();
  } else {
    new IntersectionObserver(es => {
      visible = es[0]?.isIntersecting ?? false;
      visible ? start() : stop();
    }, { rootMargin: "60px" }).observe(canvas);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : visible && start()));
  }
  addEventListener("resize", () => { resize(); if (reduced) { for (let i = 0; i < 120; i++) step(1 / 30); draw(); } });
  new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}
