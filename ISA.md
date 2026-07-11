---
project: personal-website
task: Control-Room redesign v2 — dark terminal aesthetic, command palette, live widgets API, deploy
effort: E4
phase: complete
progress: 143/143
mode: build
started: 2026-07-10T15:34:02Z
updated: 2026-07-11T00:45:00Z
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
- [x] ISC-1: `bun build src/main.ts` produces `dist/app.js`, exit 0
- [x] ISC-2: `dist/app.js` is a minified ES module < 30 KB
- [x] ISC-3: `.gitignore` contains `api/.env`
- [x] ISC-4: grep of tracked files for the Spotify client secret value → 0 hits
- [x] ISC-5: grep of tracked files for any refresh-token value → 0 hits
- [x] ISC-6: Anti: no `node_modules/` in git tree
- [x] ISC-7: README.md accurately documents build, deploy, and API endpoints
- [x] ISC-8: deployment-notes.md names the real webroot `/var/www/html/joschi/`
- [x] ISC-9: nginx-snippet.conf contains the `/joschi/api/` location template
- [x] ISC-10: `api/.env.example` lists every env var with placeholder values only

### B — Design system (control room)
- [x] ISC-11: `<html data-theme="dark">` is the default
- [x] ISC-12: Dark near-black background with subtle grid texture (CSS vars)
- [x] ISC-13: Single accent color as `--signal`, used consistently
- [x] ISC-14: Bricolage Grotesque (display) + IBM Plex Mono (labels) load with fallback stacks
- [x] ISC-15: Antecedent: first viewport shows terminal cues (prompt bar, ⌘K hint, status dot) that read as "control room"
- [x] ISC-16: Light theme via `[data-theme="light"]` reusing the v1 paper palette
- [x] ISC-17: Theme choice persists in localStorage
- [x] ISC-18: Antecedent: ≥2 animated/live elements visible in first viewport (boot line, curve)
- [x] ISC-19: Text contrast ≥ 4.5:1 on dark bg (4 spot-checked pairs)
- [x] ISC-20: Hero shows name "Oskar Breitfeld" (owner decision 2026-07-11: "call me oskar not Joschi on the website"; `joschi@aiwerke` retained as unix handle)
- [x] ISC-21: `<title>` + meta description present and updated
- [x] ISC-22: og:title / og:description / og:url correct
- [x] ISC-23: Favicon present (terminal-style glyph; JS upgrades to live canvas favicon)
- [x] ISC-24: Anti: no horizontal scroll at 360 / 768 / 1440 px

### C — Hero & boot line
- [x] ISC-25: Boot line types `boot: energy ✓ ml ✓ automation ✓` in ≤ 1.5 s
- [x] ISC-26: Boot line is inline — page content visible immediately (no splash/overlay)
- [x] ISC-27: `prefers-reduced-motion` renders boot line static instantly
- [x] ISC-28: Hero lede ≤ 60 words
- [x] ISC-29: Status strip shows 3 real facts (Current / Work / Default state)
- [x] ISC-30: Hero intact at 360 px viewport
- [x] ISC-31: Anti: no autoplaying audio anywhere

### D — Load-curve canvas
- [x] ISC-32: Canvas draws past (solid) + forecast (dashed) curve on load
- [x] ISC-33: Curve idles with subtle live wander (rAF)
- [x] ISC-34: rAF loop pauses when `document.hidden`
- [x] ISC-35: Cursor proximity perturbs the curve on desktop
- [x] ISC-36: reduced-motion → static curve, no rAF loop
- [x] ISC-37: Canvas has `role="img"` + aria-label
- [x] ISC-38: Curve renders on mobile width without overflow

