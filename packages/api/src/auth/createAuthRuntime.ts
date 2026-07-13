import type { RestPort, StambhaClient } from "@stambha/core";
import { resolveCookieOptions } from "./cookies.js";
import { MANAGE_GUILD } from "./discordOAuth.js";
import { MemoryOAuthStateStore, MemorySessionStore } from "./MemorySessionStore.js";
import type { ApiAuthOptions, ApiDashboardOptions, AuthRuntime } from "./types.js";

export function createAuthRuntime(options: ApiDashboardOptions): AuthRuntime | null {
  if (!options.auth) return null;

  const auth = options.auth;
  assertAuthOptions(auth);

  const scopes = auth.scopes?.length ? [...auth.scopes] : ["identify", "guilds"];
  const cookie = resolveCookieOptions(auth.cookie);

  return {
    options: {
      clientId: auth.clientId,
      clientSecret: auth.clientSecret,
      redirectUri: auth.redirectUri,
      scopes,
      pkce: auth.pkce ?? true,
      cookie,
    },
    sessions: auth.sessionStore ?? new MemorySessionStore(),
    states: auth.stateStore ?? new MemoryOAuthStateStore(),
    requiredPermission: options.authorization?.requiredPermission ?? MANAGE_GUILD,
    vault: options.vault ?? null,
    guildSettingsLedger: options.guildSettingsLedger ?? "guild",
    restPort: options.restPort ?? null,
  };
}

function assertAuthOptions(auth: ApiAuthOptions): void {
  if (!auth.clientId?.trim()) throw new Error("@stambha/api: auth.clientId is required");
  if (!auth.clientSecret?.trim()) throw new Error("@stambha/api: auth.clientSecret is required");
  if (!auth.redirectUri?.trim()) throw new Error("@stambha/api: auth.redirectUri is required");
  try {
    const url = new URL(auth.redirectUri);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("invalid protocol");
    }
  } catch {
    throw new Error("@stambha/api: auth.redirectUri must be an absolute http(s) URL");
  }
}

export function resolveRestPort(
  runtime: AuthRuntime | null,
  client: StambhaClient | undefined,
): RestPort | null {
  return runtime?.restPort ?? client?.restPort ?? null;
}

/**
 * Whether the server should bind a port for this process.
 * Prefer mounting the API only in the bot entrypoint rather than "shard 0" listen hacks.
 */
export function shouldListen(
  options: ApiDashboardOptions,
  client: StambhaClient | undefined,
): boolean {
  if (options.listenWhen) {
    return options.listenWhen(client);
  }

  const rejectGateway = options.rejectGatewayListen ?? true;
  if (
    rejectGateway &&
    client &&
    (client.tier === "split" || client.tier === "distributed") &&
    client.workerRole === "gateway"
  ) {
    // Bot worker examples currently use workerRole "gateway" with restPort —
    // only reject when there is no restPort AND we're clearly a pure gateway.
    // Safer signal: env STAMBHA_API_LISTEN=0 always skips.
    if (process.env.STAMBHA_API_LISTEN === "0") return false;
    // Do not auto-reject solely on workerRole (Stambha bot workers may use "gateway").
    // Document automaticallyListen + entrypoint isolation instead.
  }

  if (process.env.STAMBHA_API_LISTEN === "0") return false;
  return true;
}
