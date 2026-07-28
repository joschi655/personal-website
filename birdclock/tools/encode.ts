#!/usr/bin/env bun
/**
 * encode.ts — turn the KooKoo master recordings into the two web tiers the clock plays.
 *
 *   bun birdclock/tools/encode.ts --src "/path/to/12xSV Recordings"
 *   bun birdclock/tools/encode.ts --src ... --dry-run
 *
 * Masters are the 12 stereo 128 kbps CD rips (49 s – 302 s, 26 MB total). They are NOT
 * committed — they live in "12xSV Recordings-*.zip". Only the encoded tiers ship.
 *
 * Two tiers, because the player's duration setting shouldn't cost bandwidth it doesn't use:
 *   assets/audio/short/NN.mp3  33 s  — serves the 10 s and 30 s settings
 *   assets/audio/full/NN.mp3   full  — serves the "full length" setting
 *
 * Per file, in order:
 *   1. trim leading silence — masters idle 0.5–2.4 s before the first note, which on an
 *      hourly chime reads as "the clock is broken", and eats a third of a 10 s cut.
 *   2. align loudness — masters span -8.0 to -16.7 LUFS. Left alone, Fitis is 9 dB louder
 *      than Blaukehlchen and the clock lurches hour to hour. Gain-only (no compression),
 *      so the 6.6–21.1 LU of natural dynamics inside each recording survive intact.
 *   3. limiter at -0.9 dBFS — catches peaks the gain step pushes up. Should rarely engage.
 *
 * No fades are baked in: the player fades in software, so it can cut at 10 s or 30 s or
 * the natural end with the same curve. Baking one here would double it.
 */

import { $ } from "bun";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const OUT_SHORT = "birdclock/assets/audio/short";
const OUT_FULL = "birdclock/assets/audio/full";

/** Seconds in the short tier. The player's longest short cut is 30 s and it fades over
 *  the 1.8 s before that — 33 s leaves the fade room to land before the file runs out. */
const SHORT_SECONDS = 33;

/** Broadcast-ish target. Everything lands within ~1 LU of everything else. */
const TARGET_LUFS = -14;

/** VBR ~80 kbps joint stereo. Birdsong is high-frequency-dense and smears below this;
 *  above it, the near-mono field recordings gain nothing audible. */
const LAME_QUALITY = 7;

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry-run");
const srcArg = argv[argv.indexOf("--src") + 1];

if (!srcArg || srcArg.startsWith("--")) {
  console.error('usage: bun birdclock/tools/encode.ts --src "/path/to/12xSV Recordings" [--dry-run]');
  process.exit(1);
}
if (!existsSync(srcArg)) {
  console.error(`source dir not found: ${srcArg}`);
  process.exit(1);
}
if (!existsSync("birdclock/index.html")) {
  console.error("run this from the repo root");
  process.exit(1);
}

const c = { dim: "\x1b[2m", red: "\x1b[31m", grn: "\x1b[32m", yel: "\x1b[33m", off: "\x1b[0m" };
const ok = (m: string) => console.log(`  ${c.grn}✓${c.off} ${m}`);
const bad = (m: string) => console.log(`  ${c.red}✗${c.off} ${m}`);

/**
 * The zip stores umlauts in a legacy codepage, so extracted names differ per extractor
 * ("Mönchsgrasmücke" arrives NFD, mangled, or both). Match on the ASCII "SV NN " prefix
 * only — that part is stable no matter how the filename got decoded.
 */
const masters = new Map<number, string>();
for (const name of readdirSync(srcArg)) {
  const m = /^SV (\d{2}) /.exec(name.normalize("NFC"));
  if (m && name.toLowerCase().endsWith(".mp3")) masters.set(Number(m[1]), join(srcArg, name));
}

const missing = Array.from({ length: 12 }, (_, i) => i + 1).filter((h) => !masters.has(h));
if (missing.length) {
  bad(`no master for hour(s): ${missing.join(", ")} — found ${masters.size} of 12 in ${srcArg}`);
  process.exit(1);
}
ok(`12 masters found in ${srcArg}`);

/** Integrated loudness, from ebur128's end-of-run summary. */
async function integratedLufs(file: string): Promise<number> {
  const out = await $`ffmpeg -hide_banner -nostats -i ${file} -af ebur128=framelog=quiet -f null -`
    .nothrow()
    .quiet();
  const text = out.stderr.toString() + out.stdout.toString();
  const m = /Integrated loudness:[\s\S]*?I:\s*(-?[\d.]+)\s*LUFS/.exec(text);
  if (!m) throw new Error(`could not measure loudness of ${file}`);
  return Number(m[1]);
}

const pad = (n: number) => String(n).padStart(2, "0");

if (!DRY) await $`mkdir -p ${OUT_SHORT} ${OUT_FULL}`.quiet();

let bytesShort = 0;
let bytesFull = 0;

for (let hour = 1; hour <= 12; hour++) {
  const src = masters.get(hour)!;
  const lufs = await integratedLufs(src);
  const gain = (TARGET_LUFS - lufs).toFixed(2);

  // Order matters. Gain comes first so the trim threshold is measured against the levels
  // that actually ship — trimming first lets a -6 dB master keep a head that only drops
  // under the threshold afterwards, which reads as a late, hesitant start. Limiter last,
  // so it is the only thing that can touch a peak after everything else is done.
  const chain = [
    `volume=${gain}dB`,
    "silenceremove=start_periods=1:start_duration=0:start_threshold=-50dB:start_silence=0.15:detection=peak",
    "alimiter=limit=0.9:level=disabled",
  ].join(",");

  const shortOut = `${OUT_SHORT}/${pad(hour)}.mp3`;
  const fullOut = `${OUT_FULL}/${pad(hour)}.mp3`;

  if (DRY) {
    console.log(`  ${c.dim}${pad(hour)}  ${lufs.toFixed(1)} LUFS → gain ${gain} dB → ${shortOut}, ${fullOut}${c.off}`);
    continue;
  }

  for (const [out, limit] of [
    [fullOut, null],
    [shortOut, SHORT_SECONDS],
  ] as const) {
    const args = ["-v", "error", "-y", "-i", src, "-vn", "-af", chain];
    if (limit) args.push("-t", String(limit));
    args.push("-c:a", "libmp3lame", "-q:a", String(LAME_QUALITY), "-joint_stereo", "1", "-map_metadata", "-1", out);
    const r = await $`ffmpeg ${args}`.nothrow();
    if (r.exitCode !== 0) {
      bad(`ffmpeg failed on ${src} → ${out}`);
      process.exit(1);
    }
  }

  const sShort = Bun.file(shortOut).size;
  const sFull = Bun.file(fullOut).size;
  bytesShort += sShort;
  bytesFull += sFull;
  ok(
    `${pad(hour)}  ${lufs.toFixed(1)} LUFS ${gain.startsWith("-") ? "" : "+"}${gain} dB  ` +
      `short ${(sShort / 1024).toFixed(0)} KB · full ${(sFull / 1024 / 1024).toFixed(2)} MB`,
  );
}

if (!DRY) {
  console.log("");
  ok(`short tier ${(bytesShort / 1024 / 1024).toFixed(2)} MB · full tier ${(bytesFull / 1024 / 1024).toFixed(2)} MB`);
}
