// ⌘K command palette — the signature element.
// everything here is also reachable by plain scrolling; the palette is the fun way.

import {
  toggleTheme, toggleLab, labOn, cycleRange, RANGE_LABEL, isApiUp, currentTheme, motionOK,
} from "./state";
import { pingCoffee, fetchUptimeLine } from "./live";

type Ctx = { print: (text: string, cls?: string) => void; close: () => void };
type Cmd = { name: string; aliases?: string[]; desc: string; keep?: boolean; run: (ctx: Ctx) => void | Promise<void> };

const jump = (id: string, ctx: Ctx) => {
  document.getElementById(id)?.scrollIntoView({ behavior: motionOK() ? "smooth" : "auto" });
  ctx.close();
};

const open_ = (url: string) => window.open(url, "_blank", "noopener");

const AGE = new Date().getFullYear() - 2000;

const COMMANDS: Cmd[] = [
  { name: "help", aliases: ["?"], desc: "list every command", keep: true,
    run: (c) => c.print(COMMANDS.map((x) => `${x.name.padEnd(18)} ${x.desc}`).join("\n") +
      "\n\neverything above also works by just… scrolling.") },
  { name: "ls", desc: "list sections", keep: true,
    run: (c) => c.print("path/  projects/  offscreen/  contact/" + (labOn() ? "  lab/" : "  (+1 hidden)")) },
  { name: "cd path", aliases: ["path", "goto path"], desc: "jump to the path timeline", run: (c) => jump("path", c) },
  { name: "cd projects", aliases: ["projects", "goto projects", "cd build"], desc: "jump to what I build", run: (c) => jump("projects", c) },
  { name: "cd offscreen", aliases: ["offscreen", "goto offscreen"], desc: "jump to off-screen", run: (c) => jump("offscreen", c) },
  { name: "cd contact", aliases: ["contact", "say hello", "goto contact"], desc: "jump to say hello", run: (c) => jump("contact", c) },
  { name: "cd ~", aliases: ["home", "cd", "top"], desc: "back to the top", run: (c) => jump("top", c) },
  { name: "theme", aliases: ["light", "dark", "paper"], desc: "toggle dark / paper mode", keep: true,
    run: (c) => c.print(toggleTheme() === "light"
      ? "switched to paper mode. easy on the eyes, hard on the vibe."
      : "welcome back to the control room.", "out-ok") },
  { name: "music", aliases: ["range"], desc: "cycle the spotify time range", keep: true,
    run: (c) => c.print(`range → ${RANGE_LABEL[cycleRange()]}. the widget is re-judging me now.`) },
  { name: "lab", aliases: ["lab mode"], desc: "toggle lab mode (experiments)", keep: true,
    run: (c) => c.print(toggleLab()
      ? "lab mode ON — things in here may be held together with tape."
      : "lab mode OFF — experiments safely stowed.", "out-warn") },
  { name: "uptime", desc: "real uptime of the box serving this page", keep: true,
    run: async (c) => c.print(await fetchUptimeLine(), "out-ok") },
  { name: "status", desc: "system status report", keep: true,
    run: (c) => c.print([
      `theme:    ${currentTheme()}`,
      `lab:      ${labOn() ? "ON" : "off"}`,
      `api:      ${isApiUp() ? "up (real data)" : "unreachable (honest offline mode)"}`,
      `motion:   ${motionOK() ? "allowed" : "reduced — everything stays still"}`,
      `tracking: none. I don't even know you're here.`,
    ].join("\n")) },
  { name: "coffee", aliases: ["make coffee"], desc: "ask the server for coffee", keep: true,
    run: async (c) => c.print(await pingCoffee(), "out-warn") },
  { name: "github", desc: "open github/joschi655", keep: true,
    run: (c) => { open_("https://github.com/joschi655"); c.print("opening github — where the commit messages apologize."); } },
  { name: "linkedin", desc: "open linkedin", keep: true,
    run: (c) => { open_("https://www.linkedin.com/in/johannes-breitfeld/"); c.print("opening linkedin. tie optional."); } },
  { name: "email", aliases: ["mail"], desc: "write me", keep: true,
    run: (c) => { window.location.href = "mailto:jo.breitfeld@gmail.com"; c.print("drafting mail — bring an annoying problem."); } },
  { name: "whoami", desc: "who is this guy", keep: true,
    run: (c) => c.print("joschi — builds fixes for whatever annoys him.\ncurrently annoyed by: manual work.") },
  { name: "neofetch", desc: "system profile", keep: true,
    run: (c) => c.print([
      "joschi@aiwerke",
      "──────────────",
      `OS:        human 1.0 (munich build, 2000) — uptime ${AGE}y`,
      "Host:      TUM · M.Sc. energy & process engineering",
      "Shell:     bash + bun",
      "Packages:  energy, ml, automation, n8n, mcp",
      "Editor:    whatever ships fastest",
      `Theme:     ${currentTheme() === "dark" ? "control room" : "paper"}`,
    ].join("\n")) },
  { name: "history", desc: "how I got here", keep: true,
    run: (c) => c.print([
      "START  chemical engineering",
      "NOW    TUM — energy & process engineering",
      "WORK   SAP — ai automation",
      "NEXT   power grid load forecasting (thesis)",
    ].join("\n")) },
  { name: "forecast", desc: "tomorrow's personal load forecast", keep: true,
    run: (c) => c.print("tomorrow: 60% chance of a new side project.\nconfidence interval: none.") },
  { name: "grid", desc: "grid frequency check", keep: true,
    run: (c) => c.print("frequency nominal at 50.00 Hz. europe may continue.", "out-ok") },
  { name: "ping joschi", aliases: ["ping"], desc: "reachability check", keep: true,
    run: (c) => c.print("pong from munich · latency depends on coffee.") },
  { name: "piano", desc: "switch output device", keep: true,
    run: (c) => c.print("switching output device → 🎹\nthe one interface I play without shortcuts.") },
  { name: "kookoo", desc: "the clock story", keep: true,
    run: (c) => c.print("before AI there were clocks. real ones, with birds inside.\ntry `cd offscreen` for the full story.") },
  { name: "vim", desc: "open an editor (bad idea)", keep: true,
    run: (c) => c.print("you're now inside vim. there is no exit.\n(kidding — Esc works here. that's the whole product advantage.)", "out-warn") },
  { name: "rm -rf bugs", aliases: ["rm bugs"], desc: "remove all bugs", keep: true,
    run: (c) => c.print("removing bugs… done.\n3 new bugs were spawned by the removal script. classic.") },
  { name: "make sandwich", aliases: ["sandwich"], desc: "xkcd 149 compliance check", keep: true,
    run: (c) => c.print("make: *** no rule to make target 'sandwich'.\ndid you mean `sudo hire joschi`?") },
  { name: "sudo hire joschi", aliases: ["hire", "sudo hire"], desc: "escalate privileges properly", keep: true,
    run: (c) => {
      c.print("permission granted.\nopening a channel — bring the most annoying process you own.", "out-ok");
      if (motionOK()) {
        document.body.classList.add("crt-flash");
        setTimeout(() => document.body.classList.remove("crt-flash"), 500);
      }
      setTimeout(() => { window.location.href = "mailto:jo.breitfeld@gmail.com?subject=sudo%20hire%20joschi"; }, 900);
    } },
  { name: "konami", desc: "a hint", keep: true,
    run: (c) => c.print("↑ ↑ ↓ ↓ ← → ← → B A — or just type `lab`.\nshortcuts are the point.") },
  { name: "exit", aliases: ["quit", ":q", ":q!"], desc: "close the palette", run: (c) => { c.print("logout."); c.close(); } },
];

