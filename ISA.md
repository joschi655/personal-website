---
project: personal-website
task: Control-Room redesign v2 — dark terminal aesthetic, command palette, live widgets API, deploy
effort: E4
phase: execute
progress: 0/142
mode: build
started: 2026-07-10T15:34:02Z
updated: 2026-07-10T15:34:02Z
---

# ISA — personal-website (aiwerke.de/joschi/)

## Problem

The live site (deployed 2026-07-01) is a competent light editorial one-pager but static in every sense: no JavaScript, no live data, no signature interaction. It doesn't demonstrate what its owner actually sells — automation — it only describes it. Content is complete-ish but the page neither stands out nor proves creativity. Additionally: the hero/footer name ("Oskar Breitfeld") contradicts title and linked profiles, there is no Impressum despite the page pitching freelance work, and the repo still carries unused scaffold files (styles.css, script.js) that don't match the shipped inline-styled page.

## Vision

A visitor lands on a dark control room and immediately *feels* "this person automates things": a boot line types itself, a load curve breathes, real data from the owner's own server pulses in (his actual top artists, his machine's uptime, his latest push). Pressing ⌘K reveals the site is operable like a tool. Recruiters remember it; friends play with the Konami code; the owner grins because the site finally behaves the way he works. Euphoric surprise: "the site IS the portfolio piece."

## Out of Scope

The Ask-my-AI chatbot (owner decision 2026-07-10: "noch nicht — brauche mehr Zeit") — the palette leaves a free-text slot for it in v2. No WebGL/Three.js scene. No DE/EN language toggle. No CV PDF download. No guestbook. No analytics/tracking. No og:image/photo until the owner supplies one. No changes to cloudflared. No mention of private projects (trading bot, client internals beyond what v1 already published).

## Principles

- Real data or no data: every "live" element shows genuinely live values or a clearly-degraded offline state — never fake numbers.
- One strong signature interaction beats many effects (2025/26 research finding); everything else supports it.
- The interactive layer is enhancement: 100% of content reachable by plain scrolling with JS disabled.
- Motion is opt-out by default: `prefers-reduced-motion` yields a fully static, complete page.
- Every factual claim on the page is traceable to the previous site or a session-verified source.

## Constraints

- Static HTML/CSS + vanilla TypeScript bundled with `bun build` — no frameworks, no npm.
- Public repo: secrets (Spotify client secret, refresh token) exist only in gitignored `api/.env` locally and `/etc/joschi-api.env` (chmod 600) on the server; never in tracked files, output, or logs.
- API binds 127.0.0.1 only; exposed exclusively through nginx `location /joschi/api/`.
- Server changes are surgical: default vHost gets one location block (a new `server_name aiwerke.de` block would hijack existing traffic); cloudflared untouched; `nginx -t` + diff before every reload.
- All asset/API URLs relative, so the page works at `/joschi/` in prod and `/` locally.
- Site stays reachable throughout deploy (rsync into place, verify immediately).

## Goal

Ship the redesigned dark control-room one-pager to https://aiwerke.de/joschi/ with a keyboard-driven command palette, three live widgets fed by a hardened `joschi-api` Bun service on the owner's server (Spotify top artists/tracks with time-range switch, server uptime, GitHub activity), scroll-driven timeline, Lab-Mode easter eggs, and an Impressum — verified live in a real browser with zero console errors and zero fabricated content.

## Criteria

### A — Repo & build hygiene
- [ ] ISC-1: `bun build src/main.ts` produces `dist/app.js`, exit 0
- [ ] ISC-2: `dist/app.js` is a minified ES module < 30 KB
- [ ] ISC-3: `.gitignore` contains `api/.env`
- [ ] ISC-4: grep of tracked files for the Spotify client secret value → 0 hits
- [ ] ISC-5: grep of tracked files for any refresh-token value → 0 hits
- [ ] ISC-6: Anti: no `node_modules/` in git tree
- [ ] ISC-7: README.md accurately documents build, deploy, and API endpoints
- [ ] ISC-8: deployment-notes.md names the real webroot `/var/www/html/joschi/`
- [ ] ISC-9: nginx-snippet.conf contains the `/joschi/api/` location template
- [ ] ISC-10: `api/.env.example` lists every env var with placeholder values only

