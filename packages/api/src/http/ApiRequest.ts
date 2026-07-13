import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { ApiRequest, HttpMethod } from "../types.js";

const METHODS = new Set<string>(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]);

export function createApiRequest(
  raw: IncomingMessage,
  options: {
    baseUrl: string;
    params?: Record<string, string>;
    requestId?: string;
    trustProxy?: boolean;
  },
): ApiRequest {
  const host = raw.headers.host ?? "localhost";
  const proto =
    options.trustProxy && typeof raw.headers["x-forwarded-proto"] === "string"
      ? raw.headers["x-forwarded-proto"].split(",")[0]?.trim() || "http"
      : "http";
  const url = new URL(raw.url ?? "/", `${proto}://${host}`);
  const methodRaw = (raw.method ?? "GET").toUpperCase();
  const method = (METHODS.has(methodRaw) ? methodRaw : "GET") as HttpMethod;

  const query: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (!(key in query)) query[key] = value;
  }

  return {
    raw,
    method,
    url,
    path: url.pathname,
    params: options.params ?? {},
    query,
    headers: raw.headers,
    requestId: options.requestId ?? randomUUID(),
    body: undefined,
    session: null,
    auth: null,
  };
}
