# joschi - control room

Personal site at **https://aiwerke.de/joschi/** - a dark, power-grid-flavored one-pager with
real project artifacts, a ⌘K command palette, and live widgets fed by a tiny Bun API on my own server.
No frameworks, no npm, no trackers. `bun build` and vanilla everything.

## Layout

| Path | What |
|---|---|
| `index.html` | The page. All content works with JS disabled. |
| `styles.css` | Design system - dark control room + light "paper mode" (`data-theme`). |
| `src/main.ts` | Entry: boot line, shared grid-load signal, title-cwd, timeline, konami, favicon. |
| `src/gridfield.ts` | Seeded power-flow canvas - scroll/pointer reactive, static under reduced motion. |
| `src/clock.ts` | Browser-local KooKoo clock readout and live analog dial. |
| `src/palette.ts` | ⌘K command palette (signature element) - 39 commands, fuzzy matched. |
| `src/curve.ts` | Animated load-curve canvas (measured + forecast; cursor is the anomaly). |
| `src/live.ts` | Live widgets: Spotify top artists/tracks, server uptime, GitHub activity. |
| `src/state.ts` | Shared utilities (theme, lab mode, range, api heartbeat). |
| `assets/projects/` | Locally hosted evidence: product, workflow, thesis, and travel stills. |
| `dist/app.js` | Built bundle (committed so the server needs no build step). |
| `api/` | `joschi-api` - Bun widget backend (see below). |
| `impressum.html` | Impressum + Datenschutz. |
| `dev/serve.ts` | Local dev server with `api/*` proxy. |
| `ISA.md` | Ideal State Artifact - system of record for this project. |

## Build & develop

```bash
bun build src/main.ts --minify --outfile=dist/app.js   # bundle (~18 KB)
bun api/server.ts        # widget API on 127.0.0.1:31890 (reads api/.env)
bun dev/serve.ts         # site on http://127.0.0.1:3800 with api proxy
```

## API - `joschi-api`

Bun service, binds `127.0.0.1:31890`, exposed only through nginx at `/joschi/api/`.

| Endpoint | Returns |
|---|---|
| `GET /health` | `{ok, version}` |
| `GET /music?range=short_term\|medium_term\|long_term` | my Spotify top 3 artists + tracks (cached 6 h) |
| `GET /status` | server uptime from `/proc/uptime` |
| `GET /github` | latest public event for `joschi655` (cached 10 min) |
| `GET /coffee` | `418 I'm a teapot` |

Secrets live in `api/.env` (gitignored) locally and `/etc/joschi-api.env` (chmod 600) on the
server - never in the repo. One-time Spotify OAuth: `bun api/spotify-auth.ts` (writes the
refresh token into `api/.env`, scope `user-top-read` only).

## Deploy

```bash
bun run deploy              # build → rsync → verify against the live site
bun run deploy --dry-run    # print every action, write nothing
bun run deploy --prune      # also remove webroot files not in the manifest
bun run deploy --all        # static + api/server.ts + systemctl restart
bun run deploy --verify     # probes only
```

`deploy.ts` uploads an **allowlist** (`index.html`, `impressum.html`, `styles.css`, `dist/`,
`assets/`) — never the repo root, so `api/.env`, `src/`, `ISA.md` and the deployment notes
cannot reach a public webroot. It stages over ssh, installs with sudo as `www-data`, then
verifies by hashing what the live site actually serves (HTML normalised for Cloudflare's
email obfuscation) plus `api/health` and the 418. Any failed probe exits non-zero.

It never touches nginx, cloudflared, or `/etc/joschi-api.env`.

Server layout and the one-time setup live in `deployment-notes.md`. Rollback: `git tag v1`
holds the previous site; API off = widgets degrade honestly, page still works.