### B — Design system (control room)
- [ ] ISC-11: `<html data-theme="dark">` is the default
- [ ] ISC-12: Dark near-black background with subtle grid texture (CSS vars)
- [ ] ISC-13: Single accent color as `--signal`, used consistently
- [ ] ISC-14: Bricolage Grotesque (display) + IBM Plex Mono (labels) load with fallback stacks
- [ ] ISC-15: Antecedent: first viewport shows terminal cues (prompt bar, ⌘K hint, status dot) that read as "control room"
- [ ] ISC-16: Light theme via `[data-theme="light"]` reusing the v1 paper palette
- [ ] ISC-17: Theme choice persists in localStorage
- [ ] ISC-18: Antecedent: ≥2 animated/live elements visible in first viewport (boot line, curve)
- [ ] ISC-19: Text contrast ≥ 4.5:1 on dark bg (4 spot-checked pairs)
- [ ] ISC-20: Hero shows name "Joschi Breitfeld" (flagged: owner may override to keep "Oskar")
- [ ] ISC-21: `<title>` + meta description present and updated
- [ ] ISC-22: og:title / og:description / og:url correct
- [ ] ISC-23: Favicon present (terminal-style glyph)
- [ ] ISC-24: Anti: no horizontal scroll at 360 / 768 / 1440 px

### C — Hero & boot line
- [ ] ISC-25: Boot line types `boot: energy ✓ ml ✓ automation ✓` in ≤ 1.5 s
- [ ] ISC-26: Boot line is inline — page content visible immediately (no splash/overlay)
- [ ] ISC-27: `prefers-reduced-motion` renders boot line static instantly
- [ ] ISC-28: Hero lede ≤ 60 words
- [ ] ISC-29: Status strip shows 3 real facts (Current / Work / Default state)
- [ ] ISC-30: Hero intact at 360 px viewport
- [ ] ISC-31: Anti: no autoplaying audio anywhere

### D — Load-curve canvas
- [ ] ISC-32: Canvas draws past (solid) + forecast (dashed) curve on load
- [ ] ISC-33: Curve idles with subtle live wander (rAF)
- [ ] ISC-34: rAF loop pauses when `document.hidden`
- [ ] ISC-35: Cursor proximity perturbs the curve on desktop
- [ ] ISC-36: reduced-motion → static curve, no rAF loop
- [ ] ISC-37: Canvas has `role="img"` + aria-label
- [ ] ISC-38: Curve renders on mobile width without overflow

### E — Command palette (signature element)
- [ ] ISC-39: ⌘K and Ctrl+K open the palette
- [ ] ISC-40: `/` opens palette when focus is not in an input
- [ ] ISC-41: Esc closes the palette
- [ ] ISC-42: Arrow keys navigate, Enter executes
- [ ] ISC-43: Mobile floating button opens the palette
- [ ] ISC-44: Fuzzy (subsequence) matching filters commands
- [ ] ISC-45: Section-jump commands (path / build / off-screen / hello) work
- [ ] ISC-46: `theme` command toggles dark/light
- [ ] ISC-47: `music` command cycles the Spotify time range
- [ ] ISC-48: `lab` command toggles Lab Mode
- [ ] ISC-49: `help` lists all commands
- [ ] ISC-50: Social commands open GitHub / LinkedIn / Email
- [ ] ISC-51: `sudo hire joschi` triggers playful response + mailto
- [ ] ISC-52: Unknown free text → witty "not a command — Ask-my-AI coming in v2" hint
- [ ] ISC-53: Palette DOM built lazily on first open
- [ ] ISC-54: Backdrop click closes palette
- [ ] ISC-55: Focus trapped while open; returns to trigger on close
- [ ] ISC-56: Anti: no content is reachable *only* through the palette

### F — Live widgets (frontend)
- [ ] ISC-57: Live strip renders music / server / GitHub cards
- [ ] ISC-58: Music card shows top 3 artists + top 3 tracks from `/api/music`
- [ ] ISC-59: Time-range toggle (4 weeks / 6 months / all-time) switches data
- [ ] ISC-60: Server card shows real uptime + "served from my own Ubuntu box"
- [ ] ISC-61: GitHub card shows latest public push (repo + relative time)
- [ ] ISC-62: Widgets fetch relative `api/…` URLs (work under `/joschi/` and locally)
- [ ] ISC-63: API unreachable → graceful offline state, zero console errors
- [ ] ISC-64: Widget fetches are lazy (post-first-paint)
- [ ] ISC-65: Anti: no placeholder data ever displayed as if real
- [ ] ISC-66: Anti: no third-party tracker/analytics scripts

### G — Path timeline
- [ ] ISC-67: 4 steps (ChemEng → TUM E&P → SAP AI → load-forecasting thesis) with labels
- [ ] ISC-68: Steps activate on scroll into view
- [ ] ISC-69: Thin scroll-progress meter tied to page scroll
- [ ] ISC-70: IntersectionObserver fallback covers browsers without scroll-timeline
- [ ] ISC-71: Each step ≤ 30 words
- [ ] ISC-72: reduced-motion → all steps statically active

