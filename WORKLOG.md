# WORKLOG — personal-website

## 2026-07-27 — Birdclock: the clock now knows it's night

Owner: *"the real clock wouldn't work at night… the webapp should also not wake anyone.
manually clicked it's fine, as it was manually and not auto."*

- **The obvious rule is the wrong rule.** "Sun below the horizon → stay quiet" sounds
  complete and isn't: Munich at midsummer has the sun up at 05:14 and still up at 21:19, so
  a pure daylight guard sings a Nightingale into the bedroom at five. The real photoresistor
  in the wall clock would do exactly that. The shipped rule is the intersection — sun up
  **and** 07:00–22:00 — which makes the webapp strictly quieter than the hardware it copies.
- **Sunrise/sunset computed in-page**, NOAA declination + hour angle, no request and no API
  key so the folder still works offline. Latitude is the clock's home; longitude is the home
  meridian for anyone on the same standard offset and the timezone's meridian otherwise. The
  standard offset is taken as `max(Jan, Jul)` — using the live offset would put the meridian
  15° off through the whole summer, which cost 14 minutes of accuracy until it was caught.
- **Manual stays manual.** Hour rows and the arm button play at any hour; only the automatic
  rollover is gated. Hands, readout and index keep running through the night — a clock that
  freezes at 22:00 reads as broken, not considerate.
- **Where a browser has a real light sensor and has already granted it**, a reading under 8
  lux also counts as dark. It may only add quiet, never cancel it: a dark room at noon is
  still dark, a lit room at 03:00 is not permission to wake the house. Nothing ever prompts.
- **Verified twice over.** The solar block is sliced out of `index.html` and run in bun
  against published almanac times — 24/24, within 2 minutes across June/December/March,
  polar night and midnight sun return finite states instead of NaN. Then in a browser with
  `HTMLMediaElement.play` spied and `Date` stubbed: 02:59→03:00 armed produced zero play
  calls, 13:59→16:00 produced three, and a row click at 03:00 played. 0 console errors.
- **Not deployed** — local only, waiting on the owner's go.

## 2026-07-27 — De-slopification: the page had the wrong narrator

Owner: *"nobody cares where YOU took the info from! It's supposed to be my work… the website
should be from my point of view and not from the AIs point of view that built it for me."*

- **Root cause, one class not five.** Every flagged line was the builder explaining itself to
  the reader. Three variants: explaining a withholding (`private by design - architecture only,
  no screenshots or repository`, `public-safe system sketch`, `public-safe responsibility map`),
  citing a source for his own work (`architecture, from the public README`), and insisting
  content is genuine (`real counts`, `real model output`, `the real n8n workflow`,
  `not placeholder album art`, `this one actually runs`, `real data`). A three-lens sweep past
  the five he named found six more of the same class, incl. `Client data stays off the
  portfolio` and `real project artifacts` in README.md. All removed; `.proof-private` CSS rule
  and its justifying comment deleted with them.
- **Jira/SQL was a factual error, not a wording one.** The AI planning assistant had **no Jira
  API** — planning data was reachable only through a SQL database mirroring Jira. The page drew
  Jira and SQL as sibling sources and called it "combining agentic Jira access with an
  SQL-backed context layer", which overstates the integration. Schematic now has one source box
  ("Jira data / SQL mirror") feeding the planning helper. A Jira MCP exists now but postdates
  the project.
