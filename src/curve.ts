// animated load curve — measured past (solid) + forecast (dashed)
// honest decoration: it's labeled sim, and the cursor is the anomaly

import { motionOK } from "./state";

const css = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function initCurve(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let w = 0;
  let h = 120;
  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let phase = 0;
  let mouseX = -1;
  let mouseY = 0;
  let raf = 0;
  let visible = true;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  // layered sines = plausible daily load shape; phase drift = "live" wander
  const loadAt = (x: number, ph: number): number => {
    const t = x / w;
    let y =
      Math.sin(t * 9.4 + ph) * 0.30 +
      Math.sin(t * 4.1 - ph * 0.6) * 0.42 +
      Math.sin(t * 17.3 + ph * 1.7) * 0.12;
    // cursor proximity perturbation (desktop only)
    if (mouseX >= 0) {
      const d = (x - mouseX) / 70;
      y += Math.exp(-d * d) * ((mouseY / h) - 0.5) * -0.9;
    }
    return h * 0.52 + y * h * 0.30;
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const split = w * 0.76;
    const ink = css("--ink") || "#E8EDF2";
    const signal = css("--signal") || "#5E8BFF";

    // past — solid
    ctx.beginPath();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.setLineDash([]);
    for (let x = 0; x <= split; x += 3) {
      const y = loadAt(x, phase);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // forecast — dashed, slightly smoother (forecasts always look confident)
    ctx.beginPath();
    ctx.strokeStyle = signal;
    ctx.setLineDash([6, 6]);
    for (let x = split; x <= w; x += 3) {
      const y = loadAt(x, phase * 0.35);
      x === split ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // "now" pulse at the boundary
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.fillStyle = signal;
    ctx.arc(split, loadAt(split, phase), 4, 0, Math.PI * 2);
    ctx.fill();
  };

  const loop = () => {
    phase += 0.006;
    draw();
    raf = requestAnimationFrame(loop);
  };

  const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };
  const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

  resize();
  new ResizeObserver(() => { resize(); draw(); }).observe(canvas);
  draw();

  if (!motionOK()) return; // static curve, no loop, no listeners

  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
  });
  canvas.addEventListener("pointerleave", () => { mouseX = -1; });

  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  new IntersectionObserver(
    (entries) => { visible = entries[0]?.isIntersecting ?? true; visible ? start() : stop(); },
    { threshold: 0 }
  ).observe(canvas);

  start();
}