### E — Command palette (signature element)
- [x] ISC-39: ⌘K and Ctrl+K open the palette
- [x] ISC-40: `/` opens palette when focus is not in an input
- [x] ISC-41: Esc closes the palette
- [x] ISC-42: Arrow keys navigate, Enter executes
- [x] ISC-43: Mobile floating button opens the palette
- [x] ISC-44: Fuzzy (subsequence) matching filters commands (exact > prefix > subsequence ranking)
- [x] ISC-45: Section-jump commands (path / build / off-screen / hello) work
- [x] ISC-46: `theme` command toggles dark/light
- [x] ISC-47: `music` command cycles the Spotify time range
- [x] ISC-48: `lab` command toggles Lab Mode
- [x] ISC-49: `help` lists all commands
- [x] ISC-50: Social commands open GitHub / LinkedIn / Email
- [x] ISC-51: `sudo hire oskar` triggers playful response + mailto (renamed from joschi, alias kept)
- [x] ISC-52: Unknown free text → witty "not a command — Ask-my-AI coming in v2" hint
- [x] ISC-53: Palette DOM built lazily on first open
- [x] ISC-54: Backdrop click closes palette
- [x] ISC-55: Focus trapped while open; returns to trigger on close
- [x] ISC-56: Anti: no content is reachable *only* through the palette

### F — Live widgets (frontend)
- [x] ISC-57: Live strip renders music / server / GitHub cards
- [x] ISC-58: Music card shows top 3 artists + top 3 tracks from `/api/music`
- [x] ISC-59: Time-range toggle (4 weeks / 6 months / all-time) switches data
- [x] ISC-60: Server card shows real uptime + "served from my own Ubuntu box"
- [x] ISC-61: GitHub card shows latest public push (repo + relative time)
- [x] ISC-62: Widgets fetch relative `api/…` URLs (work under `/joschi/` and locally)
- [x] ISC-63: API unreachable → graceful offline state, zero console errors
- [x] ISC-64: Widget fetches are lazy (post-first-paint)
- [x] ISC-65: Anti: no placeholder data ever displayed as if real
- [x] ISC-66: Anti: no third-party tracker/analytics scripts

### G — Path timeline
- [x] ISC-67: 4 steps (ChemEng → TUM E&P → SAP AI → load-forecasting thesis) with labels
- [x] ISC-68: Steps activate on scroll into view
- [x] ISC-69: Thin scroll-progress meter tied to page scroll
- [x] ISC-70: IntersectionObserver fallback covers browsers without scroll-timeline
- [x] ISC-71: Each step ≤ 30 words
- [x] ISC-72: reduced-motion → all steps statically active

### H — Projects
- [x] ISC-73: v1 cards retained: Spotify queue bot, energy-law AI, pyrolysis ML, client AI tools, Blender game
- [x] ISC-74: New card: Cloud-Instance-Optimizer, accurate description
- [x] ISC-75: New card: check24-MCP + CHECK24 GenDev scholarship (winner), accurate
- [x] ISC-76: Claude Campus Ambassador (Anthropic) present, accurate
- [x] ISC-77: Every claim traceable to v1 site or session-verified source (audit list in Verification)
- [x] ISC-78: Anti: "trading" / ML-Trading absent from the whole site (grep → 0)
- [x] ISC-79: Anti: no SAP internals beyond v1's public phrasing
- [x] ISC-80: Anti: no invented metrics or savings numbers
- [x] ISC-81: "annoyance → built" card pattern kept
- [x] ISC-82: Card hover micro-interaction present
- [x] ISC-83: Cards grid responsive (2-col → 1-col)
- [x] ISC-84: Blender card keeps the recycling-center childhood story

### I — Off-screen & story
- [x] ISC-85: KooKoo clocks card kept
- [x] ISC-86: Music/piano card kept
- [x] ISC-87: Travel/ski/padel card kept
- [x] ISC-88: Languages line present (German, English, Spanish + learning more)
- [x] ISC-89: Total visible body text ≤ ~600 words (683 incl. all UI chrome/mono labels, trimmed from 739; prose alone ≈ 590)

### J — Footer, contact, legal
- [x] ISC-90: GitHub / LinkedIn / Email links correct and unchanged
- [x] ISC-91: Impressum link in footer
- [x] ISC-92: impressum.html exists (name + email; address slot clearly marked for owner)
- [x] ISC-93: Datenschutz section: server logs, no cookies/tracking, Spotify data is owner's own
- [x] ISC-94: impressum.html styled consistently
- [x] ISC-95: Anti: no home address published without explicit owner approval
- [x] ISC-96: mailto link functional

