import type { RestPort } from "@stambha/core";
import { fetchOAuthGuilds, guildIsManageable } from "../auth/discordOAuth.js";
import type { AuthRuntime } from "../auth/types.js";
import type { RouteDefinition } from "../types.js";

export function createGuildRoutes(
  runtime: AuthRuntime,
  getRestPort: () => RestPort | null,
): RouteDefinition[] {
  return [
    {
      name: "guilds.list",
      method: "GET",
      path: "/guilds",
      run: async (request, response) => {
        if (!request.session) {
          response.status(401).json({ error: "Unauthorized" });
          return;
        }
        const oauthGuilds = await fetchOAuthGuilds(request.session.accessToken);
        const rest = getRestPort();
        const result = [];
        for (const guild of oauthGuilds) {
          const manageable = guildIsManageable(guild, runtime.requiredPermission);
          if (!manageable) continue;
          const botPresent = rest ? await isBotInGuild(rest, guild.id) : false;
          result.push({
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            owner: guild.owner,
            permissions: guild.permissions,
            manageable,
            botPresent,
          });
        }
        response.json({ guilds: result });
      },
    },
    {
      name: "guilds.channels",
      method: "GET",
      path: "/guilds/[guildId]/channels",
      run: async (request, response) => {
        if (!(await assertGuildAccess(request, response, runtime, getRestPort()))) return;
        const rest = getRestPort();
        if (!rest) {
          response.status(503).json({ error: "REST port not configured" });
          return;
        }
        const guildId = request.params.guildId;
        if (!guildId) {
          response.status(400).json({ error: "Missing guild id" });
          return;
        }
        try {
          const channels = await rest.request<unknown[]>({
            method: "GET",
            route: `/guilds/${guildId}/channels`,
          });
          response.json({ channels });
        } catch {
          response.status(502).json({ error: "Failed to fetch channels" });
        }
      },
    },
    {
      name: "guilds.roles",
      method: "GET",
      path: "/guilds/[guildId]/roles",
      run: async (request, response) => {
        if (!(await assertGuildAccess(request, response, runtime, getRestPort()))) return;
        const rest = getRestPort();
        if (!rest) {
          response.status(503).json({ error: "REST port not configured" });
          return;
        }
        const guildId = request.params.guildId;
        if (!guildId) {
          response.status(400).json({ error: "Missing guild id" });
          return;
        }
        try {
          const roles = await rest.request<unknown[]>({
            method: "GET",
            route: `/guilds/${guildId}/roles`,
          });
          response.json({ roles });
        } catch {
          response.status(502).json({ error: "Failed to fetch roles" });
        }
      },
    },
  ];
}

export async function assertGuildAccess(
  request: import("../types.js").ApiRequest,
  response: import("../types.js").ApiResponse,
  runtime: AuthRuntime,
  rest: RestPort | null,
): Promise<boolean> {
  if (!request.session) {
    response.status(401).json({ error: "Unauthorized" });
    return false;
  }
  const guildId = request.params.guildId;
  if (!guildId) {
    response.status(400).json({ error: "Missing guild id" });
    return false;
  }

  const oauthGuilds = await fetchOAuthGuilds(request.session.accessToken);
  const guild = oauthGuilds.find((g) => g.id === guildId);
  if (!guild || !guildIsManageable(guild, runtime.requiredPermission)) {
    response.status(403).json({ error: "Forbidden" });
    return false;
  }

  if (rest) {
    const present = await isBotInGuild(rest, guildId);
    if (!present) {
      response.status(404).json({ error: "Bot is not in this guild" });
      return false;
    }
  }

  return true;
}

async function isBotInGuild(rest: RestPort, guildId: string): Promise<boolean> {
  try {
    await rest.request({ method: "GET", route: `/guilds/${guildId}` });
    return true;
  } catch {
    return false;
  }
}
