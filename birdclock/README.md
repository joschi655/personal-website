# KooKoo Singvögel — hourly birdsong clock

Twelve native German songbirds, one per hour. On each full hour the matching bird's
recorded song plays — the real recording, the real illustration, just like the
[KooKoo Singvögel](https://www.kookoo.eu) wall clock.

Live: <https://aiwerke.de/joschi/birdclock/>

## What's here

| Path | What |
|---|---|
| `index.html` | **Standalone clock** — the real KooKoo product photo with live analog hands (same treatment as aiwerke.de/joschi/), an arm-toggle for the hourly chime, a song-length selector, and a click-to-hear hour index. Loads assets by relative path — serve the folder from anywhere (`bun dev/serve.ts` → http://127.0.0.1:3800/birdclock/), works offline. |
| `birds.json` | Reusable data manifest — hour → bird mapping, names (DE/EN/Latin), and asset paths for all three audio tiers. Use this to embed the clock in other apps. |
| `assets/kookoo.webp` | The product photo the hands are overlaid on. |
| `assets/audio/NN.mp3` | Legacy 8 s chime clips (mono, ~48 kbps, fade baked in). Kept for embedders that just want a doorbell — `index.html` no longer uses them. |
| `assets/audio/short/NN.mp3` | 33 s cuts (joint stereo, VBR ~80 kbps). Serves the 10 s and 30 s settings. 2.9 MB for all twelve. |
| `assets/audio/full/NN.mp3` | The whole recording, 48 s–300 s. Serves the "full" setting. 11.8 MB for all twelve. |
| `assets/illus/NN.webp` | Optimized bird illustrations (≤480px, WebP) — not used by `index.html`, kept for other apps. |
| `tools/encode.ts` | Regenerates `short/` and `full/` from the master recordings. |

## Song length

The clock plays **10 s**, **30 s**, or the **full recording**, chosen in the UI and
remembered in `localStorage` under `kookoo.length`. Every cut fades in (0.25 s) and out,
so nothing ever stops mid-note:

| Setting | Reads from | Fade-out |
|---|---|---|
| 10 s | `short/` | 1.8 s |
| 30 s | `short/` | 1.8 s |
| full | `full/` | 2.5 s, landing on the recording's own ending |
| interrupted | — | 0.35 s |

Two tiers rather than one because the setting shouldn't cost bandwidth it doesn't use: at
10 s the page would otherwise pull a 5-minute file. Browsers range-request these, so a
short cut only fetches the front of the file either way.

**Fades are done in software, not baked into the audio** — that's what lets one asset
serve both the 10 s and 30 s cuts with the same curve. Consequence: don't add a fade in
`encode.ts` or you'll hear it twice.

The fade runs through a Web Audio `GainNode`, not `audio.volume`. iOS ignores writes to
`HTMLMediaElement.volume` outright, so the element-volume version of this is silent on
every iPhone; element volume is only the fallback if the graph can't be built.

## Night quiet

The wall clock has a photoresistor and stays silent in a dark room. This one computes the
dark instead — it only sings by itself when **the sun is up** *and* the local hour is
between **07:00 and 22:00**.

The awake window isn't redundant. At midsummer here the sun is up at 05:14 and still up at
21:19, so a pure daylight rule would put a Nightingale in the bedroom at five in the
morning; the hardware would happily do exactly that. In December the two rules meet from
the other side and the clock sings from 09:00 to 16:00, which is what a light sensor in a
north-facing room does anyway.

**A click always plays.** Hour rows and the arm button are deliberate, so they sing at any
hour. Only the automatic hourly song is held back — and the hands, the readout and the
hour index keep running through the night regardless.

Sunrise and sunset come from the NOAA solar equations, computed in the page: no request,
no API key, still correct offline. Latitude is the clock's home (48.14° N); longitude is
the home meridian for visitors on the same standard offset and the timezone's own meridian
otherwise, which lands within a quarter hour everywhere except Spain. Accuracy against
published Munich times is within 2 minutes across the year — well inside the one-hour
granularity of the decision.

Where a browser exposes `AmbientLightSensor` **and it has already been granted**, a reading
under 8 lux also counts as dark; nothing ever prompts for it. That signal may only add
quiet, never cancel it — a dark room at noon is still a dark room, but a lit room at 03:00
is not a reason to wake the house.

## Regenerating the audio

The masters are the twelve stereo 128 kbps CD rips in `12xSV Recordings-*.zip`
(26 MB, **not committed**). With them extracted somewhere:

```bash
bun birdclock/tools/encode.ts --src "/path/to/12xSV Recordings" [--dry-run]
```

Per file it trims leading silence, aligns loudness, and writes both tiers. Two things
that matter and aren't obvious:

- **The masters idle 0.5–2.4 s before the first note.** On an hourly chime that reads as
  a broken clock, and it ate a quarter of a 10 s cut. Now trimmed to 0.15 s of room tone.
- **The masters span -8.0 to -16.7 LUFS** — Fitis was 9 dB louder than Blaukehlchen, so
  the clock lurched hour to hour. All twelve now sit within 0.2 LU of -14 LUFS, by gain
  only, so the 6.6–21.1 LU of dynamics inside each recording survive.

Gain is applied *before* the silence trim. The other order looks equivalent and isn't: a
master getting -6 dB keeps a head that only falls under the trim threshold afterwards,
and starts late.

Two birds (`03` Mönchsgrasmücke, `05` Rotkehlchen) still open with ~2 s of soft ambience
before a strong note. That's the recording, not a trim bug — the ambience is real audio
well above the silence threshold, and cutting to the first loud note would behead them.

The zip stores umlauts in a legacy codepage, so `unzip` may fail on the filenames outright
(`bsdtar -xf` handles it). The encoder matches on the ASCII `SV NN ` prefix for that reason.

## Hour mapping

Sequential: hour `N` (1–12) plays bird `N`. `12:00` and `24:00` both play bird 12 (Pirol).
To use a different order, edit the `hour` fields in `birds.json` (or reorder `BIRDS`
in `index.html`).

## Using it in another app

Everything is plain files — copy the folder and serve it statically, or lift the pieces:
`birds.json` gives you the hour → bird mapping plus the path to each tier.

Core logic, in brief (all inside `index.html`):
- one shared `Audio` element routed through a `GainNode` — `createMediaElementSource` is
  once-per-element, which is why there's exactly one
- the graph is built lazily on the first user gesture (browsers block surprise audio, and
  iOS needs the `AudioContext` resumed from inside one)
- one `requestAnimationFrame` loop does everything: fade curve, cut point, progress bar.
  Interrupting is that same loop with a nearer end point, not a separate code path.
- `setInterval` tick updates the hands; on hour rollover it plays hour `N` if armed and
  `quietAt(now)` is false — see **Night quiet** above. `nextHour(state)` walks the next 24
  hour marks through the same predicate, which is where "resting until 07:00" comes from,
  so the label can never disagree with the behaviour

## Deploying

Ships with the site: `birdclock` is in `deploy.ts`'s `MANIFEST`. Note that `README.md`
and `tools/` are in `EXCLUDES` — the manifest is a top-level allowlist, so a directory
entry otherwise drags its whole subtree into a public webroot. The deploy's own probes
re-check that both are unreachable.

## Credit

Illustrations & field recordings © KooKoo Singvögel — <https://www.kookoo.eu>