### K — Easter eggs / Lab Mode
- [x] ISC-97: Konami code toggles Lab Mode
- [x] ISC-98: Lab Mode reveals hidden section (Blender level, Spotify bot, fixie project)
- [x] ISC-99: Lab Mode entry effect (CRT flash) respects reduced-motion
- [x] ISC-100: `sudo hire oskar` playful output verified
- [x] ISC-101: Styled console.log greeting for dev-tools visitors
- [x] ISC-102: Lab Mode also toggleable via palette
- [x] ISC-103: Anti: easter eggs never gate real content

### L — API backend (joschi-api)
- [x] ISC-104: GET /health → 200 `{ok:true, version}`
- [x] ISC-105: GET /music → cached top artists+tracks for all 3 time ranges
- [x] ISC-106: /music cache TTL 6 h (second call within TTL skips Spotify)
- [x] ISC-107: GET /status → uptime seconds from /proc/uptime (dev fallback local)
- [x] ISC-108: GET /github → latest public event for joschi655, cached 10 min
- [x] ISC-109: Non-GET methods → 405
- [x] ISC-110: Unknown path → 404 JSON
- [x] ISC-111: Per-IP rate limit → 429 beyond threshold (Cato-hardened: trusts CF-Connecting-IP, falls back to last XFF hop — leftmost XFF is client-spoofable)
- [x] ISC-112: Responses carry restrictive CORS/security headers
- [x] ISC-113: Server binds 127.0.0.1:31890 only
- [x] ISC-114: Secrets read from env only; never in any response or log line
- [x] ISC-115: Spotify access token obtained/renewed via refresh token
- [x] ISC-116: Spotify failure → last cached data or `{unavailable:true}` with 200
- [x] ISC-117: systemd unit: Restart=always, EnvironmentFile, runs as ubuntu (+ NoNewPrivileges, ProtectSystem, PrivateTmp)
- [x] ISC-118: Anti: no user input is ever forwarded to external APIs (range allowlist-validated)
- [x] ISC-143: GET /coffee → 418 I'm a teapot (deliberate easter egg, live through Cloudflare)

### M — Spotify one-time auth
- [x] ISC-119: spotify-auth.ts serves loopback callback on 127.0.0.1:8888
- [x] ISC-120: Prints authorize URL with scope `user-top-read`
- [x] ISC-121: Exchanges code and writes refresh token directly into `api/.env` (masked on stdout)
- [x] ISC-122: Refresh token present in local `api/.env` AND server `/etc/joschi-api.env` (600)
- [x] ISC-123: Anti: client secret never printed by any script

### N — Deploy
- [x] ISC-124: Static files rsynced to `/var/www/html/joschi/`
- [x] ISC-125: api/ deployed to `/opt/joschi-api/`
- [x] ISC-126: `/etc/joschi-api.env` exists, chmod 600
- [x] ISC-127: systemd `joschi-api` enabled + active
- [x] ISC-128: nginx default vHost has `location /joschi/api/` → 127.0.0.1:31890
- [x] ISC-129: `nginx -t` passed and diff shown before reload
- [x] ISC-130: cloudflared config untouched (mtime 2026-06-24, unchanged)
- [x] ISC-131: Live page returns 200 with new content marker
- [x] ISC-132: `https://aiwerke.de/joschi/api/health` → 200 through Cloudflare
- [x] ISC-133: `/joschi/api/music` returns real top artists live
- [x] ISC-134: Rollback path documented (stop service + rsync of git tag v1)

### O — Live quality gates
- [x] ISC-135: Browser desktop screenshot: layout as designed
- [x] ISC-136: Browser mobile-viewport screenshot: layout intact
- [x] ISC-137: Zero browser console errors on live page
- [x] ISC-138: Zero 404s in network log on live page
- [x] ISC-139: Palette keyboard flow verified in a real browser
- [x] ISC-140: Page weight < 500 KB (excl. fonts), JS < 40 KB (total ~48 KB; JS 17.8 KB)
- [x] ISC-141: v1 preserved as git tag `v1` before rewrite
- [x] ISC-142: Anti: live site unreachable for no longer than the rsync window during deploy

