import type { MiddlewareDefinition } from "../types.js";

export function createRequestIdMiddleware(): MiddlewareDefinition {
  return {
    name: "request-id",
    position: 10,
    async run(request, response, next) {
      const incoming = request.headers["x-request-id"];
      const id =
        typeof incoming === "string" && incoming.trim() ? incoming.trim() : request.requestId;
      // request.requestId is readonly on the object we created — set header for clients
      response.header("x-request-id", id);
      Object.assign(request, { requestId: id });
      await next();
    },
  };
}