### H — Projects
- [ ] ISC-73: v1 cards retained: Spotify queue bot, energy-law AI, pyrolysis ML, client AI tools, Blender game
- [ ] ISC-74: New card: Cloud-Instance-Optimizer, accurate description
- [ ] ISC-75: New card: check24-MCP + CHECK24 GenDev scholarship (winner), accurate
- [ ] ISC-76: Claude Campus Ambassador (Anthropic) present, accurate
- [ ] ISC-77: Every claim traceable to v1 site or session-verified source (audit list in Verification)
- [ ] ISC-78: Anti: "trading" / ML-Trading absent from the whole site (grep → 0)
- [ ] ISC-79: Anti: no SAP internals beyond v1's public phrasing
- [ ] ISC-80: Anti: no invented metrics or savings numbers
- [ ] ISC-81: "annoyance → built" card pattern kept
- [ ] ISC-82: Card hover micro-interaction present
- [ ] ISC-83: Cards grid responsive (2-col → 1-col)
- [ ] ISC-84: Blender card keeps the recycling-center childhood story

### I — Off-screen & story
- [ ] ISC-85: KooKoo clocks card kept
- [ ] ISC-86: Music/piano card kept
- [ ] ISC-87: Travel/ski/padel card kept
- [ ] ISC-88: Languages line present (German, English, Spanish + learning more)
- [ ] ISC-89: Total visible body text ≤ ~600 words

### J — Footer, contact, legal
- [ ] ISC-90: GitHub / LinkedIn / Email links correct and unchanged
- [ ] ISC-91: Impressum link in footer
- [ ] ISC-92: impressum.html exists (name + email; address slot clearly marked for owner)
- [ ] ISC-93: Datenschutz section: server logs, no cookies/tracking, Spotify data is owner's own
- [ ] ISC-94: impressum.html styled consistently
- [ ] ISC-95: Anti: no home address published without explicit owner approval
- [ ] ISC-96: mailto link functional

### K — Easter eggs / Lab Mode
- [ ] ISC-97: Konami code toggles Lab Mode
- [ ] ISC-98: Lab Mode reveals hidden section (Blender level, Spotify bot, fixie project)
- [ ] ISC-99: Lab Mode entry effect (CRT flash) respects reduced-motion
- [ ] ISC-100: `sudo hire joschi` playful output verified
- [ ] ISC-101: Styled console.log greeting for dev-tools visitors
- [ ] ISC-102: Lab Mode also toggleable via palette
- [ ] ISC-103: Anti: easter eggs never gate real content

### L — API backend (joschi-api)
- [ ] ISC-104: GET /health → 200 `{ok:true, version}`
- [ ] ISC-105: GET /music → cached top artists+tracks for all 3 time ranges
- [ ] ISC-106: /music cache TTL 6 h (second call within TTL skips Spotify)
- [ ] ISC-107: GET /status → uptime seconds from /proc/uptime (dev fallback local)
- [ ] ISC-108: GET /github → latest public event for joschi655, cached 10 min
- [ ] ISC-109: Non-GET methods → 405
- [ ] ISC-110: Unknown path → 404 JSON
- [ ] ISC-111: Per-IP rate limit → 429 beyond threshold
- [ ] ISC-112: Responses carry restrictive CORS/security headers
- [ ] ISC-113: Server binds 127.0.0.1:31890 only
- [ ] ISC-114: Secrets read from env only; never in any response or log line
- [ ] ISC-115: Expired Spotify access token auto-renews via refresh token
- [ ] ISC-116: Spotify failure → last cached data or `{unavailable:true}` with 200
- [ ] ISC-117: systemd unit: Restart=always, EnvironmentFile, runs as ubuntu
- [ ] ISC-118: Anti: no user input is ever forwarded to external APIs

### M — Spotify one-time auth
- [ ] ISC-119: spotify-auth.ts serves loopback callback on 127.0.0.1:8888
- [ ] ISC-120: Prints authorize URL with scope `user-top-read`
- [ ] ISC-121: Exchanges code and writes refresh token directly into `api/.env` (masked on stdout)
- [ ] ISC-122: Refresh token present in local `api/.env` AND server `/etc/joschi-api.env` (600)
- [ ] ISC-123: Anti: client secret never printed by any script

### N — Deploy
- [ ] ISC-124: Static files rsynced to `/var/www/html/joschi/`
- [ ] ISC-125: api/ deployed to `/opt/joschi-api/`
- [ ] ISC-126: `/etc/joschi-api.env` exists, chmod 600
- [ ] ISC-127: systemd `joschi-api` enabled + active
- [ ] ISC-128: nginx default vHost has `location /joschi/api/` → 127.0.0.1:31890
- [ ] ISC-129: `nginx -t` passed and diff shown before reload
- [ ] ISC-130: cloudflared config untouched (mtime unchanged)
- [ ] ISC-131: Live page returns 200 with new content marker
- [ ] ISC-132: `https://aiwerke.de/joschi/api/health` → 200 through Cloudflare
- [ ] ISC-133: `/joschi/api/music` returns real top artists live
- [ ] ISC-134: Rollback path documented (stop service + rsync of git tag v1)

