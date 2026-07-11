import { hostname as getHostname, uptime as getLocalUptime } from "node:os";
import { join as joinPath } from "node:path";

type SpotifyRange = "short_term" | "medium_term" | "long_term";

interface HealthResponse {
  ok: true;
  version: string;
}

interface ArtistSummary {
  name: string;
  url: string;
}

interface TrackSummary {
  name: string;
  artist: string;
  url: string;
}

interface MusicPayload {
  range: SpotifyRange;
  artists: ArtistSummary[];
  tracks: TrackSummary[];
  fetched_at: string;
}

interface StatusPayload {
  uptime_seconds: number;
  hostname: string;
}

interface GitHubPayload {
  repo: string;
  type: string;
  created_at: string;
}

interface UnavailableResponse {
  unavailable: true;
}

interface ErrorResponse {
  error: string;
  hint?: string;
  rfc?: string;
}

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface SpotifyTopArtistItem {
  name: string;
  external_urls: {
    spotify: string;
  };
}

interface SpotifyTopArtistsResponse {
  items: SpotifyTopArtistItem[];
}

interface SpotifyTrackArtist {
  name: string;
}

interface SpotifyTopTrackItem {
  name: string;
  artists: SpotifyTrackArtist[];
  external_urls: {
    spotify: string;
  };
}

interface SpotifyTopTracksResponse {
  items: SpotifyTopTrackItem[];
}

interface GitHubEvent {
  repo: {
    name: string;
  };
  type: string;
  created_at: string;
}

interface CachedValue<T> {
  value: T;
  fetchedAtMs: number;
}

interface SpotifyTokenCache {
  accessToken: string;
  expiresAtMs: number;
}

const VERSION = "2.0.0";
const HOSTNAME = "127.0.0.1";
const DEFAULT_PORT = 31890;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const MUSIC_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const GITHUB_CACHE_TTL_MS = 10 * 60 * 1000;
const SPOTIFY_TOKEN_RENEW_SKEW_MS = 30_000;
const EXTERNAL_FETCH_TIMEOUT_MS = 8_000;
const ALLOWED_RANGES: ReadonlySet<SpotifyRange> = new Set([
  "short_term",
  "medium_term",
  "long_term",
]);

const spotifyMusicCache = new Map<SpotifyRange, CachedValue<MusicPayload>>();
const githubCache = new Map<"latest", CachedValue<GitHubPayload>>();
const rateLimitEntries = new Map<string, number[]>();

let spotifyTokenCache: SpotifyTokenCache | null = null;

function parsePort(rawPort: string | undefined): number {
  if (typeof rawPort === "string") {
    const parsed = Number.parseInt(rawPort, 10);

    if (Number.isInteger(parsed) && parsed > 0 && parsed <= 65535) {
      return parsed;
    } else {
      return DEFAULT_PORT;
    }
  } else {
    return DEFAULT_PORT;
  }
}

function buildBaseHeaders(cacheControl: string): Headers {
  return new Headers({
    "Access-Control-Allow-Origin": "https://aiwerke.de",
    "Cache-Control": cacheControl,
    "Content-Type": "application/json",
    "Cross-Origin-Resource-Policy": "same-site",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  });
}

function jsonResponse(
  body: HealthResponse | MusicPayload | StatusPayload | GitHubPayload | UnavailableResponse | ErrorResponse,
  status: number,
  cacheControl: string,
  extraHeaders?: HeadersInit,
): Response {
  const headers = buildBaseHeaders(cacheControl);

  if (extraHeaders) {
    const mergedHeaders = new Headers(extraHeaders);
    for (const [key, value] of mergedHeaders.entries()) {
      headers.set(key, value);
    }
  } else {
    // Intentional: no extra headers to merge for this response.
  }

  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}

function healthResponse(): Response {
  return jsonResponse({ ok: true, version: VERSION }, 200, "no-store");
}

