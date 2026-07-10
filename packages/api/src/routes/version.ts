import type { RouteDefinition } from "../types.js";
import { API_PACKAGE_VERSION } from "../version.js";

export function createVersionRoute(): RouteDefinition {
  return {
    name: "version",
    method: "GET",
    path: "/version",
    async run(_request, response) {
      response.status(200).json({
        name: "@stambha/api",
        version: API_PACKAGE_VERSION,
      });
    },
  };
}
