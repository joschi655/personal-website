# WORKLOG — personal-website

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
