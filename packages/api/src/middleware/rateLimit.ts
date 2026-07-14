import type { MiddlewareDefinition } from "../types.js";

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory rate limiter (per IP + key).
 * Suitable for single-process API hosts; use a shared store for multi-replica.
 */
export function createRateLimitMiddleware(options: {
  /** Max requests per window (default 30). */
  limit?: number;
  /** Window ms (default 60_000). */
  windowMs?: number;
  /** Only apply to paths matching this prefix (e.g. `/auth`). */
  pathIncludes?: string;
  name?: string;
  position?: number;
}): MiddlewareDefinition {
  const limit = options.limit ?? 30;
  const windowMs = options.windowMs ?? 60_000;
  const buckets = new Map<string, Bucket>();

  return {
    name: options.name ?? "rateLimit",
    position: options.position ?? 45,
    async run(request, response, next) {
      if (options.pathIncludes && !request.path.includes(options.pathIncludes)) {
        await next();
        return;
      }

      const forwarded = request.headers["x-forwarded-for"];
      const ip =
        (typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : undefined) ||
        request.raw.socket.remoteAddress ||
        "unknown";
      const key = `${ip}:${options.pathIncludes ?? "*"}`;
      const now = Date.now();
      let bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= now) {
        bucket = { count: 0, resetAt: now + windowMs };
        buckets.set(key, bucket);
      }
      bucket.count += 1;
      if (bucket.count > limit) {
        response
          .status(429)
          .header("retry-after", String(Math.ceil((bucket.resetAt - now) / 1000)))
          .json({ error: "Too Many Requests" });
        return;
      }
      await next();
    },
  };
}
