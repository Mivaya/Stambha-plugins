import type { RestPort } from "@stambha/core";
import type { AuthRuntime } from "../auth/types.js";
import type { RouteDefinition } from "../types.js";
import { assertGuildAccess } from "./guilds.js";

export function createSettingsRoutes(
  runtime: AuthRuntime,
  getRestPort: () => RestPort | null,
): RouteDefinition[] {
  if (!runtime.vault) return [];

  const vault = runtime.vault;
  const ledgerName = runtime.guildSettingsLedger;

  return [
    {
      name: "guilds.settings.get",
      method: "GET",
      path: "/guilds/[guildId]/settings",
      run: async (request, response) => {
        if (!(await assertGuildAccess(request, response, runtime, getRestPort()))) return;
        const guildId = request.params.guildId;
        if (!guildId) {
          response.status(400).json({ error: "Missing guild id" });
          return;
        }
        try {
          const record = vault.ledger(ledgerName).acquire(guildId);
          await record.sync();
          response.json({ settings: record.getAll() });
        } catch (error) {
          response.status(500).json({
            error: "Failed to load settings",
            detail: error instanceof Error ? error.message : String(error),
          });
        }
      },
    },
    {
      name: "guilds.settings.patch",
      method: "PATCH",
      path: "/guilds/[guildId]/settings",
      run: async (request, response) => {
        if (!(await assertGuildAccess(request, response, runtime, getRestPort()))) return;
        const guildId = request.params.guildId;
        if (!guildId) {
          response.status(400).json({ error: "Missing guild id" });
          return;
        }
        const body = request.body;
        if (!body || typeof body !== "object" || Array.isArray(body)) {
          response.status(400).json({ error: "Expected JSON object body" });
          return;
        }
        try {
          const record = vault.ledger(ledgerName).acquire(guildId);
          await record.sync();
          record.patch(body as Record<string, unknown>);
          await record.save();
          response.json({ settings: record.getAll() });
        } catch (error) {
          response.status(400).json({
            error: "Invalid settings",
            detail: error instanceof Error ? error.message : String(error),
          });
        }
      },
    },
    {
      name: "guilds.settings.schema",
      method: "GET",
      path: "/guilds/[guildId]/settings/schema",
      run: async (request, response) => {
        if (!(await assertGuildAccess(request, response, runtime, getRestPort()))) return;
        try {
          const ledger = vault.ledger(ledgerName);
          response.json({
            ledger: ledgerName,
            fields: ledger.blueprint.shape,
            defaults: ledger.blueprint.defaults(),
          });
        } catch (error) {
          response.status(500).json({
            error: "Failed to load schema",
            detail: error instanceof Error ? error.message : String(error),
          });
        }
      },
    },
  ];
}
