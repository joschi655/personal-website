# joschi - control room

Personal site at **https://joschi655.github.io/personal-website/** - a light aubergine-and-forest, power-grid-flavored one-pager with
project artifacts, a ⌘K command palette, and live widgets fed by a tiny Bun API on my own server.
No frameworks, no npm, no trackers. `bun build` and vanilla everything.

## Layout

| Path | What |
|---|---|
| `index.html` | The page. All content works with JS disabled. |
| `styles.css` | Design system - light lavender paper + matte aubergine, with a coordinated dark mode (`data-theme`). |
| `src/main.ts` | Entry: boot line, shared grid-load signal, title-cwd, timeline, konami, favicon. |
| `src/gridfield.ts` | Seeded power-flow canvas - scroll reactive but pointer-independent, static under reduced motion. |
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

## Edit and publish

The static portfolio runs on **GitHub Pages**, not on the Ubuntu server.
`https://aiwerke.de/joschi/` redirects here. Cloudflare only tunnels the optional
widget API from Ubuntu; it does not host the site. If Ubuntu is offline the page,
project images, CV, and bird clock still work; widgets show their offline state.

1. Edit `index.html` for biography, experience, projects, and links.
2. Put new images or PDFs in `assets/`; change `styles.css` for styling.
3. Edit `src/` for interactions, then run `bun install --frozen-lockfile && bun run build`.
4. Commit and push to `main`. The **Publish personal website** GitHub Action builds
   and publishes automatically. Wait for its green deployment before checking the site.

You can also edit `index.html` directly with GitHub's pencil button and commit to
`main`; no SSH, server copy, or manual build is needed for publication.

```bash
git pull --ff-only
# edit files
bun install --frozen-lockfile
bun run build
git add index.html styles.css src/ dist/ assets/
git commit -m "Update portfolio information"
git push origin main
```

The Pages artifact is an explicit allowlist assembled by `scripts/stage-pages.sh`:
HTML, CSS, `dist/`, `assets/`, and the standalone `birdclock/` page and assets.
Backend source, `.env` files, notes, and agent configuration are not published as
website files. This GitHub repository itself is public.

### Widget backend (Ubuntu only)

`api/server.ts` runs as `joschi-api.service`, behind the existing
`https://aiwerke.de/joschi/api/` route. Browser calls from Pages use that absolute
URL and the API allows `https://joschi655.github.io` through CORS. Local development
still uses the relative API proxy. Secrets stay in `/etc/joschi-api.env`.
Changes to backend code require a separate reviewed server deployment; pushing
website content does not restart or modify the server.

### Legacy server deploy

`deploy.ts` and the old VS Code deploy tasks target the retired static Ubuntu
webroot; they are **not** the Pages publishing path. Use commit + push instead.
The existing server files are preserved for rollback. Do not change Cloudflared
or DNS to publish routine content updates.