function teapotResponse(): Response {
  return jsonResponse(
    {
      error: "I'm a teapot",
      rfc: "2324",
      hint: "try `sudo hire oskar` instead",
    },
    418,
    "public, max-age=300",
  );
}

function notFoundResponse(): Response {
  return jsonResponse(
    { error: "not found", hint: "/health /music /status /github" },
    404,
    "public, max-age=300",
  );
}

function methodNotAllowedResponse(): Response {
  return jsonResponse(
    { error: "method not allowed" },
    405,
    "public, max-age=300",
    { Allow: "GET" },
  );
}

function rateLimitedResponse(): Response {
  return jsonResponse({ error: "rate limit exceeded" }, 429, "public, max-age=300");
}

function unavailableResponse(): Response {
  return jsonResponse({ unavailable: true }, 200, "public, max-age=300");
}

function internalErrorResponse(): Response {
  return jsonResponse({ unavailable: true }, 200, "public, max-age=300");
}

function getClientIp(request: Request, server: Bun.Server): string {
  // behind Cloudflare: CF-Connecting-IP is set by the edge and not client-spoofable.
  // XFF leftmost IS client-spoofable (rate-limit bypass) — Cloudflare appends the
  // real client as the LAST entry before nginx, so fall back to that end.
  const cfIp = request.headers.get("cf-connecting-ip");
  if (typeof cfIp === "string" && cfIp.length > 0) {
    return cfIp.trim();
  }

  const forwardedFor = request.headers.get("x-forwarded-for");

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    const parts = forwardedFor.split(",").map((p) => p.trim()).filter((p) => p.length > 0);
    const lastValue = parts[parts.length - 1];

    if (typeof lastValue === "string" && lastValue.length > 0) {
      return lastValue;
    } else {
      const remoteAddress = server.requestIP(request);

      if (remoteAddress && typeof remoteAddress.address === "string" && remoteAddress.address.length > 0) {
        return remoteAddress.address;
      } else {
        return "unknown";
      }
    }
  } else {
    const remoteAddress = server.requestIP(request);

    if (remoteAddress && typeof remoteAddress.address === "string" && remoteAddress.address.length > 0) {
      return remoteAddress.address;
    } else {
      return "unknown";
    }
  }
}

function pruneRateWindow(nowMs: number): void {
  for (const [ip, timestamps] of rateLimitEntries.entries()) {
    const recentTimestamps = timestamps.filter((timestamp) => nowMs - timestamp < RATE_LIMIT_WINDOW_MS);

    if (recentTimestamps.length > 0) {
      rateLimitEntries.set(ip, recentTimestamps);
    } else {
      rateLimitEntries.delete(ip);
    }
  }
}

function isRateLimited(ip: string, nowMs: number): boolean {
  pruneRateWindow(nowMs);
  const timestamps = rateLimitEntries.get(ip) ?? [];

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitEntries.set(ip, timestamps);
    return true;
  } else {
    timestamps.push(nowMs);
    rateLimitEntries.set(ip, timestamps);
    return false;
  }
}

function getValidatedRange(rawRange: string | null): SpotifyRange {
  if (rawRange && ALLOWED_RANGES.has(rawRange as SpotifyRange)) {
    return rawRange as SpotifyRange;
  } else {
    return "medium_term";
  }
}

function getFreshCacheValue<T>(cacheEntry: CachedValue<T> | undefined, ttlMs: number, nowMs: number): T | null {
  if (cacheEntry && nowMs - cacheEntry.fetchedAtMs < ttlMs) {
    return cacheEntry.value;
  } else {
    return null;
  }
}

function getStaleMusicCache(range: SpotifyRange): MusicPayload | null {
  const cacheEntry = spotifyMusicCache.get(range);

  if (cacheEntry) {
    return cacheEntry.value;
  } else {
    return null;
  }
}