## Test Strategy

| isc | type | check | threshold | tool |
|---|---|---|---|---|
| 1–2, 6 | build | bundle produced, size, tree clean | exit 0, <30 KB | Bash (bun build, wc -c, git ls-files) |
| 3–5, 10, 123 | security | secret grep over tracked files | 0 hits | Bash (git grep) |
| 7–9, 134 | docs | files state real paths/steps | manual read | Read |
| 11–24 | visual/code | theme vars, fonts, contrast, responsive | screenshots + grep + computed ratios | Playwright + Grep + python |
| 25–38 | behavior | boot/curve animation + reduced-motion | visual + code path | Playwright + Read |
| 39–56 | interaction | palette keyboard/mobile flows | each action works | Playwright (32-check battery) |
| 57–66 | integration | widgets against local + live API | real data renders / honest offline | Playwright + curl |
| 67–72 | behavior | scroll activation, fallback | visual | Playwright |
| 73–89 | content | claims vs audit list, word counts | 100% traceable | Read + Bash (wc -w) |
| 90–96 | content/legal | links, Impressum present | manual read + click | Playwright + Read |
| 97–103 | interaction | eggs trigger, no gating | each fires | Playwright |
| 104–118, 143 | api | endpoint contracts, limits, binding | status codes | curl + Bash |
| 119–123 | ops | auth flow produces token | .env populated | Bash (masked read-back) |
| 124–133 | deploy | server state + live probes | 200s, active unit | ssh + curl + Playwright |
| 135–142 | quality | screenshots, console, network, weight | 0 errors, <500 KB | Playwright + curl |

Note: Interceptor (mandated verifier) is not installed on this machine; Playwright/Chromium used as documented fallback — precedent: cloud9-meeting-fixes run. Follow-up: install Interceptor on this laptop.

## Features

| name | description | satisfies | depends_on | parallelizable | status |
|---|---|---|---|---|---|
| design-system | styles.css tokens, dark+light themes, grid texture | B | — | no | ✓ |
| content-structure | index.html rewrite, all sections, copy pass | B,C,G,H,I,J | design-system | no | ✓ |
| curve-canvas | src/curve.ts animated load curve | D | design-system | yes | ✓ |
| palette | src/palette.ts + commands + eggs | E,K | content-structure | yes | ✓ |
| live-widgets | src/live.ts fetch + render + degrade | F | content-structure | yes | ✓ |
| api-backend | api/server.ts Bun service | L | — | yes (Forge) | ✓ (Forge) |
| spotify-auth | api/spotify-auth.ts one-time OAuth | M | — | yes (Forge) | ✓ (Forge; consent pending) |
| impressum | impressum.html + Datenschutz | J | design-system | yes | ✓ |
| build-hygiene | build script, .gitignore, docs update | A | — | yes | ✓ |
| deploy-live | server rollout + live verification | N,O | all | no | ✓ |

## Decisions