- **Both schematic runtimes** now read `runtime: Cloud Foundry on BTP` (was "SAP BTP Cloud
  Foundry" and "SAP BTP"). ⚠️ Owner named the runtime once — confirm the planning assistant is
  also Cloud Foundry and not another BTP runtime.
- **Film thumbnail** → `assets/Thumbnail.jpeg`, encoded to `assets/projects/travel-film.webp`
  at 900×675 / 146 KB. The still is Cotopaxi (Ecuador) but the overlay said "Bolivia", so the
  label is now "South America"; oEmbed confirms the film is his own *Uyuni desert Tour*.
  `assets/Thumbnail.jpeg` (1.4 MB source) added to `deploy.ts` EXCLUDES so it never ships.
- **Made permanent** so it doesn't recur (it already had, on MCP-CX-Operations): project
  `CLAUDE.md` § THE AUTHOR RULE, global `~/.claude/CLAUDE.md` Ghostwriter rule, a Ghostwriter
  check in the Algorithm v6.3.0 VERIFY checklist, and two memory files.
- **Not deployed** — local only, verified on localhost:3800 (Playwright; Interceptor absent on
  this laptop). Run `bun deploy.ts` when ready.

## 2026-07-26 — Bird clock: hosted, longer songs, selectable length + fade-out

Owner request: "is the birdclock asset hosted? deploy it on my server. birdsongs longer
than 8s — option for 10s, 30s or full length, with volume fade out so it's not abrupt."

- **It was not hosted.** `/joschi/birdclock/` → 404. `birdclock/` was never in `deploy.ts`'s
  `MANIFEST`, so it had never shipped. (The main page's hourly chime *was* live — that reads
  from `assets/birdsong/`, which is a different asset set.) Now live at
  **<https://aiwerke.de/joschi/birdclock/>**, server not Pages (owner choice — one line in
  the existing self-verifying deploy vs. a second deploy path to maintain).
- **The 8 s ceiling was a missing-source problem, not a code problem.** Every clip on disk
  was exactly 8.000 s / 48645 B; the full recordings named in `birds.json` had never been
  committed and were not on this Mac or the server. Found in
  `~/Downloads/12xSV Recordings-*.zip` (26 MB, 13 files) — `find` missed them because they
  were zipped, and `unzip` fails on the legacy-codepage umlauts outright (`bsdtar -xf` works).
- **Two new audio tiers** via `birdclock/tools/encode.ts` (new, reproducible): `short/` 33 s
  (2.9 MB total) serves the 10 s and 30 s settings, `full/` the whole recording, 48–300 s
  (11.8 MB). Two tiers so a 10 s setting doesn't pull a 5-minute file; browsers range-request
  either way (verified `206 Partial Content`). Joint stereo VBR ~80 kbps, up from mono 48 kbps.
- **Masters needed fixing, not just cutting.** They idled 0.5–2.4 s before the first note
  (a quarter of a 10 s cut, and on an hourly chime it reads as a broken clock) → trimmed to
  0.15 s of room tone. They spanned **-8.0 to -16.7 LUFS** — Fitis 9 dB louder than
  Blaukehlchen, so the clock lurched hour to hour → all twelve now within **0.2 LU of -14**,
  gain-only so the 6.6–21.1 LU of internal dynamics survive.
  Gain must be applied *before* the silence trim: the other order lets a master getting -6 dB
  keep a head that only falls under the threshold afterwards. Caught in verification, fixed.
- **Fade is software, not baked** — one curve serves any cut point. In: 0.25 s. Out: 1.8 s on
  a 10/30 s cut, 2.5 s landing on a full recording's own ending, 0.35 s when interrupted.
  Routed through a Web Audio **`GainNode`, not `audio.volume`** — iOS ignores writes to
  `HTMLMediaElement.volume`, so the obvious implementation is silent on every iPhone.
- **Player also gained** click-the-singing-row-to-stop (needed once songs can run 5 minutes),
  a progress hairline, and `localStorage` persistence of the length setting. Changing length
  mid-song restarts from the right tier rather than cutting out.
