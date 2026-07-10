import type { ServerResponse } from "node:http";
import type { ApiResponse } from "../types.js";

export function createApiResponse(raw: ServerResponse): ApiResponse {
  let statusCode = 200;
  const headers = new Map<string, string>();
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
    const outHeaders: Record<string, string> = {};
    for (const [k, v] of headers) outHeaders[k] = v;
    raw.writeHead(statusCode, outHeaders);
    raw.end(body);
  }

  return api;
}