function parseSpotifyTokenResponse(payload: unknown): SpotifyTokenResponse | null {
  if (typeof payload === "object" && payload !== null) {
    const candidate = payload as Record<string, unknown>;

    if (
      typeof candidate.access_token === "string" &&
      typeof candidate.token_type === "string" &&
      typeof candidate.expires_in === "number"
    ) {
      const refreshToken =
        typeof candidate.refresh_token === "string" ? candidate.refresh_token : undefined;

      return {
        access_token: candidate.access_token,
        token_type: candidate.token_type,
        expires_in: candidate.expires_in,
        refresh_token: refreshToken,
      };
    } else {
      return null;
    }
  } else {
    return null;
  }
}

function parseSpotifyArtistsResponse(payload: unknown): SpotifyTopArtistsResponse | null {
  if (typeof payload === "object" && payload !== null) {
    const candidate = payload as Record<string, unknown>;

    if (Array.isArray(candidate.items)) {
      const items = candidate.items;
      const normalizedItems: SpotifyTopArtistItem[] = [];

      for (const item of items) {
        if (typeof item === "object" && item !== null) {
          const artist = item as Record<string, unknown>;
          const externalUrls = artist.external_urls;

          if (
            typeof artist.name === "string" &&
            typeof externalUrls === "object" &&
            externalUrls !== null &&
            typeof (externalUrls as Record<string, unknown>).spotify === "string"
          ) {
            normalizedItems.push({
              name: artist.name,
              external_urls: {
                spotify: (externalUrls as Record<string, unknown>).spotify as string,
              },
            });
          } else {
            return null;
          }
        } else {
          return null;
        }
      }

      return { items: normalizedItems };
    } else {
      return null;
    }
  } else {
    return null;
  }
}

function parseSpotifyTracksResponse(payload: unknown): SpotifyTopTracksResponse | null {
  if (typeof payload === "object" && payload !== null) {
    const candidate = payload as Record<string, unknown>;

    if (Array.isArray(candidate.items)) {
      const items = candidate.items;
      const normalizedItems: SpotifyTopTrackItem[] = [];

      for (const item of items) {
        if (typeof item === "object" && item !== null) {
          const track = item as Record<string, unknown>;
          const externalUrls = track.external_urls;
          const artists = track.artists;

          if (
            typeof track.name === "string" &&
            typeof externalUrls === "object" &&
            externalUrls !== null &&
            typeof (externalUrls as Record<string, unknown>).spotify === "string" &&
            Array.isArray(artists)
          ) {
            const normalizedArtists: SpotifyTrackArtist[] = [];

            for (const artist of artists) {
              if (typeof artist === "object" && artist !== null && typeof (artist as Record<string, unknown>).name === "string") {
                normalizedArtists.push({ name: (artist as Record<string, unknown>).name as string });
              } else {
                return null;
              }
            }

            normalizedItems.push({
              name: track.name,
              artists: normalizedArtists,
              external_urls: {
                spotify: (externalUrls as Record<string, unknown>).spotify as string,
              },
            });
          } else {
            return null;
          }
        } else {
          return null;
        }
      }

      return { items: normalizedItems };
    } else {
      return null;
    }
  } else {
    return null;
  }
}

function parseGitHubEventsResponse(payload: unknown): GitHubEvent[] | null {
  if (Array.isArray(payload)) {
    const normalizedEvents: GitHubEvent[] = [];

    for (const item of payload) {
      if (typeof item === "object" && item !== null) {
        const event = item as Record<string, unknown>;
        const repo = event.repo;

        if (
          typeof event.type === "string" &&
          typeof event.created_at === "string" &&
          typeof repo === "object" &&
          repo !== null &&
          typeof (repo as Record<string, unknown>).name === "string"
        ) {
          normalizedEvents.push({
            repo: { name: (repo as Record<string, unknown>).name as string },
            type: event.type,
            created_at: event.created_at,
          });
        } else {
          return null;
        }
      } else {
        return null;
      }
    }

    return normalizedEvents;
  } else {
    return null;
  }
}

async function parseJsonSafely(response: Response): Promise<unknown | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getSpotifyBasicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