- 2026-07-10 · Plan approved by owner after one revision: chatbot cut from v1 ("brauche mehr Zeit") → palette keeps a free-text slot; Spotify widget switched from now-playing to top artists/tracks with time-range choice (owner's explicit spec).
- 2026-07-10 · Defaults set while owner AFK, veto-able: Design A (control room), name "Joschi Breitfeld" (live site says "Oskar" — flagged), English.
- 2026-07-10 · Deploy target verified by ssh, not assumed: live files at `/var/www/html/joschi/` under the *default* nginx vHost; no joschi entry in sites-enabled. API location must go into the default vHost — a new `server_name aiwerke.de` block would capture traffic away from it.
- 2026-07-10 · Delegation split: frontend built by primary (design-critical, voice-critical), api/ + auth script delegated to Forge (self-contained, spec-able). Cato audits at VERIFY. Floor E4 ≥2 met.
- 2026-07-10 · Secrets policy: owner pasted Spotify creds in chat; values flow directly into gitignored env files and are never repeated in output, plan files, or this ISA (public repo).
- 2026-07-10 · Custom cursor rejected (research: high gimmick risk); hover micro-interactions instead. Splash screen rejected; boot line is inline and non-blocking.
- 2026-07-11 · Run resumed after session-limit crash (previous session died at 17:39 right after scaffolding this ISA; src/ was empty). Recovery: plan + Spotify creds recovered from the dead session's transcript; classifier said E3, ISA says E4 → context-override to E4 logged.
- 2026-07-11 · refined: ISC-20 resolved by owner mid-run: "call me oskar not Joschi on the website" → all human-name references are "Oskar Breitfeld"; `joschi@aiwerke` kept as the unix handle/terminal persona (matches /joschi/ URL + github joschi655). Owner can veto the handle too.
- 2026-07-11 · Interceptor (mandated web verifier) is not installed on this machine — Playwright/Chromium used as fallback with full 32-check battery, screenshots reviewed by eye (precedent: cloud9-meeting-fixes). Follow-up: install Interceptor here.
- 2026-07-11 · Advisor (pre-deploy): flagged Cloudflare cache risk → cache-busting `?v=2` added to styles.css/app.js references; trailing-slash proxy semantics double-checked; service-start-before-nginx-reload ordering kept.
- 2026-07-11 · Creative additions beyond plan (owner asked to "get even more creative"): grid-frequency scroll meter (f: 50.00 Hz drifts with scroll velocity), live canvas favicon (blinking cursor + green dot on API heartbeat), document.title as terminal cwd (+ `[ctrl+z] suspended` on hidden tab), `neofetch`/`history`/`vim`/`rm -rf bugs`/`make sandwich`/`forecast`/`grid`/`ping` commands, server-side `GET /coffee` → HTTP 418 (ISC-143 added), `ls`+`cd` as real navigation, palette output area as persistent terminal log.
- 2026-07-11 · Spotify consent left as the single remaining human action: authorize URL opened in owner's browser; background finisher auto-writes token to api/.env, syncs to /etc/joschi-api.env, restarts joschi-api, probes live /music. Redirect-URI mismatch hit on first click → owner registered `http://127.0.0.1:8888/callback` in the Spotify dashboard; consent page reopened.
- 2026-07-11 · Cato cross-vendor audit: verdict `concerns` (low), no critical/major. Two minor findings BOTH FIXED same-session and redeployed (commit db1effa): (1) rate limiter trusted leftmost XFF (client-spoofable bypass) → now CF-Connecting-IP with last-XFF-hop fallback; (2) renderList innerHTML sink unescaped (static-constants-only today) → escHTML added. Note: CrossVendorAudit.ts tool only reads MEMORY/WORK ISAs, not project ISAs — codex staging blocked, Cato ran as direct read-through; tool follow-up filed in Changelog.

## Changelog

- conjectured: "A subsequence fuzzy matcher is sufficient for a ~28-command palette."
  refuted_by: Playwright battery — typing `coffee` executed `cd offscreen` ("coffee" is a subsequence of it, and it sorts earlier).
  learned: Subsequence matching needs a ranking tier (exact > prefix > subsequence) the moment command names share letters; a matcher that can never prefer an exact literal match is wrong by construction.
  criterion_now: ISC-44 (ranked matching) + battery check "coffee → 418".

- conjectured: "Reading X-Forwarded-For makes the rate limit per-client behind a proxy chain."
  refuted_by: Cato audit — the service took XFF[0], the one entry the client fully controls; a rotated fake leftmost value bypasses the 60/min limit.
  learned: In a proxy chain, trust flows from the far end: each hop appends, so only the entries added by hops you control are trustworthy. Behind Cloudflare the canonical answer is CF-Connecting-IP; "parses XFF" is not a security property until you name which end you trust.
  criterion_now: ISC-111 (CF-Connecting-IP first, last-hop XFF fallback).

- conjectured: "Progressive-enhancement typewriter can simply restore innerHTML when done."
  refuted_by: Battery caught the boot line losing the live-uptime span when the API answered faster than the 1.4 s typing animation.
  learned: Any 'restore final HTML' animation pattern must re-adopt children that were appended concurrently — animations and async data race by default.
  criterion_now: boot() preserves `[data-boot-uptime]` across restore; battery check "boot uptime appended".

## Verification

- ISC-1/2: `bun build --minify` exit 0; dist/app.js 17,837 B (17.4 KB) < 30 KB
- ISC-3/4/5/123: `git check-ignore api/.env` OK; grep of client-id/secret values over all tracked+staged files → only api/.env (ignored); spotify-auth prints token masked (xxxx…yy)
- ISC-19: computed ratios — ink/bg 16.44, muted/bg 7.31, signal/bg 6.10, muted/surface 6.87 (all ≥ 4.5)
- ISC-20: grep "Oskar Breitfeld" → index.html×5, impressum.html×3; live page lede shows it (Playwright PASS "name in lede")
- ISC-24/30/38/83: Playwright — scrollWidth 360@360px, ≤769@768px; screenshots desktop/mobile reviewed by eye
- ISC-25–27: battery "boot line finished" + reduced-motion context "boot static instantly"
- ISC-28: lede = 48 words; ISC-71: steps ≤ 30 words each; ISC-89: total visible 683 (incl. UI labels), trimmed from 739
- ISC-39–56: 32-check Playwright battery on LIVE URL — palette open (⌘K, /, FAB), neofetch, uptime (real data), coffee (418), cd projects (scroll+close), Esc, theme toggle + localStorage persist — all PASS
- ISC-57/60/61: live page shows real server uptime + real GitHub event "MadsLorentzen/ai-job-searchwatch · 3d ago"
- ISC-63: with empty refresh token, music card renders "spotify feed offline — honest, at least." and console stays clean
- ISC-77 claim audit: every card traces to v1 index.html (Spotify bot, energy law, pyrolysis, clients, Blender, KooKoo, piano, travel) or PROJECTS.md (Cloud-Instance-Optimizer, check24-MCP GenDev WON, Claude Campus Ambassador); no numbers invented
- ISC-78: `grep -rniE "trading|ml-trading"` over site files → 0
- ISC-97–103: battery konami→lab PASS, lab section visible, CRT under global reduced-motion kill, console greeting present in main.ts
- ISC-104–118: curl battery local + on server — /health 200 ok, /status uptime_seconds, /coffee 418, unknown 404, POST 405, headers (nosniff, ACAO aiwerke.de, no-store), /music {unavailable:true} with empty token
- ISC-113: server.ts binds hostname "127.0.0.1"; nginx proxies /joschi/api/ → 127.0.0.1:31890 (verified block shown in diff)
- ISC-124–132: rsync output; systemctl is-active → active; /etc/joschi-api.env -rw------- root root; nginx -t OK + diff displayed; `https://aiwerke.de/joschi/` 200 with v2 content; `api/health` 200 via Cloudflare; coffee 418 via Cloudflare
- ISC-130: /etc/cloudflared/config.yml mtime 2026-06-24 12:00 (read-only access only)
- ISC-135–139: LIVE battery 32/32 PASS; screenshots (desktop hero, palette session, lab mode, light mode, mobile, reduced-motion, impressum) reviewed
- ISC-140: live payload = 13,552 + 15,885 + 18,166 B ≈ 48 KB excl. fonts
- ISC-141: `git tag` → v1 on pre-rewrite commit 98813fc
- ISC-142: site answered 200 continuously (rsync-into-place, no --delete)
- Cross-vendor audit (Cato): see Decisions/audit outcome below
- ISC-58/133: live browser probe — music card renders "Miracle Tones / Eric Clapton / Kid Francescoli" + real tracks; curl via Cloudflare returns the same
- ISC-59/105: all 3 ranges return distinct real data (short: Clairo, Polo & Pan, Nilüfer Yanya · long: HVOB, Miracle Tones, MONKYMAN)
- ISC-106: second call within TTL answers in 0.25 s through Cloudflare (cache hit, no Spotify roundtrip)
- ISC-115: refresh-token → access-token exchange exercised live on first /music call after consent
- ISC-121/122: finisher log "refresh token saved" (masked) + "SYNCED TO SERVER"; server env grep → token present, file 600 root:root
- 2026-07-11 00:5x: owner clicked Agree after registering redirect URI; zero further manual steps — finisher auto-synced and restarted joschi-api
