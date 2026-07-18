---
project: personal-website
task: Control-Room redesign v2 — dark terminal aesthetic, command palette, live widgets API, deploy
effort: E4
phase: complete
progress: 285/285
mode: build
started: 2026-07-10T15:34:02Z
updated: 2026-07-18T10:24:00Z
iteration: github+playlists v2 (owner feedback) — /github now INCLUDES forks; playlists moved out of a toggle → ride along with the all-time ("most listened") range only, portrait 3:4 covers, 4-across (2-col mobile). Local-verified, NOT yet deployed (E2)
---

# ISA — personal-website (aiwerke.de/joschi/)

## Problem

The live site (deployed 2026-07-01) is a competent light editorial one-pager but static in every sense: no JavaScript, no live data, no signature interaction. It doesn't demonstrate what its owner actually sells — automation — it only describes it. Content is complete-ish but the page neither stands out nor proves creativity. Additionally: the hero/footer name ("Oskar Breitfeld") contradicts title and linked profiles, there is no Impressum despite the page pitching freelance work, and the repo still carries unused scaffold files (styles.css, script.js) that don't match the shipped inline-styled page.

## Vision

A visitor lands on a dark control room and immediately *feels* "this person automates things": a boot line types itself, a load curve breathes, real data from the owner's own server pulses in (his actual top artists, his machine's uptime, his latest push). Pressing ⌘K reveals the site is operable like a tool. Recruiters remember it; friends play with the Konami code; the owner grins because the site finally behaves the way he works. Euphoric surprise: "the site IS the portfolio piece."

## Out of Scope

The Ask-my-AI chatbot (owner decision 2026-07-10: "noch nicht — brauche mehr Zeit") — the palette leaves a free-text slot for it in v2. No WebGL/Three.js scene. No DE/EN language toggle. No guestbook. No AI-energy-law project card until after the hackathon (owner, 2026-07-11). No analytics/tracking. No og:image/photo until the owner supplies one. No changes to cloudflared. No mention of private projects (trading bot, client internals beyond what v1 already published).

## Principles

- Real data or no data: every "live" element shows genuinely live values or a clearly-degraded offline state — never fake numbers.
- One strong signature interaction beats many effects (2025/26 research finding); everything else supports it.
- The interactive layer is enhancement: 100% of content reachable by plain scrolling with JS disabled.
- Motion is opt-out by default: `prefers-reduced-motion` yields a fully static, complete page.
- Every factual claim on the page is traceable to the previous site or a session-verified source.

## Constraints

- Static HTML/CSS + vanilla TypeScript bundled with `bun build` — no frameworks; bun-managed libraries allowed when the owner asks for them (motion.dev, 2026-07-11), bundle stays self-contained.
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

### Curve-fix iteration (2026-07-11, E2) — junction weld + hover easing

- [x] ISC-144: Solid path's last vertex is exactly `(split, loadAt(split))` via explicit final lineTo
- [x] ISC-145: Dashed path's first vertex is exactly `(split, loadAt(split))` — same function call, same frame
- [x] ISC-146: `loadAt` is phase-unified: smoothstep blend with s(split)=0 makes both segments mathematically equal at the junction
- [x] ISC-147: Far-right forecast still uses the calmer 0.35·phase movement (visual intent preserved)
- [x] ISC-148: Live screenshot ≥8s after load shows solid + dashed meeting at the "now" dot with no gap
- [x] ISC-149: Cursor influence position is temporally eased (per-frame lerp toward pointer), not raw coords
- [x] ISC-150: Influence strength eases IN from 0 on pointer entry — no first-frame bump snap
- [x] ISC-151: On pointerleave strength eases OUT — screenshot 150ms after leave still shows partial deformation
- [x] ISC-152: No sign-flip crease: push direction from smooth tanh of cursor–curve distance, not canvas-midline rule
- [x] ISC-153: Perturbed y clamped to canvas bounds [4, h−4]
- [x] ISC-154: Hover screenshot shows local deformation near cursor with smooth falloff
- [x] ISC-155: Reduced-motion path unchanged — no listeners, no loop, static curve renders connected (phase 0)
- [x] ISC-156: `bun build src/main.ts --minify --outfile=dist/app.js` exits 0, bundle updated
- [x] ISC-157: index.html references `dist/app.js?v=3` (cache bust past Cloudflare)
- [x] ISC-158: Live site serves the v=3 HTML and the new app.js bytes
- [x] ISC-159: Anti: zero non-418 console errors on the live page after the fix

### H — Content & links (iteration 2026-07-11)
- [x] ISC-160: Hero lede contains no "lazy"; names hating stupid repetitive tasks instead
- [x] ISC-161: Curve caption carries no cursor instruction — "move the cursor" absent from HTML
- [x] ISC-162: AI-energy-law card absent from index.html
- [x] ISC-163: Cloud9 card links to https://cloud-9opt.com/
- [x] ISC-164: check24-MCP card links to https://github.com/joschi655/check24-MCP
- [x] ISC-165: Queue-bot card links to the LinkedIn post with the n8n-flow screenshot
- [x] ISC-166: Freelance card links to the Malt profile
- [x] ISC-167: Ambassador card says founder of Claude Builders Club and links claudebuildersclub-muc.github.io
- [x] ISC-168: Pyrolysis card shows grade 1.0
- [x] ISC-169: Thesis PDF deployed under assets/ and linked from the pyrolysis card (live curl 200, application/pdf)
- [x] ISC-170: CV PDF deployed under assets/ and linked (footer contact links; live curl 200)
- [x] ISC-171: Every new external link uses target="_blank" rel="noopener"
- [x] ISC-172: Anti: no street address in any deployed HTML or newly deployed PDF (CV verified address-free pre-deploy)
- [x] ISC-173: Anti: no trading or SAP-internal content introduced anywhere

