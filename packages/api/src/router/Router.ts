import type { HttpMethod, RouteDefinition, RouteHandler } from "../types.js";

interface RouterNode {
  staticChildren: Map<string, RouterNode>;
  paramChild: { name: string; node: RouterNode } | null;
  methods: Map<HttpMethod, { handler: RouteHandler; name: string }>;
}

export interface RouteMatch {
  handler: RouteHandler;
  name: string;
  params: Record<string, string>;
  allowedMethods: HttpMethod[];
}

function createNode(): RouterNode {
  return {
    staticChildren: new Map(),
    paramChild: null,
    methods: new Map(),
  };
}

/** Normalize path: ensure leading slash, strip trailing slash (except root). */
export function normalizePath(path: string): string {
  let p = path.trim();
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

export function joinPrefix(prefix: string, path: string): string {
  const p = normalizePath(prefix || "/");
  const rest = normalizePath(path);
  if (p === "/") return rest;
  if (rest === "/") return p;
  return `${p}${rest}`;
}

/**
 * Compact trie router: static segments + one `[param]` dynamic child per level.
 */
export class Router {
  private readonly root = createNode();

  add(route: RouteDefinition): void {
    const path = normalizePath(route.path);
    const parts = path === "/" ? [] : path.slice(1).split("/");
    let node = this.root;

    for (const part of parts) {
      if (part.startsWith("[") && part.endsWith("]") && part.length > 2) {
        const name = part.slice(1, -1);
        if (!node.paramChild) {
          node.paramChild = { name, node: createNode() };
        } else if (node.paramChild.name !== name) {
          throw new Error(
            `@stambha/api: conflicting param names at same level ("${node.paramChild.name}" vs "${name}")`,
          );
        }
        node = node.paramChild.node;
        continue;
      }

      let child = node.staticChildren.get(part);
      if (!child) {
        child = createNode();
        node.staticChildren.set(part, child);
      }
      node = child;
    }

    if (node.methods.has(route.method)) {
      throw new Error(`@stambha/api: duplicate route ${route.method} ${path}`);
    }
    node.methods.set(route.method, {
      handler: route.run,
      name: route.name ?? `${route.method} ${path}`,
    });
  }

  match(method: HttpMethod, path: string): RouteMatch | null {
    const normalized = normalizePath(path);
    const parts = normalized === "/" ? [] : normalized.slice(1).split("/");
    const params: Record<string, string> = {};
    let node: RouterNode | null = this.root;

    for (const part of parts) {
      if (!node) return null;
      const staticChild = node.staticChildren.get(part);
      if (staticChild) {
        node = staticChild;
        continue;
      }
      if (node.paramChild) {
        params[node.paramChild.name] = decodeURIComponent(part);
        node = node.paramChild.node;
        continue;
      }
      return null;
    }

    if (!node) return null;
    const allowedMethods = [...node.methods.keys()];
    const found = node.methods.get(method);
    if (!found) {
      return allowedMethods.length > 0
        ? {
            handler: async (_req, res) => {
              res.status(405).header("allow", allowedMethods.join(", ")).json({
                error: "Method Not Allowed",
              });
            },
            name: "method-not-allowed",
            params,
            allowedMethods,
          }
        : null;
    }

    return {
      handler: found.handler,
      name: found.name,
      params,
      allowedMethods,
    };
  }
}
