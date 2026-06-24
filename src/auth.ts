// auth.ts — Admin authentication. One job: prove the person is the site
// manager and keep them signed in.
//
// • Password is hashed with PBKDF2-HMAC-SHA-256 (Web Crypto — no extra deps)
//   and stored in Deno KV. The plaintext is never persisted.
// • A successful login mints a random session token, stored in KV with an
//   expiry, and handed back as an HttpOnly cookie.

import { kv } from "./kv.ts";

const PASSWORD_KEY = ["admin", "password"];
const SESSION_PREFIX = "session";
const ITERATIONS = 210_000; // OWASP-recommended floor for PBKDF2-SHA256
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SESSION_COOKIE = "msm_admin";

interface StoredHash {
  salt: Uint8Array;
  iterations: number;
  hash: Uint8Array;
}

/** Derive PBKDF2 bits for a password against a given salt + iteration count. */
async function derive(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    // Copy into a fresh ArrayBuffer-backed view so the type is Uint8Array<ArrayBuffer>
    // (KV-restored arrays are typed as the looser ArrayBufferLike).
    { name: "PBKDF2", salt: new Uint8Array(salt), iterations, hash: "SHA-256" },
    key,
    256,
  );
  return new Uint8Array(bits);
}

/** Constant-time byte comparison — avoids leaking match progress via timing. */
function safeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Hash and store the admin password, replacing any existing one. */
export async function setPassword(password: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  const stored: StoredHash = { salt, iterations: ITERATIONS, hash };
  await kv.set(PASSWORD_KEY, stored);
}

/** True once an admin password has been configured. */
export async function hasPassword(): Promise<boolean> {
  const entry = await kv.get<StoredHash>(PASSWORD_KEY);
  return entry.value !== null;
}

/** Verify a candidate password against the stored hash. */
export async function verifyPassword(password: string): Promise<boolean> {
  const entry = await kv.get<StoredHash>(PASSWORD_KEY);
  if (!entry.value) return false;
  const { salt, iterations, hash } = entry.value;
  const candidate = await derive(password, salt, iterations);
  return safeEqual(candidate, hash);
}

/** Create a session, persist it with a TTL, and return its token. */
export async function createSession(): Promise<string> {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
  await kv.set([SESSION_PREFIX, token], { createdAt: Date.now() }, {
    expireIn: SESSION_TTL_MS,
  });
  return token;
}

/** True if the token maps to a live session. */
export async function validateSession(token: string | null): Promise<boolean> {
  if (!token) return false;
  const entry = await kv.get([SESSION_PREFIX, token]);
  return entry.value !== null;
}

/** Invalidate a session token (logout). */
export async function destroySession(token: string | null): Promise<void> {
  if (token) await kv.delete([SESSION_PREFIX, token]);
}

// ── Cookie helpers ─────────────────────────────────────────────────────────

/** Read the session token from the request's Cookie header. */
export function readSessionCookie(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return rest.join("=");
  }
  return null;
}

/** Build the Set-Cookie value that stores a session token. */
export function sessionCookie(token: string, secure: boolean): string {
  const flags = [
    `${SESSION_COOKIE}=${token}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (secure) flags.push("Secure");
  return flags.join("; ");
}

/** Build the Set-Cookie value that clears the session cookie. */
export function clearCookie(secure: boolean): string {
  const flags = [
    `${SESSION_COOKIE}=`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=0",
  ];
  if (secure) flags.push("Secure");
  return flags.join("; ");
}

/** Lowercase hex encoding of bytes. */
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
