import { afterEach, describe, expect, it } from "vitest";
import { createApiServer } from "./createApiServer.js";
import { joinPrefix, normalizePath, Router } from "./router/Router.js";
import { resolveApiServerOptions } from "./validateOptions.js";

const handles: Array<{ close(): Promise<void> }> = [];

afterEach(async () => {
  while (handles.length > 0) {
    const h = handles.pop();
    if (h) await h.close();
  }
});

async function listen(server: ReturnType<typeof createApiServer>) {
  const handle = await server.listen();
  handles.push(handle);
  return handle;
}

describe("validateOptions", () => {
  it("rejects credentials with wildcard origin", () => {
    expect(() => resolveApiServerOptions({ credentials: true, origin: "*" })).toThrow(
      /credentials cannot be used/,
    );
  });

  it("allows credentials with explicit origins", () => {
    const resolved = resolveApiServerOptions({
      credentials: true,
      origin: ["https://panel.example.com"],
    });
    expect(resolved.credentials).toBe(true);
    expect(resolved.origins).toEqual(["https://panel.example.com"]);
  });
});

describe("Router", () => {
  it("matches static and param routes", async () => {
    const router = new Router();
    router.add({
      method: "GET",
      path: "/guilds/[id]",
      run: async (req, res) => {
        res.json({ id: req.params.id });
      },
    });

    const match = router.match("GET", "/guilds/abc");
    expect(match).not.toBeNull();
    expect(match?.params.id).toBe("abc");
  });

  it("normalizes paths and prefixes", () => {
    expect(normalizePath("health")).toBe("/health");
    expect(normalizePath("/health/")).toBe("/health");
    expect(joinPrefix("/api", "/health")).toBe("/api/health");
    expect(joinPrefix("api/", "guilds/[id]")).toBe("/api/guilds/[id]");
  });
});

describe("createApiServer", () => {
  it("serves health and version", async () => {
    const server = createApiServer({
      listenOptions: { port: 0, host: "127.0.0.1" },
    });
    const handle = await listen(server);

    const health = await fetch(`${handle.url}/health`);
    expect(health.status).toBe(200);
    const healthBody = (await health.json()) as { ok: boolean };
    expect(healthBody.ok).toBe(true);
    expect(health.headers.get("x-request-id")).toBeTruthy();

    const version = await fetch(`${handle.url}/version`);
    expect(version.status).toBe(200);
    const versionBody = (await version.json()) as { name: string; version: string };
    expect(versionBody.name).toBe("@stambha/api");
    expect(versionBody.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("applies prefix to built-in routes", async () => {
    const server = createApiServer({
      prefix: "/api",
      listenOptions: { port: 0, host: "127.0.0.1" },
    });
    const handle = await listen(server);

    expect((await fetch(`${handle.url}/health`)).status).toBe(404);
    const res = await fetch(`${handle.url}/api/health`);
    expect(res.status).toBe(200);
  });

  it("parses JSON bodies and enforces size", async () => {
    const server = createApiServer({
      maximumBodyLength: 32,
      listenOptions: { port: 0, host: "127.0.0.1" },
      routes: [
        {
          method: "POST",
          path: "/echo",
          run: async (req, res) => {
            res.json({ body: req.body });
          },
        },
      ],
    });
    const handle = await listen(server);

    const ok = await fetch(`${handle.url}/echo`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ a: 1 }),
    });
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ body: { a: 1 } });

    const tooBig = await fetch(`${handle.url}/echo`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: "x".repeat(100) }),
    });
    expect(tooBig.status).toBe(413);
  });

  it("sets CORS headers for allowed origins", async () => {
    const server = createApiServer({
      origin: "https://panel.example.com",
      credentials: true,
      listenOptions: { port: 0, host: "127.0.0.1" },
    });
    const handle = await listen(server);

    const res = await fetch(`${handle.url}/health`, {
      headers: { origin: "https://panel.example.com" },
    });
    expect(res.headers.get("access-control-allow-origin")).toBe("https://panel.example.com");
    expect(res.headers.get("access-control-allow-credentials")).toBe("true");
  });

  it("handles OPTIONS preflight", async () => {
    const server = createApiServer({
      listenOptions: { port: 0, host: "127.0.0.1" },
    });
    const handle = await listen(server);
    const res = await fetch(`${handle.url}/health`, { method: "OPTIONS" });
    expect(res.status).toBe(204);
  });
});
