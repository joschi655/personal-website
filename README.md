# Persönliche Website — Scaffold

Statische persönliche Website für einen KI- und Infrastruktur-orientierten technischen Gründer.
Gebaut mit reinem HTML/CSS/JS — keine Frameworks, keine Build-Tools nötig.

---

## Dateien

| Datei                  | Beschreibung                                      |
|------------------------|---------------------------------------------------|
| `index.html`           | Haupt-HTML mit allen Sektionen                    |
| `styles.css`           | Komplettes Styling (Dark-Theme, responsive)       |
| `script.js`            | Interaktivität (Navbar, Reveal-Animationen, Form) |
| `nginx-snippet.conf`   | Vorlage für nginx-Server-Block (nicht live!)      |
| `deployment-notes.md`  | Schritt-für-Schritt Deployment-Anleitung          |
| `assets/`              | Ordner für Bilder (muss noch angelegt werden)     |

---

## Personalisierung — was du ausfüllen musst

Suche in `index.html` nach `TODO` (alle Platzhalter sind so markiert):

| Platzhalter             | Was du eintragen sollst                           |
|-------------------------|---------------------------------------------------|
| `TODO: Dein Name`       | Deinen vollständigen Namen                        |
| `TODO: Studiengang`     | z.B. „Informatik (M.Sc.)"                         |
| `TODO: Interessen`      | Hobbys, Themen neben dem Job                      |
| `TODO@example.com`      | Deine E-Mail-Adresse                              |
| `linkedin.com/in/TODO`  | Deine LinkedIn-Profil-URL                         |
| `github.com/TODO`       | Dein GitHub-Profil-URL                            |
| `TODO: Projektname`     | Name und Beschreibung der 4. Projektkarte         |
| Kontaktform action      | E-Mail oder Formspree-Endpoint                    |
| `og:url`, `og:image`    | Domain und Preview-Bild für Social-Shares         |
| Footer-Copyright        | Deinen Namen im Footer                            |

### Foto einfügen

1. Erstelle `assets/foto.jpg` (empfohlen: 600×600 px, quadratisch)
2. Ersetze in `index.html` den Avatar-Platzhalter:
   ```html
   <!-- Vorher: -->
   <div class="avatar-placeholder" aria-hidden="true">👤</div>
   <div class="avatar-todo">TODO: Foto einfügen</div>

   <!-- Nachher: -->
   <img src="assets/foto.jpg" alt="Dein Name" />
   ```

### Impressum / Datenschutz (Deutschland!)

Wenn die Seite öffentlich zugänglich ist, brauchst du i.d.R. ein Impressum.
Erstelle `impressum.html` und kommentiere den Link im Footer ein.

---

## Lokale Vorschau

```bash
# Option 1: Python (überall verfügbar)
python3 -m http.server 8080
# → http://localhost:8080

# Option 2: Node (falls installiert)
npx serve .
# → http://localhost:3000

# Option 3: VS Code Extension „Live Server"
```

---

## Deployment (Kurzfassung)

Vollständige Anleitung mit Checkliste: **`deployment-notes.md`**

**Überblick für die aktuelle Server-Architektur (Cloudflare Tunnel + nginx):**
1. Dateien nach `/var/www/TODO-subdomain/` kopieren
2. `nginx-snippet.conf` anpassen → nach `/etc/nginx/sites-available/` kopieren
3. `sudo nginx -t && sudo systemctl reload nginx`
4. In der Cloudflared-Tunnel-Konfiguration eine neue `hostname`-Regel für die Subdomain ergänzen, die auf den lokalen nginx-vHost zeigt
5. Änderungen an Cloudflare/Cloudflared erst nach bewusster Freigabe live schalten

> **Wichtig für diese Umgebung:** Die Domain wird aktuell über **Cloudflared Tunnel** vor den lokalen nginx gelegt.
> Das heißt: Für eine neue Subdomain reicht hier normalerweise **kein separater A-Record-Plan** aus.
> Stattdessen braucht es eine neue Tunnel-/Ingress-Regel plus einen passenden nginx-vHost.

> **Hinweis:** Die Dateien `/etc/nginx/`, die live `cloudflared`-Konfiguration und `/var/www/` werden
> **nicht automatisch geändert** — alles muss manuell und bewusst eingebunden werden.

---

## Design-Entscheidungen

- **Dark-Theme** mit elektrisch-blauem Akzent — passend für tech-/infrastruktur-orientiertes Profil
- **CSS Custom Properties** — leicht umzufärben: einfach `--accent` in `styles.css` ändern
- **Keine externen Dependencies** außer Google Fonts (optional, mit Fallback-Stack)
- **Scroll-Reveal** via `IntersectionObserver` — kein JavaScript-Framework nötig
- **Mobile-first responsive** — Hamburger-Menü ab 768 px Breite
- **Barrierefreiheit**: aria-labels, semantisches HTML, `prefers-reduced-motion` beachtet
