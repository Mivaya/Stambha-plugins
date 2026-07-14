import type { MiddlewareDefinition } from "../types.js";

/** Require an authenticated session. */
export function createRequireAuthMiddleware(): MiddlewareDefinition {
  return {
    name: "requireAuth",
    position: 60,
    async run(request, response, next) {
      // Only enforce on paths under /guilds (auth routes handle themselves)
      if (!request.path.includes("/guilds")) {
        await next();
        return;
      }
      if (!request.session) {
        response.status(401).json({ error: "Unauthorized" });
        return;
      }
      await next();
    },
  };
}

/**
 * CSRF check for cookie-authenticated mutating requests.
 * Safe methods and /auth/callback are skipped.
 */
export function createCsrfMiddleware(): MiddlewareDefinition {
  return {
    name: "csrf",
    position: 55,
    async run(request, response, next) {
      const method = request.method;
      if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
        await next();
        return;
      }
      if (!request.session) {
        await next();
        return;
      }
      // OAuth callback exchange is not CSRF-bound to an existing session
      if (request.path.endsWith("/auth/callback") || request.path.endsWith("/auth/login")) {
        await next();
        return;
      }

      const header = request.headers["x-csrf-token"];
      const token = typeof header === "string" ? header : undefined;
      if (!token || token !== request.session.csrfToken) {
        response.status(403).json({ error: "Invalid CSRF token" });
        return;
      }
      await next();
    },
  };
}