- **Deploy hardening:** a directory in `MANIFEST` drags its whole subtree into a public
  webroot, which would have published `birdclock/README.md` and `tools/encode.ts` — exactly
  what the allowlist exists to prevent. Added `EXCLUDES` (+ `--delete-excluded`, so a
  previously-staged doc can't survive) and added both paths to the `LEAKS` probe, so the
  exclusion is verified rather than asserted. Both 404 live.
- **Verified live:** gain traced on production at 0.00 → 1.00 → 0.88/0.56/0.30/0.11/0.00
  between 8.2 s and 10.0 s on the 10 s setting; correct tier requested per setting; 30 s cut
  stops at 30 s; 0 console errors. Playwright again (Interceptor still not installed on this
  Mac — L6KK2H61WP).
- **Known, left alone:** `03` Mönchsgrasmücke and `05` Rotkehlchen open with ~2 s of soft
  ambience. That's the recording, not a trim bug — it's real audio above the silence
  threshold, and cutting to the first loud note would behead them.
- **Not touched:** the main page's 8 s hourly chime (`assets/birdsong/`). 8 s is right for a
  chime on a portfolio page; say the word and it can read the new tiers too.

## 2026-07-25 — Deploy automation (`deploy.ts`) + webroot information leak fixed

Owner request: "create a script that deploys the website on my server automatically."

- **`deploy.ts`** — `bun run deploy` builds, rsyncs an **allowlist** (index.html, impressum.html, styles.css, dist/, assets/) to `ubuntu-tunnel:/tmp/joschi-stage`, installs into `/var/www/html/joschi/` as www-data with 644/755, then verifies against the live URL. Flags: `--dry-run`, `--prune`, `--api`, `--all`, `--verify`, `--no-build`. Exits non-zero on any failed probe. Never touches nginx, cloudflared, or `/etc/joschi-api.env`.
- **Leak found in preflight:** `deployment-notes.md`, `nginx-snippet.conf`, `README.md` and `script.js` had drifted into the public webroot from earlier hand-run rsyncs and were serving **200**. The two config docs disclosed webroot path, systemd unit, API port, nginx vHost file and `/etc/joschi-api.env`. No secrets (those are chmod-600 on the server only). All four pruned → 404. The allowlist is the ingestion-point fix.
- **Cloudflare transform:** the zone runs Email Obfuscation, so live HTML never matches uploaded HTML byte-for-byte. The verifier normalises the `mailto:` → `/cdn-cgi/l/email-protection` rewrite on both sides instead of dropping the check.
- **Deployed:** the de-AI-ification build (6d3e293) is now live — paper mode default, amber palette, SVG schematics. Verified: 10/10 probes green, live widgets return real Spotify/uptime/GitHub data, 0 console errors (Playwright; Interceptor CLI still not installed on this Mac).
- **Cloudflare Pages:** assessed, not implemented — static side is trivially portable, `/status` (reads `/proc/uptime`) is the one endpoint that cannot run on Workers.

## 2026-07-25 — De-AI-ification pass (visual-first)

Owner request: "make the website not look AI generated" — uniqueness through visuals, not text. Skills: impeccable + design-motion-principles + design-taste-frontend + frontend-design.

- **Palette:** warm graphite `#0E100D` + control-panel amber `#E8A33D` (dark); paper-mode signal `#8A5200`. **Paper mode is now the default theme** (owner decision this session). Static 32px CSS grid background removed — the seeded canvas field owns the background alone.
- **Label cull:** numbered section eyebrows, CASE/artifact numbering, arrow-chain kickers, SIDE A/B/C, experiment numbering, decorative status dots, system.manifest/verified header — all removed. Real-state indicators kept (apidot, chime dot, START/NOW/WORK/NEXT).
- **Visuals up:** three div-built architecture sketches replaced with inline SVG schematics in the site's trace language; hero load-curve grown to ~210px with a live local-time marker at the measured→forecast junction.
- **Motion:** bounce easing → expo-out everywhere; reveals narrowed to section level; ⌘K palette opens instantly (keyboard-initiated); topbar cursor blinks 4x then rests; fake Hz readout removed; scrollmeter animates transform, scroll listener rAF-batched. Reduced motion still fully static.
- **Copy:** light trim of the most LLM-sounding quips; voice and easter eggs kept.
- **Verified:** bun build clean; impeccable detector 0 findings (4 before); Playwright screenshots desktop+mobile+both themes; 0 console errors. Interceptor CLI not installed on this Mac — Playwright MCP used instead.
- **Status:** committed + pushed to `origin/main` (`6d3e293`) on owner request. **Not yet deployed** — the live site at aiwerke.de/joschi/ still serves the previous build until the rsync to `/var/www/html/joschi/` runs. Cache-busts: styles.css?v=16, app.js?v=15. ISA.md follow-up batch appended.
