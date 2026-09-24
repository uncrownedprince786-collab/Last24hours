const encoder = new TextEncoder();

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64ToBytes(b64: string): Uint8Array {
  const b = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b.length % 4 === 0 ? "" : "=".repeat(4 - (b.length % 4));
  const bin = atob(b + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function signToken(payload: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${bytesToBase64(new Uint8Array(sig))}`;
}

export async function verifyToken(token: string, secret: string): Promise<string | null> {
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const key = await importKey(secret);
  let sigBytes: Uint8Array;
  try {
    sigBytes = base64ToBytes(sig);
  } catch {
    return null;
  }
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes as never, encoder.encode(payload));
  return valid ? payload : null;
}

export function adminCookieName(): string {
  return "l24_admin";
}

export function getAdminSecret(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD is not configured");
  return secret;
}

export function findAdminCookie(headers: Headers): string | undefined {
  const cookie = headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === adminCookieName()) return rest.join("=");
  }
  return undefined;
}