import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import { createAuthRuntime, resolveRestPort, shouldListen } from "./auth/createAuthRuntime.js";
import type { AuthRuntime } from "./auth/types.js";
import { createApiRequest } from "./http/ApiRequest.js";
import { createApiResponse } from "./http/ApiResponse.js";
import { loadRoutes } from "./loadRoutes.js";
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
import type { ApiServerHandle, ApiServerOptions, RouteDefinition } from "./types.js";
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

function withAuthCredentialDefaults(options: ApiServerOptions): ApiServerOptions {
  return options.auth && options.credentials === undefined
    ? { ...options, credentials: true }
    : options;
}

/**
 * Create a mountable HTTP API server (sync).
 *
 * For {@link ApiServerOptions.routesDir}, use {@link createApiServerAsync} instead.
 */
export function createApiServer(options: ApiServerOptions = {}): ApiServer {
  if (options.routesDir) {
    throw new Error(
      "@stambha/api: routesDir requires createApiServerAsync() (or createApiPlugin).",
    );
  }
  const resolved = withAuthCredentialDefaults(options);
  return buildApiServer(resolved, resolved.routes ?? []);
}

/**
 * Create a mountable HTTP API server, optionally loading file-based routes from {@link ApiServerOptions.routesDir}.
 */
export async function createApiServerAsync(options: ApiServerOptions = {}): Promise<ApiServer> {
  const resolved = withAuthCredentialDefaults(options);
  const auth = createAuthRuntime(resolved);
  if (auth) {
    auth.restPort = resolveRestPort(auth, resolved.client);
  }

  const fileRoutes = resolved.routesDir
    ? await loadRoutes(resolved.routesDir, {
        context: {
          ...(resolved.client !== undefined ? { client: resolved.client } : {}),
          auth,
          ...(auth?.restPort !== undefined || resolved.restPort !== undefined
            ? { restPort: auth?.restPort ?? resolved.restPort }
            : {}),
        },
      })
    : [];

  return buildApiServer(resolved, [...fileRoutes, ...(resolved.routes ?? [])], auth);
}

/**
 * Create a mountable HTTP API server for user-built admin frontends.
 * Built-in routes: `GET /health`, `GET /version`.
 * With `auth`: OAuth, sessions, guild list, optional Vault settings.
 */
function buildApiServer(
  options: ApiServerOptions,
  extraRoutes: readonly RouteDefinition[],
  existingAuth?: AuthRuntime | null,
): ApiServer {
  const resolved = resolveApiServerOptions(options);
  const auth =
    existingAuth !== undefined
      ? existingAuth
      : (() => {
          const created = createAuthRuntime(options);
          if (created) {
            created.restPort = resolveRestPort(created, options.client);
          }
          return created;
        })();

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

  for (const mw of options.middlewares ?? []) {
    middlewares.register(mw);
  }

  const register = (route: Parameters<RouteStore["register"]>[0]) => {
    routes.register({
      ...route,
      path: joinPrefix(resolved.prefix, route.path),
    });
  };

  register(createHealthRoute(options.client));
  register(createVersionRoute());

  if (auth) {
    for (const route of createAuthRoutes(auth)) register(route);
    for (const route of createGuildRoutes(auth, () => resolveRestPort(auth, options.client))) {
      register(route);
    }
    for (const route of createSettingsRoutes(auth, () => resolveRestPort(auth, options.client))) {
      register(route);
    }
  }

  for (const route of extraRoutes) {
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
      if (!shouldListen(options, options.client)) {
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