async function renewSpotifyAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  const nowMs = Date.now();

  if (
    spotifyTokenCache &&
    spotifyTokenCache.expiresAtMs > nowMs + SPOTIFY_TOKEN_RENEW_SKEW_MS
  ) {
    return spotifyTokenCache.accessToken;
  } else if (
    typeof clientId === "string" &&
    clientId.length > 0 &&
    typeof clientSecret === "string" &&
    clientSecret.length > 0 &&
    typeof refreshToken === "string" &&
    refreshToken.length > 0
  ) {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          Authorization: getSpotifyBasicAuthHeader(clientId, clientSecret),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
        signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
      });

      if (response.ok) {
        const payload = await parseJsonSafely(response);
        const tokenResponse = parseSpotifyTokenResponse(payload);

        if (tokenResponse) {
          spotifyTokenCache = {
            accessToken: tokenResponse.access_token,
            expiresAtMs: nowMs + tokenResponse.expires_in * 1000,
          };

          return spotifyTokenCache.accessToken;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } catch {
      return null;
    }
  } else {
    return null;
  }
}

async function fetchSpotifyArtists(accessToken: string, range: SpotifyRange): Promise<SpotifyTopArtistsResponse | null> {
  const url = new URL("https://api.spotify.com/v1/me/top/artists");
  url.searchParams.set("time_range", range);
  url.searchParams.set("limit", "3");

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
    });

    if (response.ok) {
      const payload = await parseJsonSafely(response);
      return parseSpotifyArtistsResponse(payload);
    } else {
      return null;
    }
  } catch {
    return null;
  }
}

async function fetchSpotifyTracks(accessToken: string, range: SpotifyRange): Promise<SpotifyTopTracksResponse | null> {
  const url = new URL("https://api.spotify.com/v1/me/top/tracks");
  url.searchParams.set("time_range", range);
  url.searchParams.set("limit", "3");

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
    });

    if (response.ok) {
      const payload = await parseJsonSafely(response);
      return parseSpotifyTracksResponse(payload);
    } else {
      return null;
    }
  } catch {
    return null;
  }
}

function shapeMusicPayload(
  range: SpotifyRange,
  artistsResponse: SpotifyTopArtistsResponse,
  tracksResponse: SpotifyTopTracksResponse,
  fetchedAtIso: string,
): MusicPayload | null {
  const artists = artistsResponse.items.slice(0, 3).map((artist) => ({
    name: artist.name,
    url: artist.external_urls.spotify,
  }));

  const tracks: TrackSummary[] = [];

  for (const track of tracksResponse.items.slice(0, 3)) {
    const primaryArtist = track.artists[0];

    if (primaryArtist && typeof primaryArtist.name === "string") {
      tracks.push({
        name: track.name,
        artist: primaryArtist.name,
        url: track.external_urls.spotify,
      });
    } else {
      return null;
    }
  }

  return {
    range,
    artists,
    tracks,
    fetched_at: fetchedAtIso,
  };
}

async function getMusicPayload(range: SpotifyRange): Promise<MusicPayload | null> {
  const nowMs = Date.now();
  const freshCache = getFreshCacheValue(spotifyMusicCache.get(range), MUSIC_CACHE_TTL_MS, nowMs);

  if (freshCache) {
    return freshCache;
  } else {
    const accessToken = await renewSpotifyAccessToken();

    if (typeof accessToken === "string" && accessToken.length > 0) {
      const artistsResponse = await fetchSpotifyArtists(accessToken, range);
      const tracksResponse = await fetchSpotifyTracks(accessToken, range);

      if (artistsResponse && tracksResponse) {
        const fetchedAtIso = new Date(nowMs).toISOString();
        const payload = shapeMusicPayload(range, artistsResponse, tracksResponse, fetchedAtIso);

        if (payload) {
          spotifyMusicCache.set(range, { value: payload, fetchedAtMs: nowMs });
          return payload;
        } else {
          return getStaleMusicCache(range);
        }
      } else {
        return getStaleMusicCache(range);
      }
    } else {
      return getStaleMusicCache(range);
    }
  }
}

