import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { createApiServer, createApiServerAsync } from "./createApiServer.js";
import { loadRoutes, parseRouteFilename } from "./loadRoutes.js";
import { Route } from "./route/Route.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__", "routes");

const handles: Array<{ close(): Promise<void> }> = [];

afterEach(async () => {
  while (handles.length > 0) {
    const h = handles.pop();
    if (h) await h.close();
  }
});

describe("parseRouteFilename", () => {
  it("maps name.method files to method + path", () => {
    expect(parseRouteFilename(join(fixturesDir, "hello-world.get.mjs"), fixturesDir)).toEqual(
      expect.objectContaining({
        method: "GET",
        path: "/hello-world",
      }),
    );
    expect(parseRouteFilename(join(fixturesDir, "echo.post.mjs"), fixturesDir)).toEqual(
      expect.objectContaining({
        method: "POST",
        path: "/echo",
      }),
    );
    expect(parseRouteFilename(join(fixturesDir, "nested", "status.get.mjs"), fixturesDir)).toEqual(
      expect.objectContaining({
        method: "GET",
        path: "/nested/status",
      }),
    );
    expect(parseRouteFilename(join(fixturesDir, "guilds", "[id].get.mjs"), fixturesDir)).toEqual(
      expect.objectContaining({
        method: "GET",
        path: "/guilds/[id]",
      }),
    );
  });

  it("returns null for non-route filenames", () => {
    expect(parseRouteFilename(join(fixturesDir, "readme.md"), fixturesDir)).toBeNull();
  });
});

describe("Route", () => {
  it("toDefinition uses instance path/method or fallbacks", () => {
    class Hello extends Route {
      readonly path = "/hello";
      readonly method = "GET" as const;
      run(_req: never, res: { json: (v: unknown) => void }) {
        res.json({ ok: true });
      }
    }
    const def = new Hello().toDefinition();
    expect(def.path).toBe("/hello");
    expect(def.method).toBe("GET");
  });
});

describe("loadRoutes", () => {
  it("loads handler, definition, and Route class modules", async () => {
    const routes = await loadRoutes(fixturesDir);
    const byPath = new Map(routes.map((r) => [`${r.method} ${r.path}`, r]));

    expect(byPath.has("GET /hello-world")).toBe(true);
    expect(byPath.has("POST /echo")).toBe(true);
    expect(byPath.has("GET /nested/status")).toBe(true);
    expect(byPath.has("GET /guilds/[id]")).toBe(true);
    expect(byPath.has("GET /custom-path")).toBe(true);
    expect(byPath.has("GET /class-route")).toBe(true);
    expect(byPath.has("GET /di-route")).toBe(true);
  });

  it("passes context to Route.create", async () => {
    const routes = await loadRoutes(fixturesDir, {
      context: { client: { id: "bot" } as never },
    });
    const di = routes.find((r) => r.path === "/di-route");
    expect(di).toBeDefined();

    const json: unknown[] = [];
    await di!.run(
      {} as never,
      {
        json: (v: unknown) => {
          json.push(v);
        },
      } as never,
    );
    expect(json[0]).toEqual({ di: "with-client" });
  });

  it("returns empty array for missing directory", async () => {
    await expect(loadRoutes(join(fixturesDir, "does-not-exist"))).resolves.toEqual([]);
  });
});

describe("createApiServerAsync + routesDir", () => {
  it("throws from sync createApiServer when routesDir is set", () => {
    expect(() => createApiServer({ routesDir: fixturesDir })).toThrow(/createApiServerAsync/);
  });

  it("merges file routes and serves them", async () => {
    const server = await createApiServerAsync({
      listenOptions: { port: 0, host: "127.0.0.1" },
      routesDir: fixturesDir,
      routes: [
        {
          method: "GET",
          path: "/inline",
          run: async (_req, res) => {
            res.json({ inline: true });
          },
        },
      ],
    });
    const handle = await server.listen();
    handles.push(handle);

    const hello = await fetch(`${handle.url}/hello-world`);
    expect(hello.status).toBe(200);
    expect(await hello.json()).toEqual({ hello: "world" });

    const nested = await fetch(`${handle.url}/nested/status`);
    expect(nested.status).toBe(200);
    expect(await nested.json()).toEqual({ nested: true });

    const guild = await fetch(`${handle.url}/guilds/abc`);
    expect(guild.status).toBe(200);
    expect(await guild.json()).toEqual({ id: "abc" });

    const custom = await fetch(`${handle.url}/custom-path`);
    expect(custom.status).toBe(200);
    expect(await custom.json()).toEqual({ custom: true });

    const inline = await fetch(`${handle.url}/inline`);
    expect(inline.status).toBe(200);
    expect(await inline.json()).toEqual({ inline: true });

    const echo = await fetch(`${handle.url}/echo`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ n: 1 }),
    });
    expect(echo.status).toBe(200);
    expect(await echo.json()).toEqual({ body: { n: 1 } });
  });
});
