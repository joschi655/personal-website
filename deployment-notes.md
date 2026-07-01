# Deployment-Notizen: nginx + Cloudflare Tunnel Subdomain

> **Wichtig:** Diese Datei ist eine Schritt-für-Schritt-Anleitung.
> Führe nichts aus, bevor du jeden Schritt gelesen und verstanden hast.
> Keine automatischen Skripte — alles manuell prüfen.

---

## 1. Zielarchitektur bestätigen

Die aktuelle Umgebung nutzt bereits einen **Cloudflare Tunnel (`cloudflared`)**, der Hostnames
auf lokale Dienste mapped. Für eine neue persönliche Website-Subdomain ist der sichere Weg daher:

1. statische Dateien lokal via **nginx** ausliefern,
2. in `cloudflared` eine **neue Ingress-Regel** für die Subdomain ergänzen,
3. **keine** unüberlegte Änderung am bestehenden Reverse-Proxy-Pfad vornehmen.

> In dieser Umgebung sollten Änderungen an `cloudflared` **nur manuell und mit Freigabe** erfolgen.

---

## 2. Dateien auf den Server kopieren

```bash
# Von deiner Entwicklungsmaschine aus (oder lokal auf dem Server):
sudo mkdir -p /var/www/TODO-subdomain

# TODO: Ersetze den Pfad mit dem tatsächlichen Verzeichnis
rsync -av --delete \
  /home/ubuntu/projects/personal-site-aiwerke/ \
  /var/www/TODO-subdomain/

sudo chown -R www-data:www-data /var/www/TODO-subdomain
sudo chmod -R 755 /var/www/TODO-subdomain
```

---

## 3. nginx lokal vorbereiten

Die aktuelle Tunnel-Konfiguration leitet Hostnames auf lokale HTTP-Services weiter. Daher reicht
für diese persönliche Website normalerweise ein **lokaler nginx-vHost auf Port 80**.

Falls du die Architektur später auf origin-seitiges TLS umstellst, kannst du das separat ergänzen.
Für den ersten Go-Live in dieser Umgebung ist das aber nicht zwingend nötig.

---

## 4. nginx-Konfiguration einbinden

```bash
# Snippet nach /etc/nginx/sites-available/ kopieren
sudo cp /home/ubuntu/projects/personal-site-aiwerke/nginx-snippet.conf \
        /etc/nginx/sites-available/TODO-subdomain.conf

# TODO: Datei vor dem Aktivieren noch einmal prüfen!
sudo nano /etc/nginx/sites-available/TODO-subdomain.conf

# Symlink anlegen
sudo ln -s /etc/nginx/sites-available/TODO-subdomain.conf \
           /etc/nginx/sites-enabled/TODO-subdomain.conf

# Konfiguration testen (niemals ohne diesen Schritt neuladen!)
sudo nginx -t

# Bei grünem Licht: nginx neu laden
sudo systemctl reload nginx
```

---

## 5. Cloudflared-Ingress-Regel ergänzen (manuell, nur nach Freigabe)

Beispiel für die bestehende Tunnel-Konfiguration:

```yaml
- hostname: TODO-subdomain.aiwerke.de
  service: http://localhost:80
```

Wichtige Hinweise:

- Vorher prüfen, welche Datei der laufende Dienst wirklich nutzt.
- In dieser Umgebung lief `cloudflared` zuletzt über `/etc/cloudflared/config.yml`.
- Änderungen an `cloudflared` können die externe Erreichbarkeit beeinflussen und sollten daher
  **nicht blind** durchgeführt werden.
- Nach einer Änderung immer Konfiguration prüfen und erst dann den Dienst kontrolliert neu laden.

---

## 6. Testen

```bash
curl -I https://TODO-subdomain.aiwerke.de
# Erwartet: 200 OK über Cloudflare

# Überprüfe Security-Header:
curl -si https://TODO-subdomain.aiwerke.de | grep -i "x-frame\|content-security\|x-content"
```

---

## Checkliste vor dem Go-Live

- [x] Inhalte in `index.html` eingetragen (Werdegang, Projekte, Hobbys)
- [x] GitHub-Link eingetragen (github.com/joschi655)
- [x] `og:url` auf https://aiwerke.de/joschi/ gesetzt
- [ ] LinkedIn-URL eintragen (Footer: `href="#"` → echte URL)
- [ ] E-Mail-Adresse eintragen (Footer: `href="#"` → `mailto:...`)
- [ ] Foto optional: `assets/foto.jpg` einfügen + `<img>`-Tag im Hero ergänzen
- [ ] `og:image` ergänzen, sobald Foto vorhanden
- [ ] nginx-Location-Block für `/joschi/` im bestehenden aiwerke.de-vHost prüfen
- [ ] `sudo nginx -t` zeigt keine Fehler
- [ ] Seite im Browser aufgerufen und visuell geprüft
- [ ] Mobile Ansicht getestet (Firefox DevTools / Chrome)

---

## Optionales: Formspree für das Kontaktformular

Damit das Kontaktformular ohne eigenen Server-Backend funktioniert:

1. Account auf [formspree.io](https://formspree.io) anlegen (kostenloser Plan reicht)
2. Neues Formular anlegen, Endpoint-URL kopieren (z.B. `https://formspree.io/f/XXXXXXXX`)
3. In `index.html`:
   ```html
   <!-- Vorher: -->
   <form ... action="mailto:TODO@example.com" method="post" enctype="text/plain">
   <!-- Nachher: -->
   <form ... action="https://formspree.io/f/XXXXXXXX" method="POST">
   ```
4. `enctype="text/plain"` entfernen
5. In `script.js` den `mailto`-Fallback-Check entfernen oder anpassen
