import type { MiddlewareDefinition } from "../types.js";

export function createCorsMiddleware(options: {
  origins: readonly string[];
  credentials: boolean;
}): MiddlewareDefinition {
  const allowAll = options.origins.includes("*");

  return {
    name: "cors",
    position: 20,
    async run(request, response, next) {
      const requestOrigin = request.headers.origin;
      let allowOrigin: string | null = null;

      if (allowAll) {
        allowOrigin = "*";
      } else if (typeof requestOrigin === "string" && options.origins.includes(requestOrigin)) {
        allowOrigin = requestOrigin;
      } else if (!requestOrigin && options.origins.length === 1) {
        allowOrigin = options.origins[0] ?? null;
      }

      if (allowOrigin) {
        response.header("access-control-allow-origin", allowOrigin);
        if (options.credentials && allowOrigin !== "*") {
          response.header("access-control-allow-credentials", "true");
          response.header("vary", "Origin");
        }
      }

      response.header(
        "access-control-allow-headers",
        "Authorization, Content-Type, X-Request-Id, X-CSRF-Token",
      );
      response.header(
        "access-control-allow-methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
      );

      if (request.method === "OPTIONS") {
        response.status(204).end();
        return;
      }

      await next();
    },
  };
}