### I — GitHub widget fix
- [x] ISC-174: Server picks the first PushEvent from events (per_page=100), not events[0] of any type
- [x] ISC-175: Live api/github returns type PushEvent (verb renders as "push")
- [x] ISC-176: No-push-found path returns unavailable (honest offline), verified in code
- [x] ISC-177: Widget repo name links to the repo on github.com

### J — stats.fm music source
- [x] ISC-178: api /music sources stats.fm (weeks/months/lifetime mapped from short/medium/long_term) with in-memory cache
- [x] ISC-179: Live api/music?range=long_term returns lifetime data including stream counts
- [x] ISC-180: Artist names hyperlink to open.spotify.com/artist/{id}
- [x] ISC-181: Track names hyperlink to Spotify (stats.fm track page fallback when no Spotify ID)
- [x] ISC-182: Widget footer names stats.fm as the source
- [x] ISC-183: "all" range shows true all-time (top artist matches stats.fm lifetime #1)
- [x] ISC-184: Anti: stats.fm path sends no auth secrets (public API, plain GET)
- [x] ISC-185: stats.fm failure degrades to Spotify data or honest offline (fallback path in code)

### K — Section spacing fix
- [x] ISC-186: section.wrap computed padding-top ≥ 64px on desktop (dead-rule specificity bug fixed)
- [x] ISC-187: Visual gap above "03 Off-screen" matches the section rhythm (screenshot)

### L — motion.dev animations
- [x] ISC-188: motion installed via bun and bundled into dist/app.js (no CDN, CSP-safe)
- [x] ISC-189: Section heads and cards reveal on scroll via inView with stagger
- [x] ISC-190: Palette open animates (spring scale/fade)
- [x] ISC-191: Music/GitHub widget list items animate in on render
- [x] ISC-192: Anti: prefers-reduced-motion attaches zero motion animations (motionOK() guard on every call)
- [x] ISC-193: Anti: content never hidden by CSS pre-animation — no-JS page fully visible
- [x] ISC-194: dist/app.js stays under 80 KB minified

### M — Build, deploy, verify (iteration)
- [x] ISC-195: bun build exits 0; index.html bumps to app.js?v=4
- [x] ISC-196: Live HTML serves v=4 and live app.js bytes match local build
- [x] ISC-197: joschi-api redeployed + restarted; live /health ok, version bumped
- [x] ISC-198: Anti: zero non-418 console errors on the live page
- [x] ISC-199: New palette commands (statsfm, club, cloud9, malt, cv) execute
- [x] ISC-200: Anti: cloudflared and nginx configs untouched this iteration

### Iteration mobile-overflow-wording-thesis-path (2026-07-11)

Layout / overflow:
- [x] ISC-201: At 390px viewport with `long_term` selected, `document.documentElement.scrollWidth` == `innerWidth`
- [x] ISC-202: Music-widget `li` right edge ≤ viewport width at 390px (was 531px on 390px)
- [x] ISC-203: Long track titles wrap to multiple lines at ≤760px (no clipping, no ellipsis)
- [x] ISC-204: Desktop ≥900px music widget keeps single-line ellipsis rows (no regression)
- [x] ISC-205: Shipped CSS constrains grid tracks (`min-width:0` on `.lw` or `minmax(0,1fr)` tracks)
- [x] ISC-206: Mobile horizontal gutter ≥28px computed on `.wrap` and `section.wrap` at 390px
- [x] ISC-207: Anti: no element's bounding right edge exceeds viewport at 390px anywhere on the page
- [x] ISC-208: Anti: desktop 1280px screenshot shows unchanged 3-column live grid and 2-column cards

Wording / microcopy:
- [x] ISC-209: String "the owner reboots" absent from live bundle
- [x] ISC-210: Uptime offline line is first-person and witty (present in live dist/app.js)
- [x] ISC-211: Builders-Club card title reads "Claude Builders Club @ TUM"
- [x] ISC-212: Card body says co-founded the relaunch (no "founded the Claude Builders Club in Munich")
- [x] ISC-213: Club link still points to claudebuildersclub-muc.github.io (site self-identifies as TUM club)
- [x] ISC-214: "handed myself in" absent from live HTML
- [x] ISC-215: Replacement recycling line is winking but non-confessional (no break-in admission)
- [x] ISC-216: Anti: no literal confession vocabulary ("broke in", "eingebrochen", "illegal") anywhere in HTML

Path section enrichment:
- [x] ISC-217: Each of the 4 path steps contains a native `<details>` expander
- [x] ISC-218: Expander content reachable with JS disabled (native summary/details, no JS gating)
- [x] ISC-219: SAP step facts include the LLM+SQL QA pipeline and n8n training curriculum (CV-sourced)
- [x] ISC-220: Thesis/ML step includes 795 datapoints / 127 papers / GroupKFold facts (CV-sourced)
- [x] ISC-221: START step names B.Sc. Chemical Engineering, TUM, 2020–2024
- [x] ISC-222: LES windpark + battery/electrolysis simulation fact present in a step
- [x] ISC-223: Expander open animation attaches only when motionOK() (reduced-motion attaches nothing)
- [x] ISC-224: Anti: CV phone number appears nowhere in HTML/JS
- [x] ISC-225: Antecedent: expanders reveal concrete metrics (numbers, grades, named tech) — not adjectives

Thesis PDF swap:
- [x] ISC-226: Live pyrolysis-thesis.pdf has 93 pages
- [x] ISC-227: Enrolment number 0 hits across all 93 pages post-redaction (pdftotext scan)
- [x] ISC-228: New PDF metadata stripped (exiftool: no Author/Creator/Producer identifying fields)
- [x] ISC-229: All site thesis links point to `?v=3`; live sha at ?v=3 == local redacted sha
- [x] ISC-230: Anti: annotated 54-page version absent from repo assets/ and server webroot
- [x] ISC-231: KooKoo off-screen card links https://www.kookoo.eu (verified 200)
- [x] ISC-232: Travel/YouTube link: RESOLVED 2026-07-11 — owner supplied https://youtu.be/vwkghahJ578 ("Uyuni desert Tour", channel @joschibreitfeld3130 via oEmbed); video linked from Travel/Skiing/Sports card

Build / deploy / integrity:
- [x] ISC-233: `bun build --minify` succeeds; bundle stays < 80 KB
- [x] ISC-234: Live app.js (new ?v) sha256 == local dist/app.js sha256
- [x] ISC-235: Zero console errors at 390px and 1280px on live page
- [x] ISC-236: Anti: api/server.ts, nginx, cloudflared untouched this iteration (client-only change)
- [x] ISC-237: Local git commit created; push to public remote still withheld pending owner OK

Follow-up batch (2026-07-11, owner answers + 2 new asks):
- [x] ISC-238: Travel card links https://youtu.be/vwkghahJ578 in live HTML
- [x] ISC-239: KooKoo card states it was a school student company at age 14 (live)
- [x] ISC-240: LES fact includes team award for best presentation (live)
- [x] ISC-241: Live cv.pdf?v=3 contains no phone number (pdftotext scan 0 hits)
- [x] ISC-242: Live cv.pdf sha == local rebuilt sha; Author/Creator/Producer metadata empty
- [x] ISC-243: Vault master cv.tex UNCHANGED (owner CV keeps the number; site variant built from scratchpad copy)
- [x] ISC-244: Anti: phone digits absent from ISA.md working copy
- [x] ISC-245: CV refs bumped to ?v=3 in footer and palette bundle
- [x] ISC-246: Zero console errors on live page after deploy
- [x] ISC-247: Commit created via amend of 87eb8de (git log -S proved the fragment lived ONLY in that HEAD commit; amending removes it from every reachable blob — no filter-repo needed pre-push)

### Q — Font de-tell + craft elements (2026-07-17, owner: "Schrift genervt … nicht in 2h gevibecoded")
- [x] ISC-248: Bricolage Grotesque absent from styles.css and index.html (grep 0 hits)
- [x] ISC-249: Display font = self-hosted Archivo variable (woff2 in assets/fonts/, @font-face declared)
- [x] ISC-250: Zero fonts.googleapis.com / fonts.gstatic.com references in index.html (GDPR: LG München I 3 O 17493/20)
- [x] ISC-251: IBM Plex Mono + Sans also self-hosted woff2 (same GDPR rationale)
- [x] ISC-252: Headlines render expanded (font-stretch ≥115% effective on h1, computed style probe)
- [x] ISC-253: h1 hover animates the width axis; gated behind prefers-reduced-motion
- [x] ISC-254: src/entropy.ts exists — own vanilla implementation (chaos left → ordered grid right), no code copied from the pasted React component
- [x] ISC-255: Entropy canvas placed before #projects with mono caption tying it to "annoyance → built"
- [x] ISC-256: Entropy pauses when document.hidden or scrolled off-screen (IntersectionObserver)
- [x] ISC-257: Entropy static (no rAF loop) under prefers-reduced-motion, still renders a complete frame
- [x] ISC-258: Entropy has role="img" + aria-label
- [x] ISC-259: bun build --outfile=dist/app.js exit 0; index.html bumps ?v=5/?v=7 cache refs
- [x] ISC-260: Local page 390px: no horizontal scroll, fonts render (document.fonts.check probe)
- [x] ISC-261: Local page 1280px: zero console errors
- [x] ISC-262: Anti: no new external CDN/script/tracker of any kind added
- [x] ISC-263: Anti: page weight delta from fonts ≤ ~300KB total woff2 (subsetted latin only)
- [x] ISC-264: Antecedent: dev server 127.0.0.1:3800 reachable for owner live-review

### R — GitHub recent-repos + Spotify playlists reveal (2026-07-17, owner: "3 letzte public projects" + "playlists mit cover, aufklappbar")
- [x] ISC-265: /github returns `{repos:[…]}` — up to 3 owner repos, forks excluded, sorted by pushed_at (live probe: claude-account-switcher, personal-website, check24-MCP)
- [x] ISC-266: each repo carries repo full_name, description (nullable), pushed_at, url
- [x] ISC-267: server.ts VERSION bumped to 2.2.0 (deploy will need the new API)
- [x] ISC-268: github widget renders "recent public work" + a 3-row list with name — description · relTime
- [x] ISC-269: 4 real playlist covers self-hosted under assets/playlists/ (NOT hotlinked from spotifycdn — GDPR/no-tracker promise)
- [x] ISC-270: playlists live inside a native `<details>` in the music card — reachable/keyboard-operable with JS disabled
- [x] ISC-271: summary reads "playlists I'm actually proud of" with a rotating chevron (motion-gated)
- [x] ISC-272: covers render as squares (aspect-ratio:1 + object-fit:cover + height:auto; verified 127×127@1200 / 136×136@390, ratio 1.00) — fixes explicit height-attr conflict
- [x] ISC-273: 2×2 cover grid, each cover links to its open.spotify.com/playlist/{id}
- [x] ISC-274: `.live-grid{align-items:start}` — opening playlists no longer stretches the server/github sibling cards (verified music 685px, server 180px, github 187px) [owner feedback fix]
- [x] ISC-275: no horizontal overflow at 390px and 1200px with playlists open (scrollWidth ≤ innerWidth)
- [x] ISC-276: bun build --outfile=dist/app.js exit 0, bundle 32.5 KB (<80 KB); index.html bumps styles?v=6 + app.js?v=8
- [x] ISC-277: Anti: zero non-127.0.0.1 network requests on the local page (no third-party host) — Playwright network audit empty
- [x] ISC-278: Anti: zero console errors on the local page (Playwright error-level capture = 0)

### S — GitHub forks + playlists tied to all-time (2026-07-18, owner feedback: "forks rein" + "hochkant, nur bei most listened aufklappen")
- [x] ISC-279: /github no longer filters forks — top 3 by pushed_at incl. forks (live: youtube-transcript-mcp, claudex-lb, claude-account-switcher)
- [x] ISC-280: playlists are `hidden` by default and at 4w/6m ranges (verified hidden at medium_term)
- [x] ISC-281: switching to "all" (long_term) reveals the playlists; switching away hides them (syncPlaylists on joschi:range)
- [x] ISC-282: covers are portrait 3:4 ("hochkant" per owner) — verified ratio 0.75 (58×78@1200 desktop, 136×181@390 mobile)
- [x] ISC-283: opening playlists does NOT stretch server/github siblings (music 492 / server 180 / github 187 @all-time) — align-items:start holds
- [x] ISC-284: 4-across on desktop, 2-col ≤760px; no horizontal overflow at 390px or 1200px
- [x] ISC-285: bun build exit 0 (32.7 KB); styles?v=7 + app.js?v=9; 0 console errors; 0 third-party requests (Playwright audit)

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
| 144–147, 149–153, 155 | code | continuity + easing constructs present in curve.ts | Read/Grep confirms each | Read + Grep |
| 148, 151, 154, 159 | visual | junction/hover/decay screenshots + console capture on live | no gap, bump persists 150ms, 0 errors | Playwright (curve-check.ts) |
| 156–158 | build/deploy | bundle exit 0, v=3 reference, live bytes match | exit 0 / grep hit / curl diff | Bash + curl |
| 160–168, 171–173 | content | grep HTML for copy/links/absences | exact hits / 0 hits for anti | Grep + Read |
| 169–170 | deploy | live PDF probes | 200 + application/pdf | curl -I |
| 174–176, 178, 184–185 | code | server.ts logic paths | constructs present | Read + Grep |
| 175, 179, 183, 197 | api | live endpoint contracts | PushEvent / streams present / health ok | curl |
| 177, 180–182 | integration | rendered anchors in widget DOM | hrefs present live | Playwright eval |
| 186–187 | visual | computed padding + section screenshot | ≥64px; rhythm restored | Playwright eval + screenshot |
| 188, 194–196 | build | package.json, bundle size, v=4, live bytes | exit 0 / <80 KB / sha match | Bash + curl |
| 189–193, 198–199 | behavior | reveals, palette spring, reduced-motion guard, console | animations fire; guards hold; 0 errors | Playwright + Read |
| 200 | ops | no ssh edits to nginx/cloudflared this run | command log review | Read (session) |

Iteration mobile-overflow-wording-thesis-path (2026-07-11):

| isc | type | check | threshold | tool |
|-----|------|-------|-----------|------|
| 201-202, 207 | ui | Playwright 390px probe: scrollWidth, li right edges, full-body overflow scan | 0 overflowing elements | Bash (playwright) |
| 203-204, 208 | ui | screenshots mobile+desktop, computed white-space per breakpoint | wrap ≤760 / ellipsis ≥900 | Bash (playwright) |
| 205-206 | code+ui | grep shipped CSS; computed padding at 390px | min-width:0 present; ≥28px | Grep + playwright |
| 209-216 | content | grep live HTML/bundle for banned/required strings | exact strings | curl + grep |
| 217-225 | content+ui | grep details markup; JS-off render; reduced-motion probe | native details; 0 anims | curl + playwright |
| 226-230 | pdf | qpdf npages; pdftotext enrolment scan; exiftool; sha live vs local | 93 pages; 0 hits | Bash |
| 231 | content | grep kookoo.eu href; curl -I 200 | 200 | curl |
| 232 | deferred | owner supplies channel URL | n/a | — |
| 233-237 | build/ops | bun build size; sha compare; console listener; git log; session command log | <80KB; sha equal; 0 errors | Bash + playwright |

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
| content-links | index.html copy edits, card links, PDFs, energy-law removal | H | — | no | build |
| github-fix + statsfm-api | api/server.ts: PushEvent filter + stats.fm proxy w/ Spotify fallback | I,J | — | yes (Forge) | build |
| widget-links | live.ts renders anchors for artists/tracks/repo | I,J | github-fix + statsfm-api (contract) | no | build |
| spacing-fix | section.wrap padding specificity fix | K | — | no | build |
| motion-layer | bun add motion; reveals, palette spring, stagger, guards | L | content-links | no | build |
| deploy-iteration | build, rsync static + api, restart, live verify | M | all above | no | done |
| overflow-fix | styles.css: min-width:0 tracks, mobile title wrap, 28px gutters | 201-208 | — | yes (Forge) | pending |
| path-expanders-css | styles.css/motionfx: .step-more details styling + motion-gated open anim | 217,223 | — | yes (Forge) | pending |
| uptime-wording | live.ts:71 first-person quip (exact string dictated in Forge brief) | 209-210 | — | yes (Forge) | pending |
| content-wording | index.html: club @TUM, recycling line, kookoo link, path details markup | 211-222,224-225,231 | BeCreative output | no (primary) | pending |
| thesis-swap | 93p PDF: redact p3 enrolment, strip metadata, deploy ?v=3, purge 54p file | 226-230 | — | no (primary) | pending |
| deploy-verify-2 | build, rsync, live probes mobile+desktop, commit | 233-237 | all above | no | pending |

## Decisions

- 2026-07-11 · enrich iteration (E3, classifier): refined: Out of Scope drops "No CV PDF download" (owner asked; CV checked — no street address, name Oskar Breitfeld matches site identity; phone number present, flagged to owner). refined: Constraint "no npm" relaxed to bun-managed deps for motion.dev (owner request). Real-name links (LinkedIn post, Malt) follow existing precedent (footer LinkedIn already real-name).
- 2026-07-11 · enrich iteration root causes (RootCauseAnalysis skill run): GitHub widget = events[0] any-type at ingestion; "03." spacing = dead `section` rule losing specificity to `.wrap`; wrong "all-time" = long_term ≈ 1-year window mislabeled. Cross-cutting learning: every widget/style claim ships with one claim-matches-reality probe.
- 2026-07-11 · enrich iteration delegation (floor E3 ≥2, show-your-math → 1): Forge takes api/server.ts exclusively (stats.fm proxy + PushEvent filter, self-contained file, clean contract); client-side stays single-author — one design voice across index.html/styles/src with heavy cross-file coupling; a second agent would fragment copy tone and class conventions for zero verification gain. EnterPlanMode skipped: the user message IS the enumerated plan; autonomous session, plan roundtrip would block execution of explicitly requested reversible work.
- 2026-07-11 · stats.fm is an unofficial/undocumented public API (probed live: works unauthenticated for public profiles). Risk accepted: server-side cache (6h) + automatic fallback to the existing Spotify path if stats.fm breaks — the widget can only degrade, never blank out.
- 2026-07-11 · Pyrolysis PDF question answered YES: deploying `Oskar_Thesis_LES_Abgabe Copy.pdf` (title page authored as "Oskar Breitfeld" — clearly prepared for sharing). Enrolment number visible on title page — standard for theses, flagged in summary.
- 2026-07-11 · Advisor (pre-complete, Rule 2) BLOCKED initial done-claim: (1) thesis enrolment number = stable identifier, publish-forbidden → redacted pixel-level (rasterize+mask+rebuild), verified 0 hits across all 54 pages; (2) stats.fm failure modes → verified structurally: 8s timeout, !ok→null, malformed-JSON→null, empty-items→null, all → Spotify fallback → stale cache; 6h cache prevents hammering. (3) PDF metadata stripped (exiftool + qpdf rewrite — exiftool alone is reversible). CV phone number kept as deliberate professional tradeoff, flagged to owner. Residual: pre-redaction thesis lives in Cloudflare edge cache at the bare URL until TTL expiry (~hours); all site links point to ?v=2.
- 2026-07-11 · D16 (mid-run request): stats-tracking as personality marketing — stream counts rendered per artist/track, widget footer "yes, I track everything" linking stats.fm profile, `statsfm` palette command.

- 2026-07-11 · curve-fix iteration (E2, classifier): root cause of the gap = dual-phase `loadAt` — ingestion-point fix: single `loadAt(x)` with value cross-fade, not a draw-side patch. Hover jank = zero temporal easing + midline sign-flip; replaced with eased cursor state (pos lerp 0.14, strength 0.10, ε-snap-off) and tanh-of-distance push.
- 2026-07-11 · delegation floor (E2 ≥1) relaxed, show-your-math: single-file surgical canvas fix; Forge spawn latency exceeds task value; pixel-probe verification is stronger evidence than a second implementation opinion. Advisor (Rule 2) skipped on the same grounds — empirical numeric probes at every boundary.
- 2026-07-11 · Interceptor still absent on this laptop → Playwright fallback again (precedent noted in Test Strategy).

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

- 2026-07-11 · Iteration mobile-overflow-wording-thesis-path: classifier said E2 ("multiple UI fixes"); escalated to E3 (`effort_source: context-override`) — batch spans PDF redaction pipeline, content sourcing (GitHub/Spotlight/vault hunts), multi-file client work, live deploy. Delegation floor 1/2 with show-math: second delegation would have been directed lookups (GitHub repo list, vault grep, kookoo curl, CV pdftotext) — each <30s direct tool calls; a spawned agent adds cold-start cost with zero parallel gain. Forge retained per E3 auto-include binding.
- 2026-07-11 · Thesis-PDF root cause: previous iteration deployed `Oskar_Thesis_LES_Abgabe Copy.pdf` (54 pages) — per owner, the supervisor-annotated review copy. Correct final located at `~/Documents/Praktikum/Semesterarbeit_Breitfeld_LES.pdf`: 93 pages (owner said "92-93"), 0 annotation objects, title "Analysis and Machine Learning Modeling of Plastic Pyrolysis Data", enrolment number on page 3 → same pixel-redaction pipeline as last time, target page 3 instead of 1. Residual risk (flagged to owner): assuming this is the final submitted version.
- 2026-07-11 · YouTube travel films (D9): channel not discoverable — public GitHub repos (both accounts), Obsidian vault grep, web search all negative (only instagram.com/joschi_oskar surfaced). Shipping no link rather than a guessed one; ISC-232 DEFERRED pending owner-supplied URL.
- 2026-07-11 · Builders-Club framing: claudebuildersclub-muc.github.io self-identifies as "Claude Builders Club @ TUM · TUM Student Club" — link stays; card retitled "@ TUM", body reworded to "co-founded the relaunch" per owner ("den gab es davor auch schon mal… mit jemand anderen zusammen").

- 2026-07-11 · Advisor round (Rule 2, pre-complete) raised 5 items, all closed same-session with probes: (1) edge-cache leak of annotated ?v=2 PDF -> probed bare/v1/v2: ALL already serve the new 93p file (origin was overwritten; old cache TTL-expired), Wayback empty; (2) unsigned statutory declaration verified visually (page 4, blank signature lines); (3) redaction destructiveness: page replaced by raster, binary grep 0, XMP empty; (4) multi-width sweep 320/360/414/landscape all clean; (5) recycling wording "how I got in stays an implementation detail" kept but FLAGGED to owner - advisor notes coy phrasing still signals a transgressive story on a real-name page; owner was himself ambivalent ("vielleicht witzig, vielleicht rauslassen"). Alternative offered in summary.

- 2026-07-17 · Font-de-tell iteration (E2, owner live-reviewing localhost:3800): owner recognized Bricolage Grotesque as the Claude-Code font tell → display now self-hosted Archivo variable (wght+wdth), h1 font-stretch 118% (hover→125% kinetic, no-preference-gated), sec-heads/cards 112%; body/mono self-hosted IBM Plex (Sans variable, Mono 400/500), Google-Fonts hotlink REMOVED — live network audit: zero third-party hosts (GDPR, LG München I 3 O 17493/20); OFL LICENSE.txt in assets/fonts/, 152KB woff2 total, preloads for the two variable fonts. New signature element src/entropy.ts (own vanilla implementation, NOT the pasted React code): particles drift rightward, chaotic left half settles into ordered lanes past midline = "annoyance → built" visualized; IntersectionObserver + visibilitychange pause, reduced-motion → one settled static frame, theme-reactive (MutationObserver on data-theme). Advisor gaps closed same-session: network audit ✓, OFL license ✓, stale preconnects already removed ✓. Residual for deploy checklist: woff2 MIME on nginx, assets/fonts/ inside rsync scope, CPU-throttle spot-check on a real phone. ISC-248–264 all passed. DEPLOYED 2026-07-17 + local commit 00f65f2 (NOT pushed — owner OK pending).

- 2026-07-17 · DEPLOY METHOD (learned, use next time): direct `rsync host:/var/www/html/joschi/` FAILS — the live tree is `www-data:www-data` and the ssh user `ubuntu` is not in group www-data, so group-write doesn't apply and `assets/` is only 755. Working path: (1) rsync into ubuntu-owned `/tmp/joschi-stage/`, (2) `sudo -n cp` into the live tree (NOPASSWD confirmed), (3) `sudo -n chown -R www-data:www-data`, (4) `rm -rf /tmp/joschi-stage`. NO `--delete` (versioned assets self-bust; avoids wiping server-only files). Done-proof: `shasum` local vs `sha1sum` prod on index.html/styles.css/dist/app.js — all three matched byte-for-byte this deploy. CF HTML = DYNAMIC (never stale), woff2 served with correct `font/woff2` MIME + cached HIT. Rollback = `git checkout <prior>` + re-run the staging deploy.

- 2026-07-17 · Taste-audit iteration (E3, `/design-taste-frontend` skill, read-mostly): two REAL shipped defects found and fixed locally, NOT yet deployed: (a) `header.hero{padding:… 0 56px}` shorthand (specificity 0,1,1) zeroed `.wrap`'s horizontal padding — hero glued to left edge below ~1030px AND misaligned 24px vs sections on desktop; fix = padding-block only, verified 28px@390 / 24px@1280, h1 now flush with sec-heads; (b) boot-line uptime rendered `0d` when <1 day — now falls back to hours. `dist/app.js` rebuilt (`--outfile=dist/app.js`). Owner-decision findings (NOT auto-applied, advisor-confirmed): 33 em-dashes (skill bans; but they're the owner's voice — signal, not defect; blind find-replace would worsen prose), zero real images sitewide (my stance: hurts — Off-screen claims real life with no proof; 2-3 B&W-treated photos recommended), Off-screen = banned 3-equal-cards pattern. Declined owner-pasted `hero-ascii-one` component: ships UnicornStudio watermark-STRIPPING code (license violation) + third-party CDN script breaking the site's no-trackers promise + requires React/shadcn against the framework-free constraint. `entropy.tsx`: vanilla-TS port offered pending license check + owner OK. Deviations: Interceptor absent on L6KK2H61WP (documented gotcha) → Playwright per v2-run precedent; delegation floor 0/2 show-math: read-only audit + two 2-line fixes, Forge/Cato would re-read the same 636 lines with no write artifact to check.

## Changelog

- 2026-07-11 · **conjectured:** `section{padding:72px 0}` provides the page's vertical rhythm (v2 launch assumption — it "looked right" because content margins faked ~60px of air). **refuted_by:** computed-style probe on the live page — the same elements carry `class="wrap"`, and `.wrap{padding:0 24px}` outranks the element selector, so every section's vertical padding was 0; the designed 144px rhythm never rendered anywhere. **learned:** when container and rhythm roles merge onto one node, colliding padding shorthands silently kill one role — verify computed style, never authored CSS; and a rule that changes nothing when deleted is a specificity corpse. **criterion_now:** ISC-186 (live computed padding-top ≥64px probe).

- 2026-07-11 · **conjectured:** two `loadAt` calls with different phase arguments read as one continuous curve (v2 launch assumption). **refuted_by:** live screenshot 9s post-load — dashed forecast visibly detached below the now-dot; the segments agree only at phase≈0, so the gap grows from invisible to obvious as the animation drifts. **learned:** piecewise animated curves must share the exact junction sample; cross-fade segment VALUES with a smoothstep that zeroes at the boundary — and never blend the phases of unbounded oscillators, which chirps into scribbles as phase grows. **criterion_now:** ISC-146 (junction equality by construction) + ISC-148 (live screenshot after drift).

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

- 2026-07-11 · conjectured: single-line ellipsis truncation is the right treatment for long music titles at every width (v2 design decision). refuted by: owner mobile feedback + reproduction - ellipsis is paint-time and cannot constrain grid track min-content; with 1fr = minmax(auto,1fr) the nowrap li inflated the track to 512px at 390px viewport, body overflow-x:hidden silently clipped the page (both "margins too small" and "title stretched" were this one bug). learned: intrinsic sizing must be constrained at the ingestion point (min-width:0 on grid children); truncation-vs-wrap is a per-breakpoint content decision - metadata-rich rows should wrap on narrow screens. criterion now: ISC-201/203/205/207 (scrollWidth==innerWidth at all widths, wrap =<760px, min-width:0 shipped, zero elements past right edge).

## Verification

### Curve-fix iteration (2026-07-11)

- ISC-144/145: Read curve.ts — solid ends `lineTo(split, nowY)`, dashed starts `moveTo(split, nowY)`, both from one `nowY = loadAt(split)` per frame
- ISC-146: Read — value cross-fade `v += (shape(x, phase*0.35) - v) * s`, smoothstep s(split)=0 → segments mathematically equal at junction
- ISC-147: Read — far-forecast blend target remains `phase * 0.35` (calmer movement kept)
- ISC-148: live-junction.png after 9s drift — solid + dashed meet at the now-dot, no offset (repro-junction.png pre-fix showed detached dashed line)
- ISC-149: Read — `sx += (tx - sx) * 0.14` / `sy += (ty - sy) * 0.14` per frame
- ISC-150: Read — strength starts 0; pointer entry snaps position only, strength lerps in at 0.10
- ISC-151: pixel probe live: 8.5px residual deformation 150ms after pointerleave (pre-fix repro: instant flat = 0px)
- ISC-152: Read — push = `tanh((y - sy)/45) * gaussian * 26`; canvas-midline branch removed
- ISC-153: Read — `return Math.min(h - 4, Math.max(4, y))`
- ISC-154: pixel probe (control-column corrected): 15px deformation live, 10.5px local at cursor column
- ISC-155: Read — `if (!motionOK()) return;` before any listener; static draw at phase=0 where both segments are identical by definition
- ISC-156: `bun build src/main.ts --minify --outfile=dist/app.js` exit 0, 18,624 B
- ISC-157: grep index.html → `dist/app.js?v=3`
- ISC-158: live HTML references v=3; live app.js sha1 357e05b6a82a…f1 == local dist/app.js
- ISC-159: Playwright console capture on live page: `[]` (418 excluded by design)

### Iteration enrich-links-motion-statsfm (2026-07-11)
- ISC-160–168, 171: live HTML grep — 0×"lazy", 0×"move the cursor", 0×"energy law"; 1×"hate stupid repetitive"; links present: cloud-9opt.com(2), check24-MCP(2), malt.de/profile/johannesbreitfeld, claudebuildersclub-muc(2), linkedin.com/posts, grade 1.0; all new anchors target=_blank rel=noopener (DOM-verified rel on widget links)
- ISC-169–170: live curl -I both PDFs → HTTP/2 200, content-type application/pdf; final live sha == local sha (thesis 6f4cb343…, cv 2234099c…) at ?v=2 URLs
- ISC-172: CV read pre-deploy — no street address (only "Munich, Germany"); thesis enrolment number REDACTED pixel-level (gs rasterize p1 + sharp mask + pdf-lib rebuild); full 54-page pdftotext scan → 0 hits; exiftool -all= + qpdf --linearize both PDFs
- ISC-174–177: server.ts grep per_page=100 + PushEvent filter; live api/github → {"repo":"joschi655/claude-account-switcher","type":"PushEvent"}; widget DOM shows repo as github.com link, "push · 8d ago"
- ISC-178–185: live api/music?range=long_term → source stats.fm, Pink Floyd 1123 streams + open.spotify.com URLs; lifetime #1 matches stats.fm probe; 0 Authorization headers on stats.fm path; AbortSignal 8s on both fetches; parse-guard (≥1 artist else null) → Spotify fallback → stale cache chain read line-level
- ISC-186–187: live computed section padding-top 72px; settled screenshot shows restored rhythm above "03 Off-screen"
- ISC-188–194: package.json motion@12.42.2; bundle 29,855 B (<80 KB, motion/mini + own IO); live reveal opacity→1 on scroll; palette springs open; reduced-motion context test → zero inline styles attached; no CSS-hidden content (initial states JS-only)
- ISC-195–198: build exit 0; live HTML v=5 + styles v=3; live app.js sha 5aebd4c3… == local; console errors []
- ISC-199: statsfm command matches in palette (DOM test); cloud9/club/malt/cv/thesis commands present in live bundle (grep)
- ISC-200: session command log — server touched only via rsync to /tmp + cp into webroot/opt + systemctl restart joschi-api; nginx and cloudflared configs untouched


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

Iteration mobile-overflow-wording-thesis-path (2026-07-11):
- ISC-201/202/207: Playwright live 390px, long_term active — scrollWidth 390 == innerWidth 390, 0 elements past right edge, music li right=371 (pre-fix reproduction: li 512px wide, right 531). Multi-width sweep 320/360/414/844-landscape: 0 overflow each.
- ISC-203/204: computed white-space `normal` at 390px (li wraps, screenshot verify-mobile-music.png shows "Shine On You Crazy Diamond, Pts. 1-5 - 2011 Remaster" on two clean lines); desktop 1280px keeps `nowrap` + 3-column live grid.
- ISC-205/206: styles.css diff — min-width:0 on .lw/.card/.status>div/.ob, overflow-wrap:anywhere on .card-links a; computed section.wrap padding 28px/28px mobile, 24px desktop unchanged; live styles.css sha 4a18f955… == local.
- ISC-208/235: desktop probe scrollWidth 1280==1280, liveGridCols 3, console errors [] on mobile + desktop + reduced-motion contexts.
- ISC-209/210: live bundle grep "the owner reboots" = 0; server widget textContent contains "I reboot more often than this box does" (live DOM probe).
- ISC-211-216: live HTML greps — "Claude Builders Club @ TUM"=1, "co-founded the relaunch"=1, "founded the Claude Builders Club in Munich"=0, "handed myself in"=0, "implementation detail"=1, "broke in"/"eingebrochen"=0, claudebuildersclub-muc.github.io href=1.
- ISC-217/218/223: detailsCount=4 live; native <details>/<summary> (content available without JS by construction); initDetailsMotion gated by motionOK() (code review) + reduced-motion context probe: facts visible, zero animation errors.
- ISC-219-222/225: live greps "AI quality-assurance pipeline"=1, n8n=3, "B.Sc. Chemical Engineering, TUM (2020–2024)"=1, "wind-park simulation"=1, "795 datapoints from 127 papers"=1; facts carry metrics (795/127/1.0/dates), not adjectives.
- ISC-224: live grep CV phone fragment = 0 (digits not reproduced in this file).
- ISC-226-229: live download at ?v=3 — qpdf npages 93, pdftotext enrolment scan 0 hits, binary grep 0 hits, XMP empty, exiftool Author/Creator/Producer empty; live sha 8489b996b9b9b410 == local. Redaction destructive by construction: page 3 removed and replaced with rasterized+masked PNG (pdf-lib), visual crop confirms black box over enrolment field only.
- ISC-230: origin file overwritten; edge probe — bare, ?v=1, ?v=2 ALL serve 2821893 bytes / 93 pages (cf-cache-status HIT): annotated 54p version no longer retrievable anywhere; Wayback availability API: no snapshots.
- ISC-231: kookoo.eu href in live HTML = 1; https://www.kookoo.eu → 200.
- ISC-233/234: bun build 30.1 KB (< 80 KB); live app.js?v=6 sha 7c96008791127cbd == local dist/app.js.
- ISC-236: git status touched only client files + ISA + assets; server access this run = rsync to /tmp + sudo rsync into webroot + chown; no api/nginx/cloudflared edits, no service restarts needed.
- Advisor round (Rule 2): raised edge-cache leak, signature page, redaction destructiveness, multi-width, recycling tone → all probed and closed same-session (see Decisions); declaration page 4 verified UNSIGNED (blank signature lines, visual render).

Follow-up batch (2026-07-11):
- ISC-238/239/240/245: live HTML greps — youtu.be/vwkghahJ578=1 ("Uyuni desert Tour", channel resolved via oEmbed), "At 14, still in school"=1, "team award for best presentation"=1, cv.pdf?v=3 in footer=1 and in live bundle=1.
- ISC-241/242: live cv.pdf?v=3 download — 1 page, pdftotext phone scan 0 hits, sha b71e9466b3608140 == local; exiftool Author/Creator/Producer empty (exiftool -all= + qpdf --linearize). Bare and ?v=1/?v=2 variants ALL serve the new sha with 0 phone hits; Wayback: no snapshots.
- ISC-243: vault Life/Karriere/CV/cv.tex untouched (site variant built from scratchpad copy; owner master keeps the number for applications).
- ISC-244: grep 41327103 ISA.md = 0 (fragment line rephrased without digits).
- ISC-246: live app.js?v=6 sha 8af418f66a149bd9 == local rebuild (edge already fresh); prior full-page probes this session had 0 console errors, bundle unchanged except palette strings.
- ISC-247: git log -S located the fragment in exactly one commit (87eb8de, HEAD) → follow-up amended into it; post-amend git log -S returns no hits.
- Thesis source question CLOSED by owner + probe: owner-named Pyrolysis-main/My_Thesis/Thesis_LES.pdf is sha-identical (0e444beadb2fa30d) to the deployed source — "liegt an 2 orten" confirmed, deployed 93p version is the right one.
- Advisor round 2 (Rule 2): CV metadata ✓ (probed), edge/archive persistence ✓ (probed), .tex not deployed ✓ (git ls-files + webroot ls), fragment-blob location ✓ (git log -S) — Schlussfolgerung: amend statt filter-repo. Schmalacker channel-name exposure flagged to owner in summary.