// subsequence fuzzy match: "cdp" hits "cd projects"
function fuzzy(needle: string, hay: string): boolean {
  const n = needle.toLowerCase().replace(/\s+/g, "");
  const h = hay.toLowerCase();
  let i = 0;
  for (const ch of h) if (ch === n[i]) i++;
  return i >= n.length;
}

function matches(q: string): Cmd[] {
  const n = q.trim().toLowerCase();
  if (!n) return COMMANDS;
  // rank: exact name/alias > prefix > subsequence — so `coffee` never runs `cd offscreen`
  const score = (c: Cmd): number => {
    const names = [c.name, ...(c.aliases ?? [])].map((s) => s.toLowerCase());
    if (names.includes(n)) return 0;
    if (names.some((s) => s.startsWith(n))) return 1;
    if (names.some((s) => fuzzy(n, s))) return 2;
    return 3;
  };
  return COMMANDS.map((c) => [score(c), c] as const)
    .filter(([s]) => s < 3)
    .sort((a, b) => a[0] - b[0])
    .map(([, c]) => c);
}

// ---- dialog (DOM built lazily on first open) ----
let root: HTMLDivElement | null = null;
let input: HTMLInputElement;
let list: HTMLUListElement;
let out: HTMLDivElement;
let sel = 0;
let lastTrigger: HTMLElement | null = null;

