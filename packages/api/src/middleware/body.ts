import type { IncomingMessage } from "node:http";
import type { MiddlewareDefinition } from "../types.js";

async function readRawBody(req: IncomingMessage, maximumBodyLength: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > maximumBodyLength) {
      throw new BodyTooLargeError(maximumBodyLength);
    }
    chunks.push(buf);
  }

  return Buffer.concat(chunks);
}

export class BodyTooLargeError extends Error {
  constructor(readonly maximumBodyLength: number) {
    super(`Request body exceeds maximumBodyLength (${maximumBodyLength} bytes)`);
    this.name = "BodyTooLargeError";
  }
}

export function createBodyMiddleware(options: { maximumBodyLength: number }): MiddlewareDefinition {
  return {
    name: "body",
    position: 30,
    async run(request, response, next) {
      if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
        await next();
        return;
      }

      const contentLength = request.headers["content-length"];
      if (contentLength) {
        const len = Number(contentLength);
        if (Number.isFinite(len) && len > options.maximumBodyLength) {
          response.status(413).json({ error: "Payload Too Large" });
          return;
        }
      }

      try {
        const raw = await readRawBody(request.raw, options.maximumBodyLength);
        if (raw.length === 0) {
          request.body = undefined;
          await next();
          return;
        }

        const contentType = String(request.headers["content-type"] ?? "");
        if (contentType.includes("application/json")) {
          try {
            request.body = JSON.parse(raw.toString("utf8"));
          } catch {
            response.status(400).json({ error: "Invalid JSON body" });
            return;
          }
        } else {
          request.body = raw.toString("utf8");
        }
        await next();
      } catch (error) {
        if (error instanceof BodyTooLargeError) {
          response.status(413).json({ error: "Payload Too Large" });
          return;
        }
        throw error;
      }
    },
  };
}