async function getStatusPayload(): Promise<StatusPayload> {
  const procUptimePath = joinPath("/", "proc", "uptime");

  try {
    const uptimeText = await Bun.file(procUptimePath).text();
    const firstValue = uptimeText.trim().split(/\s+/)[0];
    const parsedValue = Number.parseFloat(firstValue);

    if (Number.isFinite(parsedValue) && parsedValue >= 0) {
      return {
        uptime_seconds: Math.floor(parsedValue),
        hostname: getHostname(),
      };
    } else {
      return {
        uptime_seconds: Math.floor(getLocalUptime()),
        hostname: getHostname(),
      };
    }
  } catch {
    return {
      uptime_seconds: Math.floor(getLocalUptime()),
      hostname: getHostname(),
    };
  }
}

async function fetchLatestGitHubEvent(user: string): Promise<GitHubPayload | null> {
  const url = `https://api.github.com/users/${encodeURIComponent(user)}/events/public`;
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "joschi-api/2.0.0",
      },
      signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
    });

    if (response.ok) {
      const payload = await parseJsonSafely(response);
      const events = parseGitHubEventsResponse(payload);
      const latestEvent = events?.[0];

      if (latestEvent) {
        return {
          repo: latestEvent.repo.name,
          type: latestEvent.type,
          created_at: latestEvent.created_at,
        };
      } else {
        return null;
      }
    } else {
      return null;
    }
  } catch {
    return null;
  }
}

async function getGitHubPayload(): Promise<GitHubPayload | null> {
  const nowMs = Date.now();
  const freshCache = getFreshCacheValue(githubCache.get("latest"), GITHUB_CACHE_TTL_MS, nowMs);

  if (freshCache) {
    return freshCache;
  } else {
    const user = process.env.GITHUB_USER && process.env.GITHUB_USER.length > 0 ? process.env.GITHUB_USER : "joschi655";
    const payload = await fetchLatestGitHubEvent(user);

    if (payload) {
      githubCache.set("latest", { value: payload, fetchedAtMs: nowMs });
      return payload;
    } else {
      return null;
    }
  }
}

async function handleMusicRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const range = getValidatedRange(url.searchParams.get("range"));
  const payload = await getMusicPayload(range);

  if (payload) {
    return jsonResponse(payload, 200, "public, max-age=300");
  } else {
    return unavailableResponse();
  }
}

async function handleStatusRequest(): Promise<Response> {
  const payload = await getStatusPayload();
  return jsonResponse(payload, 200, "public, max-age=300");
}

async function handleGitHubRequest(): Promise<Response> {
  const payload = await getGitHubPayload();

  if (payload) {
    return jsonResponse(payload, 200, "public, max-age=300");
  } else {
    return unavailableResponse();
  }
}

async function routeRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return methodNotAllowedResponse();
  } else if (url.pathname === "/health") {
    return healthResponse();
  } else if (url.pathname === "/music") {
    return await handleMusicRequest(request);
  } else if (url.pathname === "/status") {
    return await handleStatusRequest();
  } else if (url.pathname === "/github") {
    return await handleGitHubRequest();
  } else if (url.pathname === "/coffee") {
    return teapotResponse();
  } else {
    return notFoundResponse();
  }
}

const port = parsePort(process.env.PORT);

const server = Bun.serve({
  hostname: HOSTNAME,
  port,
  async fetch(request, serverInstance) {
    const url = new URL(request.url);
    const clientIp = getClientIp(request, serverInstance);
    const nowMs = Date.now();
    let response: Response;

    try {
      if (isRateLimited(clientIp, nowMs)) {
        response = rateLimitedResponse();
      } else {
        response = await routeRequest(request);
      }
    } catch {
      response = internalErrorResponse();
    }

    console.log(`${request.method} ${url.pathname} ${response.status}`);
    return response;
  },
});

console.log(`joschi-api listening on ${HOSTNAME}:${server.port}`);
