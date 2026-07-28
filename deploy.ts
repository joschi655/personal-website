#!/usr/bin/env bun
/**
 * deploy.ts — ship aiwerke.de/joschi/ from this repo to the Ubuntu box.
 *
 *   bun run deploy              # build + static deploy + verify
 *   bun run deploy --dry-run    # print the plan, touch nothing remote
 *   bun run deploy --prune      # also remove webroot files not in the manifest
 *   bun run deploy --api        # deploy api/server.ts + restart joschi-api
 *   bun run deploy --all        # static + api
 *   bun run deploy --verify     # probes only, no upload
 *
 * Design rules (these are why the script exists at all):
 *   - The upload set is an ALLOWLIST. Never rsync the repo root: api/.env, src/,
 *     ISA.md, WORKLOG.md and the deployment notes must never reach a public webroot.
 *   - Never touches nginx or cloudflared. Those are hand-managed, one location block.
 *   - Never touches /etc/joschi-api.env. Secrets live only on the server.
 *   - Verifies by hashing what the live site actually serves, not by trusting rsync.
 */

import { $ } from "bun";
import { existsSync } from "node:fs";

// ---- config (env-overridable so the script isn't welded to one host) ----
const HOST = process.env.JOSCHI_DEPLOY_HOST ?? "ubuntu-tunnel";
const WEBROOT = process.env.JOSCHI_WEBROOT ?? "/var/www/html/joschi";
const API_DIR = process.env.JOSCHI_API_DIR ?? "/opt/joschi-api";
const BASE_URL = process.env.JOSCHI_BASE_URL ?? "https://aiwerke.de/joschi/";
const STAGE = "/tmp/joschi-stage";
const API_STAGE = "/tmp/joschi-api-stage";

/** Everything the public webroot is allowed to contain. Nothing else ships. */
const MANIFEST = ["index.html", "impressum.html", "styles.css", "dist", "assets", "birdclock"];

/**
 * Paths inside a manifest DIRECTORY that must not ship. The manifest is a top-level
 * allowlist, so a directory entry otherwise drags its whole subtree along — including
 * birdclock/README.md and the encoder, which are repo docs and belong nowhere public.
 * Kept in rsync filter syntax; the LEAKS probe below re-checks these over HTTP.
 */
const EXCLUDES = ["birdclock/README.md", "birdclock/tools", "assets/Thumbnail.jpeg"];

/** Files whose live bytes must match local bytes after a deploy. */
const HASH_CHECKS = [
  "index.html",
  "impressum.html",
  "styles.css",
  "dist/app.js",
  "birdclock/index.html",
  "birdclock/birds.json",
  "birdclock/assets/audio/short/06.mp3",
];

// ---- flags ----
const argv = process.argv.slice(2);
const has = (f: string) => argv.includes(f);
if (has("--help") || has("-h")) {
  console.log(
    [
      "usage: bun run deploy [options]",
      "",
      "  --dry-run   print every action, perform no remote writes",
      "  --prune     delete top-level webroot entries not in the manifest",
      "  --api       deploy api/server.ts and restart joschi-api",
      "  --all       static + api",
      "  --verify    run live probes only, no upload",
      "  --no-build  skip the bun build step (use the committed dist/app.js)",
      "",
      `  host=${HOST}  webroot=${WEBROOT}  base=${BASE_URL}`,
    ].join("\n"),
  );
  process.exit(0);
}
const DRY = has("--dry-run");
const PRUNE = has("--prune");
const VERIFY_ONLY = has("--verify");
const DO_API = has("--api") || has("--all");
const DO_STATIC = !has("--api") || has("--all");
const NO_BUILD = has("--no-build");

// ---- tiny output helpers ----
const c = { dim: "\x1b[2m", red: "\x1b[31m", grn: "\x1b[32m", yel: "\x1b[33m", off: "\x1b[0m" };
const step = (m: string) => console.log(`\n${c.yel}▸${c.off} ${m}`);
const ok = (m: string) => console.log(`  ${c.grn}✓${c.off} ${m}`);
const warn = (m: string) => console.log(`  ${c.yel}!${c.off} ${m}`);
const bad = (m: string) => console.log(`  ${c.red}✗${c.off} ${m}`);
const note = (m: string) => console.log(`  ${c.dim}${m}${c.off}`);

let failures = 0;
const fail = (m: string) => {
  bad(m);
  failures++;
};

const sha = async (bytes: ArrayBuffer | Uint8Array | string) =>
  new Bun.CryptoHasher("sha256").update(bytes as never).digest("hex");

/**
 * Cloudflare rewrites HTML in flight (Email Obfuscation is on for this zone), so
 * live HTML is never byte-identical to what we uploaded. Normalise the known
 * transforms away on both sides so the comparison still means something.
 */
const normalizeHtml = (s: string) =>
  s
    .replace(/<script data-cfasync="false" src="\/cdn-cgi\/scripts\/[^"]*email-decode[^"]*"><\/script>/g, "")
    .replace(/<span class="__cf_email__"[^>]*>.*?<\/span>/g, "__EMAIL__")
    .replace(/href="\/cdn-cgi\/l\/email-protection#[0-9a-f]*"/gi, 'href="__EMAIL__"')
    .replace(/href="mailto:[^"]*"/gi, 'href="__EMAIL__"')
    .replace(/>[^<>@\s]+@[^<>\s]+\.[a-z]{2,}</gi, ">__EMAIL__<")
    .trim();

