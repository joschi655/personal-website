// shared state + tiny utilities - no DOM assembly here

export const motionOK = (): boolean =>
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T | null =>
  root.querySelector<T>(sel);

export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll<T>(sel));

// all API calls are RELATIVE - works at /joschi/ in prod and / locally
export async function fetchJSON<T = unknown>(path: string, timeoutMs = 6000): Promise<T | null> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    const res = await fetch(path, { signal: ctl.signal });
    clearTimeout(t);
    if (!res.ok && res.status !== 418) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ---- theme ----
const THEME_KEY = "joschi-theme";

export function initTheme(): void {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") {
    document.documentElement.dataset.theme = saved;
  }
}

export function toggleTheme(): string {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(THEME_KEY, next); } catch { /* private mode */ }
  return next;
}

export const currentTheme = (): string => document.documentElement.dataset.theme ?? "dark";

// ---- lab mode ----
export function toggleLab(force?: boolean): boolean {
  const on = document.body.classList.toggle("lab", force);
  if (on && motionOK()) {
    document.body.classList.add("crt-flash");
    setTimeout(() => document.body.classList.remove("crt-flash"), 500);
  }
  return on;
}

export const labOn = (): boolean => document.body.classList.contains("lab");

// ---- spotify range ----
export type MusicRange = "short_term" | "medium_term" | "long_term";
export const RANGE_LABEL: Record<MusicRange, string> = {
  short_term: "last 4 weeks",
  medium_term: "last 6 months",
  long_term: "all-time",
};
const RANGE_ORDER: MusicRange[] = ["short_term", "medium_term", "long_term"];
let range: MusicRange = "medium_term";

export const getRange = (): MusicRange => range;

export function setRange(r: MusicRange): void {
  range = r;
  window.dispatchEvent(new CustomEvent("joschi:range", { detail: r }));
}

export function cycleRange(): MusicRange {
  const next = RANGE_ORDER[(RANGE_ORDER.indexOf(range) + 1) % RANGE_ORDER.length];
  setRange(next);
  return next;
}

// ---- api heartbeat ----
let apiUp = false;
export const isApiUp = (): boolean => apiUp;
export function announceApi(up: boolean): void {
  apiUp = up;
  window.dispatchEvent(new CustomEvent("joschi:api", { detail: up }));
}
