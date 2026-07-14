import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import { createAuthRuntime, resolveRestPort, shouldListen } from "./auth/createAuthRuntime.js";
import type { AuthRuntime } from "./auth/types.js";
import { createApiRequest } from "./http/ApiRequest.js";
import { createApiResponse } from "./http/ApiResponse.js";
import { createBodyMiddleware } from "./middleware/body.js";
import { createCorsMiddleware } from "./middleware/cors.js";
import { MiddlewareStore } from "./middleware/MiddlewareStore.js";
import { createRateLimitMiddleware } from "./middleware/rateLimit.js";
import { createRequestIdMiddleware } from "./middleware/requestId.js";
import { createCsrfMiddleware, createRequireAuthMiddleware } from "./middleware/requireAuth.js";
import { createSessionMiddleware } from "./middleware/session.js";
import { RouteStore } from "./route/RouteStore.js";
import { joinPrefix } from "./router/Router.js";
import { createAuthRoutes } from "./routes/auth.js";
import { createGuildRoutes } from "./routes/guilds.js";
import { createHealthRoute } from "./routes/health.js";
import { createSettingsRoutes } from "./routes/settings.js";
import { createVersionRoute } from "./routes/version.js";
import type { ApiServerHandle, ApiServerOptions } from "./types.js";
import { resolveApiServerOptions } from "./validateOptions.js";

export interface ApiServer {
  readonly routes: RouteStore;
  readonly middlewares: MiddlewareStore;
  readonly options: ReturnType<typeof resolveApiServerOptions>;
  readonly auth: AuthRuntime | null;
  listen(): Promise<ApiServerHandle>;
  /** Handle a single request (also used by the Node HTTP server). */
  handle(
    rawReq: import("node:http").IncomingMessage,
    rawRes: import("node:http").ServerResponse,
  ): Promise<void>;
}

/**
 * Create a mountable HTTP API server for user-built admin frontends.
 * Built-in routes: `GET /health`, `GET /version`.
 * With `auth`: OAuth, sessions, guild list, optional Vault settings.
 */
export function createApiServer(options: ApiServerOptions = {}): ApiServer {
  const withAuthDefaults: ApiServerOptions =
    options.auth && options.credentials === undefined ? { ...options, credentials: true } : options;
  const resolved = resolveApiServerOptions(withAuthDefaults);
  const auth = createAuthRuntime(withAuthDefaults);
  if (auth) {
    auth.restPort = resolveRestPort(auth, withAuthDefaults.client);
  }

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

  if (auth) {
    if (resolved.origins.includes("*")) {
      throw new Error('@stambha/api: auth requires explicit origin(s); cannot use origin "*".');
    }
    middlewares.register(createRateLimitMiddleware({ pathIncludes: "/auth", limit: 40 }));
    middlewares.register(createSessionMiddleware(auth));
    middlewares.register(createCsrfMiddleware());
    middlewares.register(createRequireAuthMiddleware());
  }

  for (const mw of withAuthDefaults.middlewares ?? []) {
    middlewares.register(mw);
  }

  const register = (route: Parameters<RouteStore["register"]>[0]) => {
    routes.register({
      ...route,
      path: joinPrefix(resolved.prefix, route.path),
    });
  };

  register(createHealthRoute(withAuthDefaults.client));
  register(createVersionRoute());

  if (auth) {
    for (const route of createAuthRoutes(auth)) register(route);
    for (const route of createGuildRoutes(auth, () =>
      resolveRestPort(auth, withAuthDefaults.client),
    )) {
      register(route);
    }
    for (const route of createSettingsRoutes(auth, () =>
      resolveRestPort(auth, withAuthDefaults.client),
    )) {
      register(route);
    }
  }

  for (const route of withAuthDefaults.routes ?? []) {
    register(route);
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
      if (process.env.STAMBHA_API_DEBUG === "1") {
        console.error("[@stambha/api]", error);
      }
    }
  };

  return {
    routes,
    middlewares,
    options: resolved,
    auth,
    handle,
    listen() {
      if (!shouldListen(withAuthDefaults, withAuthDefaults.client)) {
        return Promise.reject(
          new Error(
            "@stambha/api: listen skipped (listenWhen returned false or STAMBHA_API_LISTEN=0). Mount the API only in the bot worker entrypoint.",
          ),
        );
      }

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
