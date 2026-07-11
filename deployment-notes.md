# Deployment — aiwerke.de/joschi/ (v2, Control Room)

Stand: 2026-07-11. Verifizierter Ist-Zustand des Servers (per ssh geprüft, nicht geraten):

- Webroot: **`/var/www/html/joschi/`** — ausgeliefert vom **default nginx vHost**
  (`/etc/nginx/sites-enabled/default`), es gibt **keinen** eigenen aiwerke.de-vHost.
- Extern erreichbar über **Cloudflare Tunnel** (`cloudflared`, `/etc/cloudflared/config.yml`) —
  **an cloudflared wird für diese Seite NICHTS geändert** (pfadbasiert, kein neuer Hostname).
- API-Service: `joschi-api` (Bun) unter `/opt/joschi-api/`, lauscht **nur auf 127.0.0.1:31890**.

## 1. Statische Dateien

```bash
rsync -av index.html impressum.html styles.css dist ubuntu-tunnel:/tmp/joschi-stage/
ssh ubuntu-tunnel 'sudo rsync -av /tmp/joschi-stage/ /var/www/html/joschi/ && sudo chown -R www-data:www-data /var/www/html/joschi/'
```

Kein `--delete` — alte Assets stören nicht und `git tag v1` ist der Rollback.

## 2. API-Service

```bash
rsync -av api/server.ts api/joschi-api.service api/.env.example ubuntu-tunnel:/tmp/joschi-api-stage/
ssh ubuntu-tunnel 'sudo mkdir -p /opt/joschi-api && sudo cp /tmp/joschi-api-stage/server.ts /opt/joschi-api/'
# Env-Datei NUR auf dem Server, nie im Repo:
#   /etc/joschi-api.env  (chmod 600, root:root) — Variablen siehe api/.env.example
ssh ubuntu-tunnel 'sudo cp /tmp/joschi-api-stage/joschi-api.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable --now joschi-api'
ssh ubuntu-tunnel 'curl -s 127.0.0.1:31890/health'   # → {"ok":true,...}
```

## 3. nginx — EIN location-Block im default vHost

In `/etc/nginx/sites-enabled/default` (der Block, der `/var/www/html` ausliefert) ergänzen —
siehe `nginx-snippet.conf`. **Niemals** einen neuen `server_name aiwerke.de`-Block anlegen
(würde den bestehenden Traffic kapern).

```bash
ssh ubuntu-tunnel 'sudo cp /etc/nginx/sites-enabled/default /tmp/nginx-default.bak.$(date +%s)'
# … Block einfügen …
ssh ubuntu-tunnel 'sudo nginx -t && sudo systemctl reload nginx'
```

Vor jedem Reload: `nginx -t` UND Diff gegen das Backup ansehen.

## 4. Live-Verifikation (Pflicht)

```bash
curl -sI https://aiwerke.de/joschi/ | head -1                  # 200
curl -s  https://aiwerke.de/joschi/api/health                  # {"ok":true,...}
curl -s  "https://aiwerke.de/joschi/api/music?range=medium_term" | head -c 200
curl -s -o /dev/null -w '%{http_code}' https://aiwerke.de/joschi/api/coffee   # 418
```

Danach echte Browser-Prüfung (Screenshots Desktop + Mobile, Konsole ohne Errors, keine 404s).

## 5. Spotify einmalig autorisieren

Lokal `bun api/spotify-auth.ts` → Authorize-URL öffnen → Agree → Refresh-Token landet in
`api/.env`. Den Wert dann in `/etc/joschi-api.env` nachtragen und `sudo systemctl restart joschi-api`.
Redirect-URI im Spotify-Dashboard: `http://127.0.0.1:8888/callback`.

## Rollback

```bash
git checkout v1 -- index.html styles.css && rsync … # Statik = ein rsync
ssh ubuntu-tunnel 'sudo systemctl stop joschi-api'   # Widgets degradieren sauber, Seite läuft
```
