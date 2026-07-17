// entry — boot line, theme, title, scroll meter, timeline, konami, favicon, console
import { motionOK, $, $$, initTheme, toggleLab } from "./state";
import { initCurve } from "./curve";
import { initLive } from "./live";
import { initPalette, openPalette } from "./palette";
import { initDetailsMotion, initMotion } from "./motionfx";
import { initEntropy } from "./entropy";

initTheme();

// ---- boot line typewriter (progressive enhancement: static text already in HTML) ----
function boot(): void {
  const el = $("[data-boot]");
  if (!el || !motionOK()) return;
  const finalHTML = el.innerHTML; // keep the colored ✓ version
  const text = el.textContent ?? "";
  el.textContent = "";
  const caret = document.createElement("span");
  caret.className = "caret";
  caret.textContent = "▮";
  el.appendChild(caret);
  let i = 0;
  const step = Math.max(12, Math.min(34, 1300 / text.length)); // whole line ≤ ~1.4s
  const tick = () => {
    if (i < text.length) {
      caret.before(document.createTextNode(text[i++]));
      setTimeout(tick, step);
    } else {
      // preserve the real-uptime span if the api answered mid-typing
      const uptime = el.querySelector("[data-boot-uptime]");
      el.innerHTML = finalHTML; // restore colored version, caret gone
      if (uptime) el.appendChild(uptime);
    }
  };
  setTimeout(tick, 120);
}

// ---- scroll meter + fake-honest grid frequency readout ----
function scrollMeter(): void {
  const fill = $("[data-scrollfill]");
  const hz = $("[data-hz]");
  let lastY = window.scrollY;
  let lastT = performance.now();
  let dev = 0;

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (fill) fill.style.width = `${(p * 100).toFixed(1)}%`;
  };
  update();
  window.addEventListener("scroll", update, { passive: true });

  if (!hz || !motionOK()) return; // reduced motion: keep the static 50.00 Hz
  setInterval(() => {
    const now = performance.now();
    const v = Math.abs(window.scrollY - lastY) / Math.max(1, now - lastT); // px/ms
    lastY = window.scrollY;
    lastT = now;
    dev = dev * 0.7 + Math.min(0.08, v * 0.06) * 0.3; // scroll “loads the grid”
    hz.textContent = `f: ${(50 - dev).toFixed(2)} Hz`;
  }, 250);
}

// ---- timeline activation ----
function timeline(): void {
  const steps = $$(".step");
  if (!steps.length) return;
  if (!motionOK() || !("IntersectionObserver" in window)) {
    steps.forEach((s) => s.classList.add("on"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("on")),
    { threshold: 0.6 }
  );
  steps.forEach((s) => io.observe(s));
}

// ---- document title as terminal cwd ----
function titleCwd(): void {
  const BASE = "joschi@aiwerke:~";
  document.title = BASE;
  const map: Record<string, string> = { path: "/path", projects: "/projects", offscreen: "/offscreen", contact: "/contact", lab: "/lab" };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) document.title = BASE + (map[hit.target.id] ?? "");
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    Object.keys(map).forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }
  document.addEventListener("visibilitychange", () => {
    document.title = document.hidden ? "[ctrl+z] suspended — oskar" : BASE;
  });
}

// ---- konami → lab mode ----
function konami(): void {
  const SEQ = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let pos = 0;
  document.addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === SEQ[pos] ? pos + 1 : (k === SEQ[0] ? 1 : 0);
    if (pos === SEQ.length) {
      pos = 0;
      const on = toggleLab();
      if (on) document.getElementById("lab")?.scrollIntoView({ behavior: motionOK() ? "smooth" : "auto" });
    }
  });
}

// ---- favicon: blinking cursor, green dot when the api is up ----
function favicon(): void {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) return;
  const c = document.createElement("canvas");
  c.width = 64; c.height = 64;
  const ctx = c.getContext("2d");
  if (!ctx) return;
  let on = true;
  let apiUp = false;
  const draw = () => {
    ctx.clearRect(0, 0, 64, 64);
    ctx.fillStyle = "#0A0E12";
    ctx.beginPath();
    // @ts-expect-error roundRect is widely available; fallback below
    ctx.roundRect ? ctx.roundRect(0, 0, 64, 64, 12) : ctx.rect(0, 0, 64, 64);
    ctx.fill();
    if (on) { ctx.fillStyle = "#5E8BFF"; ctx.fillRect(14, 18, 14, 28); }
    ctx.fillStyle = "#93A1AB"; ctx.fillRect(34, 38, 16, 8);
    if (apiUp) { ctx.fillStyle = "#2EE59D"; ctx.beginPath(); ctx.arc(52, 14, 6, 0, Math.PI * 2); ctx.fill(); }
    link.href = c.toDataURL("image/png");
  };
  window.addEventListener("joschi:api", (e) => { apiUp = Boolean((e as CustomEvent).detail); draw(); });
  draw();
  if (motionOK()) setInterval(() => { if (!document.hidden) { on = !on; draw(); } }, 1050);
}

// ---- api heartbeat dot in the top bar ----
function apidot(): void {
  window.addEventListener("joschi:api", (e) => {
    $("[data-apidot]")?.classList.toggle("up", Boolean((e as CustomEvent).detail));
  });
}

// ---- console greeting for dev-tools people ----
function consoleGreeting(): void {
  const s = "font-family:monospace";
  console.log(
    "%cjoschi@aiwerke:~$ %cwhoami\n" +
    "%coskar breitfeld — builds fixes for whatever annoys him.\n\n" +
    "you opened dev tools. respect.\n" +
    "things to try:\n" +
    "  ⌘K            command palette\n" +
    "  ↑↑↓↓←→←→BA    lab mode\n" +
    "  curl -i https://aiwerke.de/joschi/api/coffee\n",
    `${s};color:#5E8BFF`, `${s};color:#E8EDF2`, `${s};color:#93A1AB`
  );
}

boot();
scrollMeter();
timeline();
titleCwd();
konami();
favicon();
apidot();
consoleGreeting();
initPalette();
initLive();
initMotion();
initDetailsMotion();

const curveEl = document.querySelector<HTMLCanvasElement>("[data-curve]");
if (curveEl) initCurve(curveEl);
initEntropy();

// no content is gated behind any of this — remove all JS and the page still tells the story
export { openPalette };