const isHtml = (p: string) => p.endsWith(".html");

// ---- 0. preflight ----
step("preflight");

if (!existsSync("index.html") || !existsSync("src/main.ts")) {
  bad("run this from the repo root (index.html + src/main.ts not found)");
  process.exit(1);
}
for (const item of MANIFEST) {
  if (!existsSync(item)) {
    bad(`manifest entry missing locally: ${item}`);
    process.exit(1);
  }
}
ok(`manifest present: ${MANIFEST.join(" ")}`);

const reachable = await $`ssh -o BatchMode=yes -o ConnectTimeout=20 ${HOST} true`.nothrow().quiet();
if (reachable.exitCode !== 0) {
  bad(`cannot reach ${HOST} over ssh — is cloudflared access working?`);
  process.exit(1);
}
ok(`ssh ${HOST} reachable`);

const dirty = (await $`git status --porcelain`.quiet().text()).trim();
if (dirty) warn(`working tree has uncommitted changes — deploying them anyway:\n${dirty}`);
else ok("working tree clean");

// ---- 1. build ----
if (DO_STATIC && !VERIFY_ONLY && !NO_BUILD) {
  step("build");
  if (DRY) {
    note("would run: bun build src/main.ts --minify --outfile=dist/app.js");
  } else {
    const before = existsSync("dist/app.js") ? await Bun.file("dist/app.js").arrayBuffer() : null;
    const built = await $`bun build src/main.ts --minify --outfile=dist/app.js`.nothrow();
    if (built.exitCode !== 0) {
      bad("bun build failed — aborting before anything touches the server");
      process.exit(1);
    }
    const after = await Bun.file("dist/app.js").arrayBuffer();
    const size = (after.byteLength / 1024).toFixed(2);
    if (before && (await sha(before)) !== (await sha(after))) {
      warn(`dist/app.js changed on rebuild (${size} KB) — the committed bundle was stale`);
    } else {
      ok(`dist/app.js reproducible (${size} KB)`);
    }
  }
}

// ---- 2. static deploy ----
if (DO_STATIC && !VERIFY_ONLY) {
  step(`static → ${HOST}:${WEBROOT}`);

  if (DRY) {
    note(`would rsync ${MANIFEST.join(" ")} → ${HOST}:${STAGE}/`);
    note(`would run: sudo rsync -a ${STAGE}/ ${WEBROOT}/ && chown -R www-data:www-data`);
  } else {
    await $`ssh ${HOST} ${`mkdir -p ${STAGE}`}`.quiet();
    // --delete on the STAGE only: keeps staging identical to the manifest,
    // so a file removed from the repo cannot linger and get re-published.
    // --delete-excluded extends that to EXCLUDES: without it, an excluded path that a
    // previous run had already staged would sit there forever and still get installed.
    const excludeArgs = EXCLUDES.flatMap((p) => ["--exclude", `/${p}`]);
    const up =
      await $`rsync -a --delete --delete-excluded --itemize-changes ${excludeArgs} ${MANIFEST} ${`${HOST}:${STAGE}/`}`.nothrow();
    if (up.exitCode !== 0) {
      bad("rsync to staging failed");
      process.exit(1);
    }
    ok("staged");

    const install = await $`ssh ${HOST} ${
      `sudo rsync -a ${STAGE}/ ${WEBROOT}/ && sudo chown -R www-data:www-data ${WEBROOT} && sudo find ${WEBROOT} -type f -exec chmod 644 {} + && sudo find ${WEBROOT} -type d -exec chmod 755 {} +`
    }`.nothrow();
    if (install.exitCode !== 0) {
      bad("install into webroot failed");
      process.exit(1);
    }
    ok(`installed into ${WEBROOT} (www-data, 644/755)`);
  }

  // ---- 2b. prune strays ----
  const listing = (await $`ssh ${HOST} ${`ls -1 ${WEBROOT}`}`.quiet().text())
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const strays = listing.filter((entry) => !MANIFEST.includes(entry));

  if (strays.length === 0) {
    ok("no stray files in webroot");
  } else if (!PRUNE) {
    warn(`webroot carries ${strays.length} file(s) not in the manifest: ${strays.join(", ")}`);
    note("these are publicly reachable — re-run with --prune to remove them");
  } else if (DRY) {
    note(`would remove from webroot: ${strays.join(", ")}`);
  } else {
    for (const s of strays) {
      // Guard: only ever removes a direct child of the webroot, never a path fragment.
      if (s.includes("/") || s === "." || s === "..") continue;
      await $`ssh ${HOST} ${`sudo rm -rf ${WEBROOT}/${s}`}`.quiet();
    }
    ok(`pruned: ${strays.join(", ")}`);
  }
}

