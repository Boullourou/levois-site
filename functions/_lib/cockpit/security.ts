import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { D1Database } from "@cloudflare/workers-types";

export interface CockpitEnv {
  COCKPIT_DB?: D1Database;
  COCKPIT_LOCAL_BYPASS?: string;
  COCKPIT_ALLOWED_HOSTS?: string;
  COCKPIT_ALLOWED_EMAIL?: string;
  COCKPIT_ALLOWED_SUB?: string;
  COCKPIT_CSRF_SECRET?: string;
  COCKPIT_AUDIT_SECRET?: string;
  COCKPIT_AGENTIC_FIXTURE_ONLY?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
}

export interface CockpitActor {
  id: string;
  email: string;
  local: boolean;
}

export class SecurityError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

type Jwks = Parameters<typeof jwtVerify>[1];

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const encoder = new TextEncoder();

function csv(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function teamIssuer(value: string): string {
  const raw = value.trim().replace(/\/$/, "");
  if (!raw) throw new SecurityError(503, "ACCESS_NOT_CONFIGURED", "Cloudflare Access n'est pas configuré.");
  const url = raw.startsWith("https://") ? raw : `https://${raw}`;
  return new URL(url).origin;
}

function assertAllowedHost(url: URL, env: CockpitEnv): void {
  if (LOCAL_HOSTS.has(url.hostname)) return;
  const allowed = csv(env.COCKPIT_ALLOWED_HOSTS);
  if (!allowed.length || !allowed.includes(url.hostname.toLowerCase())) {
    throw new SecurityError(403, "HOST_NOT_ALLOWED", "Cet hôte cockpit n'est pas autorisé.");
  }
}

export function isLocalBypass(request: Request, env: CockpitEnv): boolean {
  const url = new URL(request.url);
  return env.COCKPIT_LOCAL_BYPASS === "1" && LOCAL_HOSTS.has(url.hostname);
}

export async function verifyAccessToken(
  token: string,
  env: CockpitEnv,
  jwksOverride?: Jwks,
): Promise<JWTPayload> {
  const issuer = teamIssuer(env.CF_ACCESS_TEAM_DOMAIN ?? "");
  const audience = env.CF_ACCESS_AUD?.trim();
  if (!audience) {
    throw new SecurityError(503, "ACCESS_NOT_CONFIGURED", "L'audience Cloudflare Access est absente.");
  }
  const jwks = jwksOverride ?? createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
  const result = await jwtVerify(token, jwks, {
    issuer,
    audience,
    algorithms: ["RS256"],
    requiredClaims: ["exp", "nbf", "sub"],
    clockTolerance: 5,
  });
  return result.payload;
}

export async function authenticateCockpit(
  request: Request,
  env: CockpitEnv,
  jwksOverride?: Jwks,
): Promise<CockpitActor> {
  const url = new URL(request.url);
  assertAllowedHost(url, env);

  if (isLocalBypass(request, env)) {
    return { id: "local:operator", email: "local@cockpit.invalid", local: true };
  }

  const assertion = request.headers.get("Cf-Access-Jwt-Assertion")?.trim();
  if (!assertion) throw new SecurityError(401, "ACCESS_REQUIRED", "Authentification Cloudflare Access requise.");

  let payload: JWTPayload;
  try {
    payload = await verifyAccessToken(assertion, env, jwksOverride);
  } catch (error) {
    if (error instanceof SecurityError) throw error;
    throw new SecurityError(401, "ACCESS_INVALID", "Le jeton Cloudflare Access est invalide.");
  }

  const subject = typeof payload.sub === "string" ? payload.sub.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (payload.type !== "app" || !subject || !email) {
    throw new SecurityError(401, "ACCESS_IDENTITY_INVALID", "L'identité Access est incomplète.");
  }

  const allowedEmails = csv(env.COCKPIT_ALLOWED_EMAIL);
  if (!allowedEmails.length || !allowedEmails.includes(email)) {
    throw new SecurityError(403, "IDENTITY_NOT_ALLOWED", "Cette identité n'est pas autorisée.");
  }
  const allowedSubjects = csv(env.COCKPIT_ALLOWED_SUB);
  if (allowedSubjects.length && !allowedSubjects.includes(subject.toLowerCase())) {
    throw new SecurityError(403, "IDENTITY_NOT_ALLOWED", "Ce sujet Access n'est pas autorisé.");
  }

  return { id: subject, email, local: false };
}

async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return diff === 0;
}

export async function createCsrfToken(request: Request, actor: CockpitActor, env: CockpitEnv): Promise<string> {
  const secret = env.COCKPIT_CSRF_SECRET?.trim();
  if (!secret || secret.length < 24) {
    throw new SecurityError(503, "CSRF_NOT_CONFIGURED", "La protection CSRF n'est pas configurée.");
  }
  const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;
  const origin = new URL(request.url).origin;
  const payload = `${actor.id}|${origin}|${expiresAt}`;
  return `${expiresAt}.${await hmac(secret, payload)}`;
}

export async function assertMutationSecurity(request: Request, actor: CockpitActor, env: CockpitEnv): Promise<void> {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method.toUpperCase())) return;
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (!origin || origin !== requestUrl.origin) {
    throw new SecurityError(403, "ORIGIN_INVALID", "L'origine de la mutation est refusée.");
  }
  const contentType = request.headers.get("Content-Type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    throw new SecurityError(415, "CONTENT_TYPE_INVALID", "Les mutations exigent application/json.");
  }
  const token = request.headers.get("X-LEVOIS-CSRF")?.trim() ?? "";
  const match = /^(\d+)\.([a-f0-9]{64})$/.exec(token);
  if (!match) throw new SecurityError(403, "CSRF_INVALID", "Le jeton CSRF est absent ou invalide.");
  const expiresAt = Number(match[1]);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    throw new SecurityError(403, "CSRF_EXPIRED", "Le jeton CSRF a expiré.");
  }
  const secret = env.COCKPIT_CSRF_SECRET?.trim();
  if (!secret || secret.length < 24) throw new SecurityError(503, "CSRF_NOT_CONFIGURED", "La protection CSRF n'est pas configurée.");
  const expected = await hmac(secret, `${actor.id}|${requestUrl.origin}|${expiresAt}`);
  if (!safeEqual(expected, match[2])) throw new SecurityError(403, "CSRF_INVALID", "Le jeton CSRF est invalide.");
}

export async function requestFingerprint(payload: unknown, env: CockpitEnv): Promise<string> {
  const secret = env.COCKPIT_AUDIT_SECRET?.trim() || env.COCKPIT_CSRF_SECRET?.trim();
  if (!secret || secret.length < 24) throw new SecurityError(503, "AUDIT_NOT_CONFIGURED", "La clé d'audit n'est pas configurée.");
  return hmac(secret, JSON.stringify(payload));
}

export function privateHeaders(contentType?: string): Headers {
  const headers = new Headers();
  if (contentType) headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Content-Security-Policy", [
    "default-src 'self'",
    "base-uri 'none'",
    "connect-src 'self'",
    "font-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "manifest-src 'self'",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
  ].join("; "));
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  return headers;
}

export function secureResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of privateHeaders()) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
