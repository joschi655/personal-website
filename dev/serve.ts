// local dev server: serves the static site AND proxies api/* → 127.0.0.1:31890
// usage: bun api/server.ts &  then  bun dev/serve.ts  → http://localhost:3800
import { join, normalize } from "path";

const ROOT = normalize(join(import.meta.dir, ".."));
const API = "http://127.0.0.1:31890";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
};

Bun.serve({
  port: 3800,
  hostname: "127.0.0.1",
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;

    if (path.startsWith("/api/")) {
      try {
        return await fetch(API + path.slice(4) + url.search, { method: req.method });
      } catch {
        return new Response(JSON.stringify({ unavailable: true }), {
          status: 200, headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (path === "/") path = "/index.html";
    const file = Bun.file(join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, "")));
    if (!(await file.exists())) return new Response("404", { status: 404 });
    const ext = path.slice(path.lastIndexOf("."));
    return new Response(file, { headers: { "Content-Type": TYPES[ext] ?? "application/octet-stream" } });
  },
});

console.log("dev server → http://127.0.0.1:3800 (api proxied to :31890)");
