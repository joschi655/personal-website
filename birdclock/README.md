# KooKoo Singvögel — hourly birdsong clock

Twelve native German songbirds, one per hour. On each full hour the matching bird's
recorded song plays — the real recording, the real illustration, just like the
[KooKoo Singvögel](https://www.kookoo.eu) wall clock.

## What's here

| Path | What |
|---|---|
| `index.html` | **Standalone clock** — the real KooKoo product photo with live analog hands (same treatment as aiwerke.de/joschi/), an arm-toggle for the hourly chime, and a click-to-hear hour index. Loads assets by relative path — serve the folder from anywhere (`bun dev/serve.ts` → http://127.0.0.1:3800/birdclock/), works offline. |
| `birds.json` | Reusable data manifest — hour → bird mapping, names (DE/EN/Latin), and asset paths. Use this to embed the clock in other apps. |
| `assets/kookoo.webp` | The product photo the hands are overlaid on. |
| `assets/audio/NN.mp3` | Trimmed ~8s chime clips (mono, ~48 kbps) — light enough for an hourly chime. |
| `assets/illus/NN.webp` | Optimized bird illustrations (≤480px, WebP) — not used by `index.html`, kept for other apps. |

The full-length original recordings (30s–5min) are **not** committed here — they total 25 MB.
`birds.json` names each one under `fullRecording` so you can wire them up when you host
the clock yourself.

## Hour mapping

Sequential: hour `N` (1–12) plays bird `N`. `12:00` and `24:00` both play bird 12 (Pirol).
To use a different order, edit the `hour` fields in `birds.json` (or reorder `window.BIRDS`
in `index.html`).

## Using it in another app

Everything is plain files — copy the folder and serve it statically, or lift the pieces:
`birds.json` gives you the hour → bird mapping plus asset paths; the chime files are
`assets/audio/NN.mp3` where `NN` = hour (01–12).

Core logic, in brief (all inside `index.html`, ~60 lines):
- one shared `Audio` element, unlocked on the first user gesture (browsers block surprise audio)
- `setInterval` tick updates the hands; on hour rollover it plays hour `N`'s clip if armed
- click any row in the hour index to hear that bird immediately

## Credit

Illustrations & field recordings © KooKoo Singvögel — <https://www.kookoo.eu>
