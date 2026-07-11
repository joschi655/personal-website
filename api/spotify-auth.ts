import { readFileSync, writeFileSync } from "node:fs";
import { resolve as resolvePath } from "node:path";

interface SpotifyAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

const CALLBACK_HOST = "127.0.0.1";
const CALLBACK_PORT = 8888;
const CALLBACK_PATH = "/callback";
const CALLBACK_URL = `http://${CALLBACK_HOST}:${CALLBACK_PORT}${CALLBACK_PATH}`;
const EXTERNAL_FETCH_TIMEOUT_MS = 8_000;
const ENV_PATH = resolvePath(import.meta.dir, ".env");

function readEnvFile(): string {
  return readFileSync(ENV_PATH, "utf8");
}

function readEnvValue(rawEnv: string, key: string): string | null {
  const lines = rawEnv.split(/\r?\n/);

  for (const line of lines) {
    if (line.startsWith(`${key}=`)) {
      const rawValue = line.slice(key.length + 1).trim();

      if (
        (rawValue.startsWith("\"") && rawValue.endsWith("\"")) ||
        (rawValue.startsWith("'") && rawValue.endsWith("'"))
      ) {
        return rawValue.slice(1, -1);
      } else {
        return rawValue;
      }
    } else {
      // Intentional: unrelated env lines are skipped.
    }
  }

  return null;
}

function maskRefreshToken(refreshToken: string): string {
  if (refreshToken.length >= 6) {
    return `${refreshToken.slice(0, 4)}...${refreshToken.slice(-2)}`;
  } else if (refreshToken.length > 0) {
    return `${refreshToken[0]}...`;
  } else {
    return "...";
  }
}

function writeRefreshToken(rawEnv: string, refreshToken: string): void {
  const replacementLine = `SPOTIFY_REFRESH_TOKEN=${refreshToken}`;
  const newline = rawEnv.includes("\r\n") ? "\r\n" : "\n";
  let nextEnv = rawEnv;

  if (/^SPOTIFY_REFRESH_TOKEN=.*$/m.test(rawEnv)) {
    nextEnv = rawEnv.replace(/^SPOTIFY_REFRESH_TOKEN=.*$/m, replacementLine);
  } else if (rawEnv.length === 0) {
    nextEnv = replacementLine;
  } else if (rawEnv.endsWith("\n") || rawEnv.endsWith("\r\n")) {
    nextEnv = `${rawEnv}${replacementLine}`;
  } else {
    nextEnv = `${rawEnv}${newline}${replacementLine}`;
  }

  writeFileSync(ENV_PATH, nextEnv, "utf8");
}

function buildAuthorizeUrl(clientId: string): string {
  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", CALLBACK_URL);
  url.searchParams.set("scope", "user-top-read");
  return url.toString();
}

function parseTokenResponse(payload: unknown): SpotifyAuthTokenResponse | null {
  if (typeof payload === "object" && payload !== null) {
    const candidate = payload as Record<string, unknown>;

    if (
      typeof candidate.access_token === "string" &&
      typeof candidate.token_type === "string" &&
      typeof candidate.expires_in === "number" &&
      typeof candidate.refresh_token === "string"
    ) {
      return {
        access_token: candidate.access_token,
        token_type: candidate.token_type,
        expires_in: candidate.expires_in,
        refresh_token: candidate.refresh_token,
      };
    } else {
      return null;
    }
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

function getBasicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

async function exchangeCodeForRefreshToken(
  clientId: string,
  clientSecret: string,
  code: string,
): Promise<string | null> {
  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    redirect_uri: CALLBACK_URL,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: getBasicAuthHeader(clientId, clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
  });

  if (response.ok) {
    const payload = await parseJsonSafely(response);
    const tokenResponse = parseTokenResponse(payload);

    if (tokenResponse) {
      return tokenResponse.refresh_token;
    } else {
      return null;
    }
  } else {
    return null;
  }
}

const rawEnv = readEnvFile();
const spotifyClientId = readEnvValue(rawEnv, "SPOTIFY_CLIENT_ID");
const spotifyClientSecret = readEnvValue(rawEnv, "SPOTIFY_CLIENT_SECRET");

if (
  typeof spotifyClientId === "string" &&
  spotifyClientId.length > 0 &&
  typeof spotifyClientSecret === "string" &&
  spotifyClientSecret.length > 0
) {
  const authorizeUrl = buildAuthorizeUrl(spotifyClientId);
  console.log(authorizeUrl);
} else {
  console.error("missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in api/.env");
  process.exit(1);
}

const server = Bun.serve({
  hostname: CALLBACK_HOST,
  port: CALLBACK_PORT,
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    } else if (url.pathname !== CALLBACK_PATH) {
      return new Response("Not found", { status: 404 });
    }

    const oauthError = url.searchParams.get("error");

    if (typeof oauthError === "string" && oauthError.length > 0) {
      console.error(`spotify oauth error: ${oauthError}`);
      setTimeout(() => process.exit(1), 50);
      return new Response("<!doctype html><p>Spotify authorization failed. Check the terminal.</p>", {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    } else {
      const code = url.searchParams.get("code");

      if (typeof code === "string" && code.length > 0) {
        try {
          const refreshToken = await exchangeCodeForRefreshToken(
            spotifyClientId,
            spotifyClientSecret,
            code,
          );

          if (typeof refreshToken === "string" && refreshToken.length > 0) {
            writeRefreshToken(rawEnv, refreshToken);
            console.log(`refresh token saved: ${maskRefreshToken(refreshToken)}`);
            setTimeout(() => process.exit(0), 50);
            return new Response("<!doctype html><p>Spotify refresh token saved. You can close this tab.</p>", {
              status: 200,
              headers: { "Content-Type": "text/html; charset=utf-8" },
            });
          } else {
            console.error("spotify token exchange failed");
            setTimeout(() => process.exit(1), 50);
            return new Response("<!doctype html><p>Spotify token exchange failed. Check the terminal.</p>", {
              status: 502,
              headers: { "Content-Type": "text/html; charset=utf-8" },
            });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "unknown error";
          console.error(`spotify token exchange failed: ${message}`);
          setTimeout(() => process.exit(1), 50);
          return new Response("<!doctype html><p>Spotify token exchange failed. Check the terminal.</p>", {
            status: 502,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }
      } else {
        console.error("missing code in spotify callback");
        setTimeout(() => process.exit(1), 50);
        return new Response("<!doctype html><p>Missing Spotify code. Check the terminal.</p>", {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    }
  },
});

console.log(`spotify-auth listening on ${CALLBACK_HOST}:${server.port}${CALLBACK_PATH}`);
