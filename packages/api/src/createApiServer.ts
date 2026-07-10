import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import { createApiRequest } from "./http/ApiRequest.js";
import { createApiResponse } from "./http/ApiResponse.js";
import { createBodyMiddleware } from "./middleware/body.js";
import { createCorsMiddleware } from "./middleware/cors.js";
import { MiddlewareStore } from "./middleware/MiddlewareStore.js";
import { createRequestIdMiddleware } from "./middleware/requestId.js";
import { RouteStore } from "./route/RouteStore.js";
import { joinPrefix } from "./router/Router.js";
import { createHealthRoute } from "./routes/health.js";
import { createVersionRoute } from "./routes/version.js";
import type { ApiServerHandle, ApiServerOptions } from "./types.js";
import { resolveApiServerOptions } from "./validateOptions.js";

export interface ApiServer {
  readonly routes: RouteStore;
  readonly middlewares: MiddlewareStore;
  readonly options: ReturnType<typeof resolveApiServerOptions>;
  listen(): Promise<ApiServerHandle>;
  /** Handle a single request (also used by the Node HTTP server). */
  handle(
    rawReq: import("node:http").IncomingMessage,
    rawRes: import("node:http").ServerResponse,
  ): Promise<void>;
}

/**
 * Create a mountable HTTP API server for user-built admin frontends.
 * Built-in routes: `GET /health`, `GET /version` (under {@link ApiServerOptions.prefix}).
 */
export function createApiServer(options: ApiServerOptions = {}): ApiServer {
  const resolved = resolveApiServerOptions(options);
  const routes = new RouteStore();
  const middlewares = new MiddlewareStore();

  middlewares.register(createRequestIdMiddleware());
  middlewares.register(
    createCorsMiddleware({
      origins: resolved.origins,
      credentials: resolved.credentials,
    }),
  );
  middlewares.register(createBodyMiddleware({ maximumBodyLength: resolved.maximumBodyLength }));

  for (const mw of options.middlewares ?? []) {
    middlewares.register(mw);
  }

  const health = createHealthRoute(options.client);
  const version = createVersionRoute();
  routes.register({
    ...health,
    path: joinPrefix(resolved.prefix, health.path),
  });
  routes.register({
    ...version,
    path: joinPrefix(resolved.prefix, version.path),
  });

  for (const route of options.routes ?? []) {
    routes.register({
      ...route,
      path: joinPrefix(resolved.prefix, route.path),
    });
  }

  const handle: ApiServer["handle"] = async (rawReq, rawRes) => {
    const incomingId = rawReq.headers["x-request-id"];
    const requestId =
      typeof incomingId === "string" && incomingId.trim() ? incomingId.trim() : randomUUID();

    const request = createApiRequest(rawReq, {
      baseUrl: `http://${resolved.host}:${resolved.port}`,
      requestId,
      trustProxy: resolved.trustProxy,
    });
    const response = createApiResponse(rawRes);
    response.header("x-request-id", requestId);

    try {
      await middlewares.run(request, response, async () => {
        if (response.writableEnded) return;

        const match = routes.router.match(request.method, request.path);
        if (!match) {
          response.status(404).json({ error: "Not Found" });
          return;
        }

        // Bind matched params onto request
        Object.assign(request, { params: match.params });
        await match.handler(request, response);
      });
    } catch (error) {
      if (!response.writableEnded) {
        response.status(500).json({
          error: "Internal Server Error",
          requestId,
        });
      }
      // Avoid swallowing — callers/tests can observe via status; Node server keeps running
      if (process.env.STAMBHA_API_DEBUG === "1") {
        console.error("[@stambha/api]", error);
      }
    }
  };

  return {
    routes,
    middlewares,
    options: resolved,
    handle,
    listen() {
      const server: Server = createServer((req, res) => {
        void handle(req, res);
      });

      return new Promise<ApiServerHandle>((resolve, reject) => {
        server.once("error", reject);
        server.listen(resolved.port, resolved.host, () => {
          const addr = server.address();
          const actualPort = typeof addr === "object" && addr !== null ? addr.port : resolved.port;
          resolve({
            url: `http://${resolved.host}:${actualPort}`,
            port: actualPort,
            host: resolved.host,
            close: () =>
              new Promise<void>((closeResolve, closeReject) => {
                server.close((err) => (err ? closeReject(err) : closeResolve()));
              }),
          });
        });
      });
    },
  };
}