### O — Live quality gates
- [ ] ISC-135: Interceptor desktop screenshot: layout as designed
- [ ] ISC-136: Interceptor mobile-viewport screenshot: layout intact
- [ ] ISC-137: Zero browser console errors on live page
- [ ] ISC-138: Zero 404s in network log on live page
- [ ] ISC-139: Palette keyboard flow verified in a real browser
- [ ] ISC-140: Page weight < 500 KB (excl. fonts), JS < 40 KB
- [ ] ISC-141: v1 preserved as git tag `v1` before rewrite
- [ ] ISC-142: Anti: live site unreachable for no longer than the rsync window during deploy

## Test Strategy

| isc | type | check | threshold | tool |
|---|---|---|---|---|
| 1–2, 6 | build | bundle produced, size, tree clean | exit 0, <30 KB | Bash (bun build, wc -c, git ls-files) |
| 3–5, 10, 123 | security | secret grep over tracked files | 0 hits | Bash (git grep) |
| 7–9, 134 | docs | files state real paths/steps | manual read | Read |
| 11–24 | visual/code | theme vars, fonts, contrast, responsive | screenshots + grep | Interceptor + Grep |
| 25–38 | behavior | boot/curve animation + reduced-motion | visual + code path | Interceptor + Read |
| 39–56 | interaction | palette keyboard/mobile flows | each action works | Interceptor (act/inspect) |
| 57–66 | integration | widgets against local API, offline state | real data renders | Interceptor + curl |
| 67–72 | behavior | scroll activation, fallback | visual | Interceptor |
| 73–89 | content | claims vs audit list, word counts | 100% traceable, ≤600 words | Read + Bash (wc -w) |
| 90–96 | content/legal | links, Impressum present | manual read + click | Interceptor + Read |
| 97–103 | interaction | eggs trigger, no gating | each fires | Interceptor |
| 104–118 | api | endpoint contracts, limits, binding | status codes + ss -tln | curl + Bash |
| 119–123 | ops | auth flow produces token | .env populated | Bash (masked read-back) |
| 124–133 | deploy | server state + live probes | 200s, active unit | ssh + curl + Interceptor |
| 135–142 | quality | screenshots, console, network, weight | 0 errors, <500 KB | Interceptor + curl |

## Features

| name | description | satisfies | depends_on | parallelizable |
|---|---|---|---|---|
| design-system | styles.css tokens, dark+light themes, grid texture | B | — | no |
| content-structure | index.html rewrite, all sections, copy pass | B,C,G,H,I,J | design-system | no |
| curve-canvas | src/curve.ts animated load curve | D | design-system | yes |
| palette | src/palette.ts + commands + eggs | E,K | content-structure | yes |
| live-widgets | src/live.ts fetch + render + degrade | F | content-structure | yes |
| api-backend | api/server.ts Bun service | L | — | yes (Forge) |
| spotify-auth | api/spotify-auth.ts one-time OAuth | M | — | yes (Forge) |
| impressum | impressum.html + Datenschutz | J | design-system | yes |
| build-hygiene | bunfig/build script, .gitignore, docs update | A | — | yes |
| deploy-live | server rollout + live verification | N,O | all | no |

## Decisions

- 2026-07-10 · Plan approved by owner after one revision: chatbot cut from v1 ("brauche mehr Zeit") → palette keeps a free-text slot; Spotify widget switched from now-playing to top artists/tracks with time-range choice (owner's explicit spec).
- 2026-07-10 · Defaults set while owner AFK, veto-able: Design A (control room), name "Joschi Breitfeld" (live site says "Oskar" — flagged), English.
- 2026-07-10 · Deploy target verified by ssh, not assumed: live files at `/var/www/html/joschi/` under the *default* nginx vHost; no joschi entry in sites-enabled. API location must go into the default vHost — a new `server_name aiwerke.de` block would capture traffic away from it.
- 2026-07-10 · Delegation split: frontend built by primary (design-critical, voice-critical), api/ + auth script delegated to Forge (self-contained, spec-able). Cato audits at VERIFY. Floor E4 ≥2 met.
- 2026-07-10 · Secrets policy: owner pasted Spotify creds in chat; values flow directly into gitignored env files and are never repeated in output, plan files, or this ISA (public repo).
- 2026-07-10 · Custom cursor rejected (research: high gimmick risk); hover micro-interactions instead. Splash screen rejected; boot line is inline and non-blocking.

## Changelog

- (populated at LEARN)

## Verification

- (populated at VERIFY)
