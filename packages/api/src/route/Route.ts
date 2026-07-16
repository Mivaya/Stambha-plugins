import type { StambhaClient } from "@stambha/core";
import type { AuthRuntime } from "../auth/types.js";
import type {
  ApiRequest,
  ApiResponse,
  HttpMethod,
  RouteDefinition,
  RouteHandler,
} from "../types.js";

/** DI context passed to {@link Route.create} when loading route files. */
export interface RouteLoadContext {
  client?: StambhaClient;
  auth?: AuthRuntime | null;
  [key: string]: unknown;
}

/**
 * Optional base class for file-based routes (`src/routes/hello-world.get.ts`).
 *
 * Prefer overriding {@link path} / {@link method} when the filename should not define them.
 * Provide `static create(ctx)` for dependency injection (client, vault, logger, …).
 */
export abstract class Route {
  /** Path relative to server prefix (e.g. `/hello-world` or `/guilds/[id]`). */
  readonly path?: string;
  /** HTTP method; defaults to the filename suffix (`.get`, `.post`, …). */
  readonly method?: HttpMethod;
  /** Debug name. */
  readonly name?: string;

  abstract run(request: ApiRequest, response: ApiResponse): void | Promise<void>;

  /** Optional async factory used by {@link loadRoutes}. */
  static create?(ctx: RouteLoadContext): Route | Promise<Route>;

  /** Convert this instance to a {@link RouteDefinition}. */
  toDefinition(fallback?: { path: string; method: HttpMethod; name?: string }): RouteDefinition {
    const path = this.path ?? fallback?.path;
    const method = this.method ?? fallback?.method;
    if (!path || !method) {
      throw new Error(
        "@stambha/api: Route must set path/method or be loaded from a name.method.ts file",
      );
    }
    const name = this.name ?? fallback?.name;
    return {
      path,
      method,
      ...(name !== undefined ? { name } : {}),
      run: (req, res) => this.run(req, res),
    };
  }
}

export type RouteClass = {
  new (...args: never[]): Route;
  create?(ctx: RouteLoadContext): Route | Promise<Route>;
};

export function isRouteClass(value: unknown): value is RouteClass {
  return typeof value === "function" && value.prototype instanceof Route;
}

export function isRouteDefinition(value: unknown): value is RouteDefinition {
  if (!value || typeof value !== "object") return false;
  const v = value as RouteDefinition;
  return typeof v.path === "string" && typeof v.method === "string" && typeof v.run === "function";
}

export function isRouteHandler(value: unknown): value is RouteHandler {
  return typeof value === "function";
}
