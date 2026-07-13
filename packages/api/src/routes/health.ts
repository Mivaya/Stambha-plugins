import type { StambhaClient } from "@stambha/core";
import type { RouteDefinition } from "../types.js";

export function createHealthRoute(client?: StambhaClient): RouteDefinition {
  return {
    name: "health",
    method: "GET",
    path: "/health",
    async run(_request, response) {
      response.status(200).json({
        ok: true,
        ...(client
          ? {
              tier: client.tier,
              workerRole: client.workerRole,
              ready: client.isReady,
            }
          : {}),
      });
    },
  };
}
