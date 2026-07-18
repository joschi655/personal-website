// live widgets — real data from my own server, or an honest offline state
// endpoints are RELATIVE (api/…) so they work at /joschi/ and locally

import { $, $$, fetchJSON, getRange, setRange, announceApi, RANGE_LABEL, type MusicRange } from "./state";
import { staggerIn } from "./motionfx";

type Music = {
  unavailable?: boolean;
  range?: string;
  source?: string;
  artists?: { name: string; url: string; streams?: number }[];
  tracks?: { name: string; artist: string; url: string; streams?: number }[];
};
type Status = { uptime_seconds?: number; hostname?: string; unavailable?: boolean };
type GithubRepo = { repo: string; description: string | null; pushed_at: string; url: string };
type Github = { repos?: GithubRepo[]; unavailable?: boolean };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

export function fmtUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const hh = Math.floor((sec % 86400) / 3600);
  return d > 0 ? `${d}d ${hh}h` : `${hh}h ${Math.floor((sec % 3600) / 60)}m`;
}

export function relTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (!isFinite(diff) || diff < 0) return "just now";
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const offline = (msg: string) => `<p class="offline">${msg}</p>`;

// playlists ride along with the all-time view — "most listened" is where
// "the playlists I'm proud of" belongs; other ranges keep the card compact.
function syncPlaylists(): void {
  const pl = $("[data-playlists]");
  if (!pl) return;
  if (getRange() === "long_term") pl.removeAttribute("hidden");
  else pl.setAttribute("hidden", "");
}

async function renderMusic(): Promise<void> {
  const body = $("[data-music-body]");
  if (!body) return;
  const data = await fetchJSON<Music>(`api/music?range=${getRange()}`);
  if (!data || data.unavailable || !data.artists?.length) {
    body.innerHTML = offline("spotify feed offline — honest, at least.");
    return;
  }
  const plays = (n?: number) => (typeof n === "number" && n > 0 ? ` <span class="by">· ${n.toLocaleString("en-US")} plays</span>` : "");
  const artists = data.artists.slice(0, 3).map((a, i) =>
    `<li><span class="idx">${i + 1}</span><a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.name)}</a>${plays(a.streams)}</li>`).join("");
  const tracks = (data.tracks ?? []).slice(0, 3).map((t) =>
    `<li><span class="idx">♪</span><a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.name)}</a> <span class="by">— ${esc(t.artist)}</span>${plays(t.streams)}</li>`).join("");
  body.innerHTML =
    `<div class="lw-title">top artists · ${RANGE_LABEL[getRange()]}</div><ul>${artists}</ul>` +
    (tracks ? `<ul style="margin-top:6px">${tracks}</ul>` : "");
  const foot = $("[data-music-foot]");
  if (foot) {
    foot.innerHTML = data.source === "stats.fm"
      ? `source: <a href="https://stats.fm/joschi_oskar" target="_blank" rel="noopener">stats.fm</a> — full history, real counts. yes, I track everything.`
      : `source: my actual spotify · cached on my server`;
  }
  staggerIn(body);
}

async function renderServer(): Promise<void> {
  const body = $("[data-server-body]");
  if (!body) return;
  const data = await fetchJSON<Status>("api/status");
  if (!data || typeof data.uptime_seconds !== "number") {
    body.innerHTML = offline("api unreachable. the box may be thinking.");
    return;
  }
  body.innerHTML =
    `<div class="big">${fmtUptime(data.uptime_seconds)} <span class="u">uptime</span></div>` +
    `<p class="offline">I reboot more often than this box does.</p>`;
  // feed the boot line its one real number
  const boot = $("[data-boot]");
  if (boot && !$("[data-boot-uptime]", boot)) {
    const d = Math.floor(data.uptime_seconds / 86400);
    const h = Math.floor(data.uptime_seconds / 3600);
    const span = document.createElement("span");
    span.setAttribute("data-boot-uptime", "");
    span.textContent = ` · uptime ${d >= 1 ? `${d}d` : `${h}h`}`;
    boot.appendChild(span);
  }
}

async function renderGithub(): Promise<void> {
  const body = $("[data-github-body]");
  if (!body) return;
  const data = await fetchJSON<Github>("api/github");
  if (!data || data.unavailable || !data.repos?.length) {
    body.innerHTML = offline("github feed offline — commits still happening, probably.");
    return;
  }
  const shortName = (full: string) => full.split("/").pop() ?? full;
  const rows = data.repos.slice(0, 5).map((r) =>
    `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(shortName(r.repo))}</a>` +
    (r.description ? ` <span class="by">— ${esc(r.description)}</span>` : "") +
    ` <span class="by">· ${relTime(r.pushed_at)}</span></li>`).join("");
  body.innerHTML = `<div class="lw-title">recent public work</div><ul>${rows}</ul>`;
  staggerIn(body);
}

export async function pingCoffee(): Promise<string> {
  try {
    const res = await fetch("api/coffee");
    const j = (await res.json()) as { error?: string; hint?: string };
    return `HTTP ${res.status} — ${j.error ?? "no coffee"}. ${j.hint ?? ""}`;
  } catch {
    return "the teapot is unreachable. everything about this is wrong.";
  }
}

export async function fetchUptimeLine(): Promise<string> {
  const data = await fetchJSON<Status>("api/status");
  return data && typeof data.uptime_seconds === "number"
    ? `up ${fmtUptime(data.uptime_seconds)} — served from my own ubuntu box`
    : "api unreachable — uptime unknown. suspicious.";
}

export function initLive(): void {
  // range toggle buttons
  $$("[data-range]").forEach((btn) =>
    btn.addEventListener("click", () => setRange(btn.getAttribute("data-range") as MusicRange)));

  window.addEventListener("joschi:range", () => {
    $$("[data-range]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.getAttribute("data-range") === getRange())));
    syncPlaylists();
    void renderMusic();
  });

  // reflect the initial range (medium_term) → playlists start hidden
  syncPlaylists();

  // lazy: fetch after first paint
  const go = async () => {
    const health = await fetchJSON<{ ok?: boolean }>("api/health", 4000);
    announceApi(Boolean(health?.ok));
    if (!health?.ok) {
      // keep the honest offline defaults that are already in the HTML
      return;
    }
    void renderMusic();
    void renderServer();
    void renderGithub();
  };
  if ("requestIdleCallback" in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => void go());
  } else {
    setTimeout(() => void go(), 350);
  }
}
