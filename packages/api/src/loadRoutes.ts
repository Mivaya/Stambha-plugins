import { readdir, stat } from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  isRouteClass,
  isRouteDefinition,
  isRouteHandler,
  Route,
  type RouteLoadContext,
} from "./route/Route.js";
import type { HttpMethod, RouteDefinition } from "./types.js";

const METHODS = new Set<string>(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]);

const FILE_RE = /^(.+)\.(get|post|put|patch|delete|options|head)(\.(?:[cm]?js|[cm]?ts|mts|cts))?$/i;

export interface LoadRoutesOptions {
  /** Passed to `Route.create(ctx)` when present. */
  context?: RouteLoadContext;
  /** File extensions to load (default `.js`, `.mjs`, `.cjs`, `.ts`, `.mts`, `.cts`). */
  extensions?: readonly string[];
}

export interface ParsedRouteFile {
  /** Absolute file path. */
  file: string;
  /** URL path derived from folders + name (e.g. `/hello-world`, `/guilds/[id]`). */
  path: string;
  method: HttpMethod;
  /** Debug name from relative path. */
  name: string;
}

/**
 * Parse a route filename into method + path.
 *
 * Examples (relative to `routesDir`):
 * - `hello-world.get.ts` → `GET /hello-world`
 * - `guilds/[id].get.ts` → `GET /guilds/[id]`
 * - `users/profile.post.js` → `POST /users/profile`
 * - `index.get.ts` → `GET /`
 */
export function parseRouteFilename(file: string, routesDir: string): ParsedRouteFile | null {
  const abs = resolve(file);
  const root = resolve(routesDir);
  const rel = relative(root, abs);
  if (rel.startsWith("..") || rel === "") return null;

  const base = basename(rel);
  const match = FILE_RE.exec(base);
  if (!match) return null;

  const namePart = match[1];
  const methodRaw = match[2];
  if (!namePart || !methodRaw) return null;

  const method = methodRaw.toUpperCase() as HttpMethod;
  if (!METHODS.has(method)) return null;

  const dirPart = dirname(rel);
  const segments: string[] = [];
  if (dirPart && dirPart !== ".") {
    segments.push(...dirPart.split(sep).filter(Boolean));
  }

  // Dots in the name become path segments (guilds.[id].settings → guilds/[id]/settings)
  for (const part of namePart.split(".")) {
    if (!part || part === "index") continue;
    segments.push(part);
  }

  const path = segments.length === 0 ? "/" : `/${segments.join("/")}`;
  const name = rel.replace(/\\/g, "/");

  return { file: abs, path, method, name };
}

/**
 * Load route modules from a directory (`name.method.ts` files).
 *
 * Supported exports (first match wins):
 * 1. `default` or named export that is a {@link RouteDefinition}
 * 2. Class extending {@link Route} (optional `static create(ctx)`)
 * 3. `default` or `run` export that is a handler function (path/method from filename)
 */
export async function loadRoutes(
  routesDir: string,
  options: LoadRoutesOptions = {},
): Promise<RouteDefinition[]> {
  const root = resolve(routesDir);
  const extensions = options.extensions ?? [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"];
  const files = await walkFiles(root, extensions);
  const loaded: RouteDefinition[] = [];
  const ctx: RouteLoadContext = options.context ?? {};

  for (const file of files) {
    const parsed = parseRouteFilename(file, root);
    if (!parsed) continue;

    const mod = await import(pathToFileURL(file).href);
    const definition = await resolveModuleRoute(mod, parsed, ctx);
    if (definition) loaded.push(definition);
  }

  return loaded;
}

async function resolveModuleRoute(
  mod: Record<string, unknown>,
  parsed: ParsedRouteFile,
  ctx: RouteLoadContext,
): Promise<RouteDefinition | null> {
  const candidates = [
    mod.default,
    mod.route,
    mod.Route,
    ...Object.values(mod).filter((v) => v !== mod.default),
  ];

  for (const value of candidates) {
    if (isRouteDefinition(value)) {
      const name = value.name ?? parsed.name;
      return {
        ...value,
        ...(name !== undefined ? { name } : {}),
      };
    }

    if (isRouteClass(value)) {
      const instance =
        typeof value.create === "function"
          ? await value.create(ctx)
          : new (value as new () => Route)();
      return instance.toDefinition({
        path: parsed.path,
        method: parsed.method,
        name: parsed.name,
      });
    }

    if (value instanceof Route) {
      return value.toDefinition({
        path: parsed.path,
        method: parsed.method,
        name: parsed.name,
      });
    }
  }

  const run = mod.default ?? mod.run;
  if (isRouteHandler(run)) {
    return {
      path: parsed.path,
      method: parsed.method,
      name: parsed.name,
      run,
    };
  }

  return null;
}

async function walkFiles(dir: string, extensions: readonly string[]): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const out: string[] = [];
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        out.push(...(await walkFiles(full, extensions)));
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = extname(entry.name).toLowerCase();
      if (!extensions.includes(ext)) continue;
      // Skip declaration files
      if (
        entry.name.endsWith(".d.ts") ||
        entry.name.endsWith(".d.mts") ||
        entry.name.endsWith(".d.cts")
      ) {
        continue;
      }
      // Ensure it's a route-named file before expensive import
      if (!FILE_RE.test(entry.name)) continue;
      const s = await stat(full);
      if (s.isFile()) out.push(full);
    }
    return out;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return [];
    throw error;
  }
}