function build(): void {
  root = document.createElement("div");
  root.className = "pal-backdrop";
  root.innerHTML =
    `<div class="pal" role="dialog" aria-modal="true" aria-label="Command palette">` +
    `<div class="pal-inputrow"><span class="ps1" aria-hidden="true">joschi@aiwerke:~$</span>` +
    `<input type="text" placeholder="type a command — or free text (v2 will answer)" ` +
    `aria-label="Command input" autocapitalize="off" autocomplete="off" spellcheck="false"></div>` +
    `<div class="pal-out" role="log" aria-live="polite"></div>` +
    `<ul class="pal-list" role="listbox" aria-label="Commands"></ul>` +
    `<div class="pal-foot"><span>↑↓ navigate</span><span>↵ run</span><span>esc close</span><span>tip: try \`neofetch\`</span></div>` +
    `</div>`;
  document.body.appendChild(root);

  input = root.querySelector("input")!;
  list = root.querySelector(".pal-list")!;
  out = root.querySelector(".pal-out")!;

  root.addEventListener("mousedown", (e) => { if (e.target === root) close(); });
  input.addEventListener("input", () => { sel = 0; renderList(); });
  input.addEventListener("keydown", (e) => {
    const items = matches(input.value);
    if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) { e.preventDefault(); sel = Math.min(sel + 1, items.length - 1); renderList(); }
    else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) { e.preventDefault(); sel = Math.max(sel - 1, 0); renderList(); }
    else if (e.key === "Enter") { e.preventDefault(); execute(items[sel] ?? null, input.value); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
  });
}

function renderList(): void {
  const items = matches(input.value);
  sel = Math.min(sel, Math.max(0, items.length - 1));
  list.innerHTML = items.map((c, i) =>
    `<li role="option" aria-selected="${i === sel}" data-i="${i}">` +
    `<span class="c">${c.name}</span><span class="d">${c.desc}</span></li>`).join("") ||
    `<li role="option" aria-selected="false"><span class="d">no matching command — hit ↵ anyway</span></li>`;
  list.querySelectorAll("li[data-i]").forEach((li) =>
    li.addEventListener("click", () => execute(items[Number(li.getAttribute("data-i"))], input.value)));
  list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
}

function print(text: string, cls = ""): void {
  const line = document.createElement("div");
  if (cls) line.className = cls;
  line.textContent = text;
  out.appendChild(line);
  out.scrollTop = out.scrollHeight;
}

function execute(cmd: Cmd | null, raw: string): void {
  const echo = document.createElement("div");
  echo.innerHTML = `<span class="out-cmd">$ ${raw.trim() || (cmd?.name ?? "")}</span>`;
  out.appendChild(echo);
  if (cmd) {
    void cmd.run({ print, close });
  } else {
    print(`command not found: ${raw.trim()}\nAsk-my-AI arrives in v2 — until then I'm just a website.`, "out-warn");
  }
  input.value = "";
  sel = 0;
  renderList();
}

export function openPalette(trigger?: HTMLElement): void {
  if (!root) build();
  lastTrigger = trigger ?? (document.activeElement as HTMLElement | null);
  root!.style.display = "flex";
  renderList();
  input.focus();
}

function close(): void {
  if (root) root.style.display = "none";
  lastTrigger?.focus?.();
}

export function initPalette(): void {
  document.querySelectorAll<HTMLElement>("[data-open-palette]").forEach((el) =>
    el.addEventListener("click", () => openPalette(el)));

  document.addEventListener("keydown", (e) => {
    const t = e.target as HTMLElement;
    const typing = t?.tagName === "INPUT" || t?.tagName === "TEXTAREA" || t?.isContentEditable;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      root?.style.display === "flex" ? close() : openPalette();
    } else if (e.key === "/" && !typing) {
      e.preventDefault();
      openPalette();
    }
  });
}
