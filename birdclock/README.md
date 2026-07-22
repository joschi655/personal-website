# KooKoo Singvögel — hourly birdsong clock

Twelve native German songbirds, one per hour. On each full hour the matching bird's
recorded song plays — the real recording, the real illustration, just like the
[KooKoo Singvögel](https://www.kookoo.eu) wall clock.

## What's here

| Path | What |
|---|---|
| `index.html` | **Standalone artifact** — fully self-contained, every song + drawing inlined as base64 data URIs. Works offline. Open it in any browser. |
| `birds.json` | Reusable data manifest — hour → bird mapping, names (DE/EN/Latin), and asset paths. Use this to embed the clock in other apps. |
| `assets/audio/NN.mp3` | Trimmed ~8s chime clips (mono, ~48 kbps) — light enough for an hourly chime. |
| `assets/illus/NN.webp` | Optimized bird illustrations (≤480px, WebP). |

The full-length original recordings (30s–5min) are **not** committed here — they total 25 MB.
`birds.json` names each one under `fullRecording` so you can wire them up when you host
the clock yourself.

## Hour mapping

Sequential: hour `N` (1–12) plays bird `N`. `12:00` and `24:00` both play bird 12 (Pirol).
To use a different order, edit the `hour` fields in `birds.json` (or reorder `window.BIRDS`
in `index.html`).

## Using it in another app

The clock reads a global `window.BIRDS` array of `{ hour, de, en, la, img, audio }` where
`img`/`audio` are data URIs (or swap them for real file URLs when you host the assets).
`birds.json` mirrors the same shape with file paths instead of inlined data.

Core logic, in brief:
- one shared `Audio` element, unlocked on the first user gesture (browsers block surprise audio)
- `setInterval` tick updates the hands; on hour rollover it plays `byHour(newHour)` if armed
- click any bird (on the dial or in the index) to hear it and bloom its illustration

## Regenerating the inlined data

The `index.html` embeds `assets/` as base64. To rebuild after changing assets, re-run the
data-generation step (see the personal-website ISA / commit that introduced this) — it reads
`assets/audio/*` + `assets/illus/*` and writes the `window.BIRDS = […]` blob.

## Credit

Illustrations & field recordings © KooKoo Singvögel — <https://www.kookoo.eu>
