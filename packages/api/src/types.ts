import type { IncomingMessage, ServerResponse } from "node:http";
import type { RestPort, StambhaClient } from "@stambha/core";
import type {
  ApiDashboardOptions,
  ApiSession,
  AuthCookieOptions,
  AuthRuntime,
} from "./auth/types.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

export interface ApiServerOptions extends ApiDashboardOptions {
  /** URL path prefix for all routes (default `""`). Leading/trailing slashes normalized. */
  prefix?: string;
  /** CORS allowed origin(s). Use concrete origins when {@link credentials} is true. */
  origin?: string | readonly string[];
  /** When true, sets Access-Control-Allow-Credentials. Incompatible with origin `*`. */
  credentials?: boolean;
  /** Max JSON body size in bytes (default 1_048_576). */
  maximumBodyLength?: number;
  /** Passed to `server.listen` (port required unless using an existing server). */
  listenOptions?: {
    port?: number;
    host?: string;
  };
  /** Honor `X-Forwarded-For` / `X-Forwarded-Proto` when behind a reverse proxy. */
  trustProxy?: boolean;
  /** Optional Stambha client (tier / version metadata on /health). */
  client?: StambhaClient;
  /** Extra routes registered after built-ins. */
  routes?: RouteDefinition[];
  /**
   * Directory of file-based routes (`hello-world.get.ts`, nested folders, …).
   * Loaded via {@link loadRoutes} and merged with {@link routes}.
   * Requires {@link createApiServerAsync} or {@link createApiPlugin}.
   */
  routesDir?: string;
  /** Extra middlewares registered after built-ins (sorted by position). */
  middlewares?: MiddlewareDefinition[];
}

export interface ApiRequest {
  readonly raw: IncomingMessage;
  readonly method: HttpMethod;
  readonly url: URL;
  readonly path: string;
  /** Filled after route match. */
  params: Record<string, string>;
  readonly query: Readonly<Record<string, string>>;
  readonly headers: IncomingMessage["headers"];
  requestId: string;
  body: unknown;
  /** Populated by session middleware when auth is enabled. */
  session: ApiSession | null;
  /** Auth runtime when dashboard auth is configured. */
  auth: AuthRuntime | null;
}

export interface ApiResponse {
  readonly raw: ServerResponse;
  status(code: number): ApiResponse;
  header(name: string, value: string): ApiResponse;
  setCookie(name: string, value: string, options: Required<AuthCookieOptions>): ApiResponse;
  clearCookie(name: string, options: Required<AuthCookieOptions>): ApiResponse;
  redirect(url: string, status?: number): void;
  json(data: unknown): void;
  text(data: string, contentType?: string): void;
  end(): void;
  readonly writableEnded: boolean;
}

export type RouteHandler = (request: ApiRequest, response: ApiResponse) => void | Promise<void>;

export interface RouteDefinition {
  /** Path relative to server prefix, e.g. `/health` or `/guilds/[id]`. */
  path: string;
  method: HttpMethod;
  run: RouteHandler;
  /** Optional name for debugging. */
  name?: string;
}

export type MiddlewareHandler = (
  request: ApiRequest,
  response: ApiResponse,
  next: () => Promise<void>,
) => void | Promise<void>;

export interface MiddlewareDefinition {
  name: string;
  /** Lower runs first (default 1000). Built-ins use 10–40. */
  position?: number;
  run: MiddlewareHandler;
}

export interface ApiServerHandle {
  readonly url: string;
  readonly port: number;
  readonly host: string;
  close(): Promise<void>;
}

export type { RestPort };
