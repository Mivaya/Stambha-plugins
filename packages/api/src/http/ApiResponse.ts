import type { ServerResponse } from "node:http";
import { serializeCookie, serializeExpiredCookie } from "../auth/cookies.js";
import type { AuthCookieOptions } from "../auth/types.js";
import type { ApiResponse } from "../types.js";

export function createApiResponse(raw: ServerResponse): ApiResponse {
  let statusCode = 200;
  const headers = new Map<string, string>();
  const cookies: string[] = [];
  let ended = false;

  const api: ApiResponse = {
    raw,
    get writableEnded() {
      return ended || raw.writableEnded;
    },
    status(code: number) {
      statusCode = code;
      return api;
    },
    header(name: string, value: string) {
      headers.set(name.toLowerCase(), value);
      return api;
    },
    setCookie(name: string, value: string, options: Required<AuthCookieOptions>) {
      cookies.push(serializeCookie(name, value, options));
      return api;
    },
    clearCookie(name: string, options: Required<AuthCookieOptions>) {
      cookies.push(serializeExpiredCookie(name, options));
      return api;
    },
    redirect(url: string, status = 302) {
      if (ended || raw.writableEnded) return;
      statusCode = status;
      headers.set("location", url);
      flush(undefined);
    },
    json(data: unknown) {
      if (ended || raw.writableEnded) return;
      const body = JSON.stringify(data);
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json; charset=utf-8");
      }
      flush(body);
    },
    text(data: string, contentType = "text/plain; charset=utf-8") {
      if (ended || raw.writableEnded) return;
      if (!headers.has("content-type")) {
        headers.set("content-type", contentType);
      }
      flush(data);
    },
    end() {
      if (ended || raw.writableEnded) return;
      flush(undefined);
    },
  };

  function flush(body: string | undefined): void {
    ended = true;
    for (const cookie of cookies) {
      raw.appendHeader("Set-Cookie", cookie);
    }
    const outHeaders: Record<string, string> = {};
    for (const [k, v] of headers) outHeaders[k] = v;
    raw.writeHead(statusCode, outHeaders);
    raw.end(body);
  }

  return api;
}
