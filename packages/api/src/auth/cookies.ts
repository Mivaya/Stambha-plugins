import type { AuthCookieOptions } from "./types.js";

export function resolveCookieOptions(input: AuthCookieOptions = {}): Required<AuthCookieOptions> {
  return {
    name: input.name ?? "stambha_session",
    maxAgeSeconds: input.maxAgeSeconds ?? 60 * 60 * 24 * 7,
    path: input.path ?? "/",
    domain: input.domain ?? "",
    secure: input.secure ?? true,
    httpOnly: input.httpOnly ?? true,
    sameSite: input.sameSite ?? "lax",
  };
}

export function parseCookieHeader(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) continue;
    out[key] = decodeURIComponent(value);
  }
  return out;
}

export function serializeCookie(
  name: string,
  value: string,
  options: Required<AuthCookieOptions>,
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path}`);
  parts.push(`Max-Age=${options.maxAgeSeconds}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  const sameSite =
    options.sameSite === "none" ? "None" : options.sameSite === "strict" ? "Strict" : "Lax";
  parts.push(`SameSite=${sameSite}`);
  return parts.join("; ");
}

export function serializeExpiredCookie(name: string, options: Required<AuthCookieOptions>): string {
  return serializeCookie(name, "", { ...options, maxAgeSeconds: 0 });
}
