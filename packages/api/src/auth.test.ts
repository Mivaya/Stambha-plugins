import { afterEach, describe, expect, it, vi } from "vitest";
import { shouldListen } from "./auth/createAuthRuntime.js";
import { guildIsManageable, MANAGE_GUILD } from "./auth/discordOAuth.js";
import { MemoryOAuthStateStore, MemorySessionStore } from "./auth/MemorySessionStore.js";
import type { VaultLike } from "./auth/types.js";
import { createApiServer } from "./createApiServer.js";

const handles: Array<{ close(): Promise<void> }> = [];

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
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

function parseSetCookie(header: string | null): string | undefined {
  if (!header) return undefined;
  return header.split(";")[0];
}

describe("guildIsManageable", () => {
  it("allows owners and manage-guild bit", () => {
    expect(guildIsManageable({ owner: true, permissions: "0" })).toBe(true);
    expect(guildIsManageable({ owner: false, permissions: String(MANAGE_GUILD) })).toBe(true);
    expect(guildIsManageable({ owner: false, permissions: "0" })).toBe(false);
  });
});

describe("shouldListen", () => {
  it("respects STAMBHA_API_LISTEN=0", () => {
    const prev = process.env.STAMBHA_API_LISTEN;
    process.env.STAMBHA_API_LISTEN = "0";
    expect(shouldListen({}, undefined)).toBe(false);
    if (prev === undefined) delete process.env.STAMBHA_API_LISTEN;
    else process.env.STAMBHA_API_LISTEN = prev;
  });

  it("respects listenWhen", () => {
    expect(shouldListen({ listenWhen: () => false }, undefined)).toBe(false);
    expect(shouldListen({ listenWhen: () => true }, undefined)).toBe(true);
  });
});

describe("auth + guilds + settings", () => {
  it("rejects auth with wildcard origin", () => {
    expect(() =>
      createApiServer({
        auth: {
          clientId: "id",
          clientSecret: "secret",
          redirectUri: "http://localhost:4000/auth/callback",
        },
        origin: "*",
      }),
    ).toThrow(/explicit origin/);
  });

  it("completes OAuth callback, serves me/guilds/settings", async () => {
    const sessions = new MemorySessionStore();
    const states = new MemoryOAuthStateStore();
    await states.put({
      state: "test-state",
      codeVerifier: "verifier",
      expiresAt: Date.now() + 60_000,
    });

    const vaultData = new Map<string, Record<string, unknown>>();
    const vault: VaultLike = {
      ledger() {
        return {
          blueprint: {
            shape: { prefix: { type: "string", default: "!" } },
            defaults: () => ({ prefix: "!" }),
            validate: (data) => data as Record<string, unknown>,
            patch: (current, patch) => ({ ...current, ...patch }),
          },
          acquire(id: string) {
            const row = vaultData.get(id) ?? { prefix: "!" };
            return {
              async sync() {
                return this;
              },
              getAll: () => row,
              patch(partial: Record<string, unknown>) {
                Object.assign(row, partial);
                vaultData.set(id, row);
                return this;
              },
              async save() {
                vaultData.set(id, row);
                return this;
              },
            };
          },
        };
      },
    };

    const restPort = {
      async request<T>({ route }: { route: string }): Promise<T> {
        if (route === "/guilds/g1") return { id: "g1" } as T;
        if (route === "/guilds/g1/channels") return [{ id: "c1", name: "general" }] as T;
        if (route === "/guilds/g1/roles") return [{ id: "r1", name: "Admin" }] as T;
        throw new Error(`unexpected route ${route}`);
      },
    };

    const realFetch = globalThis.fetch.bind(globalThis);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("127.0.0.1") || url.includes("localhost")) {
          return realFetch(input, init);
        }
        if (url.includes("oauth2/token") && !url.includes("revoke")) {
          return new Response(
            JSON.stringify({
              access_token: "access",
              refresh_token: "refresh",
              expires_in: 3600,
              token_type: "Bearer",
              scope: "identify guilds",
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        if (url.endsWith("/users/@me")) {
          return new Response(JSON.stringify({ id: "u1", username: "alice", avatar: null }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }
        if (url.endsWith("/users/@me/guilds")) {
          return new Response(
            JSON.stringify([
              {
                id: "g1",
                name: "Test Guild",
                icon: null,
                owner: true,
                permissions: "0",
              },
              {
                id: "g2",
                name: "No Access",
                icon: null,
                owner: false,
                permissions: "0",
              },
            ]),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        if (url.includes("oauth2/token/revoke")) {
          return new Response(null, { status: 200 });
        }
        return new Response("not found", { status: 404 });
      }),
    );

    const server = createApiServer({
      listenOptions: { port: 0, host: "127.0.0.1" },
      origin: "http://localhost:3000",
      auth: {
        clientId: "client",
        clientSecret: "secret",
        redirectUri: "http://localhost:4000/auth/callback",
        pkce: true,
        sessionStore: sessions,
        stateStore: states,
        cookie: { secure: false, sameSite: "lax" },
      },
      vault,
      restPort,
    });
    const handle = await listen(server);

    const callback = await fetch(`${handle.url}/auth/callback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: "abc", state: "test-state" }),
    });
    expect(callback.status).toBe(200);
    const callbackBody = (await callback.json()) as { user: { id: string }; csrfToken: string };
    expect(callbackBody.user.id).toBe("u1");
    expect(callbackBody.csrfToken).toBeTruthy();

    const cookie = parseSetCookie(callback.headers.get("set-cookie"));
    expect(cookie).toBeTruthy();
    const cookieHeader = cookie ?? "";

    const me = await fetch(`${handle.url}/auth/me`, {
      headers: { cookie: cookieHeader },
    });
    expect(me.status).toBe(200);

    const guilds = await fetch(`${handle.url}/guilds`, {
      headers: { cookie: cookieHeader },
    });
    expect(guilds.status).toBe(200);
    const guildsBody = (await guilds.json()) as {
      guilds: Array<{ id: string; botPresent: boolean }>;
    };
    expect(guildsBody.guilds).toHaveLength(1);
    expect(guildsBody.guilds[0]?.id).toBe("g1");
    expect(guildsBody.guilds[0]?.botPresent).toBe(true);

    const schema = await fetch(`${handle.url}/guilds/g1/settings/schema`, {
      headers: { cookie: cookieHeader },
    });
    expect(schema.status).toBe(200);

    const patch = await fetch(`${handle.url}/guilds/g1/settings`, {
      method: "PATCH",
      headers: {
        cookie: cookieHeader,
        "content-type": "application/json",
        "x-csrf-token": callbackBody.csrfToken,
      },
      body: JSON.stringify({ prefix: "?" }),
    });
    expect(patch.status).toBe(200);
    const patched = (await patch.json()) as { settings: { prefix: string } };
    expect(patched.settings.prefix).toBe("?");

    const denied = await fetch(`${handle.url}/guilds/g1/settings`, {
      method: "PATCH",
      headers: {
        cookie: cookieHeader,
        "content-type": "application/json",
        "x-csrf-token": "wrong",
      },
      body: JSON.stringify({ prefix: "x" }),
    });
    expect(denied.status).toBe(403);

    const channels = await fetch(`${handle.url}/guilds/g1/channels`, {
      headers: { cookie: cookieHeader },
    });
    expect(channels.status).toBe(200);
  });
});