// ---- 3. api deploy ----
if (DO_API && !VERIFY_ONLY) {
  step(`api → ${HOST}:${API_DIR}`);
  if (DRY) {
    note(`would rsync api/server.ts → ${HOST}:${API_DIR}/ then restart joschi-api`);
  } else {
    // api/.env is gitignored and deliberately absent from this list. Secrets stay
    // in /etc/joschi-api.env on the server; this script never reads or writes it.
    await $`ssh ${HOST} ${`mkdir -p ${API_STAGE}`}`.quiet();
    await $`rsync -a api/server.ts api/joschi-api.service ${`${HOST}:${API_STAGE}/`}`;
    await $`ssh ${HOST} ${
      `sudo mkdir -p ${API_DIR} && sudo cp ${API_STAGE}/server.ts ${API_DIR}/ && sudo systemctl restart joschi-api`
    }`;
    ok("server.ts installed, joschi-api restarted");
    await Bun.sleep(1500);
  }
}

// ---- 4. verify against what the live site actually serves ----
step("verify (live)");

const fetchLive = async (path: string) => {
  const url = new URL(path, BASE_URL).href;
  try {
    const res = await fetch(`${url}?cachebust=${Date.now()}`, {
      signal: AbortSignal.timeout(20_000),
      headers: { "cache-control": "no-cache" },
    });
    return res;
  } catch (err) {
    return null;
  }
};

if (DRY) {
  note(`would probe ${BASE_URL}, api/health, api/coffee and hash ${HASH_CHECKS.join(", ")}`);
} else {
  const root = await fetchLive("");
  if (root?.status === 200) ok(`${BASE_URL} → 200`);
  else fail(`${BASE_URL} → ${root?.status ?? "no response"}`);

  for (const file of HASH_CHECKS) {
    const res = await fetchLive(file);
    if (!res || res.status !== 200) {
      fail(`${file} → ${res?.status ?? "no response"}`);
      continue;
    }
    const live = isHtml(file)
      ? await sha(normalizeHtml(await res.text()))
      : await sha(await res.arrayBuffer());
    const local = isHtml(file)
      ? await sha(normalizeHtml(await Bun.file(file).text()))
      : await sha(await Bun.file(file).arrayBuffer());
    const how = isHtml(file) ? "matches local (cf-email-obfuscation normalised)" : "byte-identical to local";
    if (live === local) ok(`${file} ${how}`);
    else fail(`${file} differs from local (live ${live.slice(0, 12)} vs local ${local.slice(0, 12)})`);
  }

  // The bundle references in the live HTML must match the local cache-bust values,
  // otherwise visitors keep getting a stale styles.css/app.js out of cache.
  const liveHtml = await (await fetchLive("index.html"))?.text();
  const localHtml = await Bun.file("index.html").text();
  for (const asset of ["styles.css", "dist/app.js"]) {
    const v = localHtml.match(new RegExp(`${asset.replace(/[./]/g, "\\$&")}\\?v=(\\d+)`))?.[1];
    if (!v) continue;
    if (liveHtml?.includes(`${asset}?v=${v}`)) ok(`cache-bust ${asset}?v=${v} live`);
    else fail(`cache-bust for ${asset} not live (expected ?v=${v})`);
  }

  const health = await fetchLive("api/health");
  const healthBody = health ? ((await health.json().catch(() => null)) as { ok?: boolean; version?: string } | null) : null;
  if (healthBody?.ok) ok(`api/health → ok, version ${healthBody.version}`);
  else fail(`api/health → ${health?.status ?? "no response"}`);

  const teapot = await fetchLive("api/coffee");
  if (teapot?.status === 418) ok("api/coffee → 418, still a teapot");
  else fail(`api/coffee → ${teapot?.status ?? "no response"} (expected 418)`);

  // Anti-check: nothing that isn't in the manifest may be reachable.
  const LEAKS = [
    "deployment-notes.md",
    "nginx-snippet.conf",
    "README.md",
    "ISA.md",
    "WORKLOG.md",
    "package.json",
    "deploy.ts",
    "script.js",
    // birdclock/ ships as a whole directory, so its docs are only kept out by EXCLUDES —
    // probe them, or the exclusion is a claim rather than a fact.
    "birdclock/README.md",
    "birdclock/tools/encode.ts",
  ];
  for (const leak of LEAKS) {
    const res = await fetchLive(leak);
    if (!res || res.status !== 200) continue;
    // A 200 can be a stale Cloudflare edge object for a file already gone at origin.
    if (res.headers.get("cf-cache-status") === "HIT") {
      warn(`${leak} still served from the Cloudflare edge cache (age ${res.headers.get("age") ?? "?"}s) — gone at origin, expires on its own`);
    } else {
      fail(`${leak} is publicly served from origin — run with --prune`);
    }
  }
  if (failures === 0) ok("no repo docs reachable from the origin webroot");
}

// ---- done ----
console.log("");
if (DRY) {
  console.log(`${c.dim}dry run — nothing was written to ${HOST}${c.off}`);
  process.exit(0);
}
if (failures > 0) {
  console.log(`${c.red}deploy finished with ${failures} failed probe(s)${c.off}`);
  process.exit(1);
}
console.log(`${c.grn}deployed and verified → ${BASE_URL}${c.off}`);
