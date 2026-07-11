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
  let split = 0;
  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let phase = 0;
  let raf = 0;
  let visible = true;

  // cursor state: targets set by pointer events, smoothed values eased per frame
  let tx = 0;
  let ty = 0;
  let tStrength = 0;
  let sx = 0;
  let sy = 0;
  let strength = 0;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    split = w * 0.76;
    dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  // layered sines = plausible daily load shape; phase drift = "live" wander
  const shape = (x: number, ph: number): number => {
    const t = x / w;
    return (
      Math.sin(t * 9.4 + ph) * 0.30 +
      Math.sin(t * 4.1 - ph * 0.6) * 0.42 +
      Math.sin(t * 17.3 + ph * 1.7) * 0.12
    );
  };

  const loadAt = (x: number): number => {
    // measured curve everywhere; past the split, cross-fade its VALUE toward the
    // calmer forecast curve (never blend phases — unbounded phase would chirp).
    // smoothstep is 0 with zero slope at the split, so both segments share the
    // junction point and its tangent: no gap, no kink.
    let v = shape(x, phase);
    if (x > split && w > split) {
      const u = Math.min(1, (x - split) / (w - split));
      const s = u * u * (3 - 2 * u);
      v += (shape(x, phase * 0.35) - v) * s;
    }
    let y = h * 0.52 + v * h * 0.30;
    // cursor repulsion: 2D falloff around the eased cursor, push direction from
    // tanh of vertical distance (smooth through zero — no crease at the cursor line)
    if (strength > 0.004) {
      const dx = (x - sx) / 80;
      const dy = (y - sy) / 55;
      const g = Math.exp(-(dx * dx + dy * dy)) * strength;
      y += Math.tanh((y - sy) / 45) * g * 26;
    }
    return Math.min(h - 4, Math.max(4, y));
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const ink = css("--ink") || "#E8EDF2";
    const signal = css("--signal") || "#5E8BFF";
    const nowY = loadAt(split);

    // past — solid, ending exactly on the junction
    ctx.beginPath();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.setLineDash([]);
    for (let x = 0; x < split; x += 3) {
      const y = loadAt(x);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.lineTo(split, nowY);
    ctx.stroke();

    // forecast — dashed, starting exactly on the junction
    ctx.beginPath();
    ctx.strokeStyle = signal;
    ctx.setLineDash([6, 6]);
    ctx.moveTo(split, nowY);
    for (let x = split + 3; x < w; x += 3) ctx.lineTo(x, loadAt(x));
    ctx.lineTo(w, loadAt(w));
    ctx.stroke();

    // "now" pulse at the boundary
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.fillStyle = signal;
    ctx.arc(split, nowY, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  const loop = () => {
    phase += 0.006;
    // ease cursor state toward targets; snap fully off below epsilon
    sx += (tx - sx) * 0.14;
    sy += (ty - sy) * 0.14;
    strength += (tStrength - strength) * 0.1;
    if (tStrength === 0 && strength < 0.004) strength = 0;
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
    tx = e.clientX - r.left;
    ty = e.clientY - r.top;
    // fresh entry: appear in place (position snaps, strength fades in from 0)
    if (strength === 0) { sx = tx; sy = ty; }
    tStrength = 1;
  });
  canvas.addEventListener("pointerleave", () => { tStrength = 0; });

  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  new IntersectionObserver(
    (entries) => { visible = entries[0]?.isIntersecting ?? true; visible ? start() : stop(); },
    { threshold: 0 }
  ).observe(canvas);

  start();
}
