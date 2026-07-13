import { definePlugin } from "@stambha/plugins";
import { type ApiServer, createApiServer } from "./createApiServer.js";
import type { ApiServerHandle, ApiServerOptions } from "./types.js";

export interface ApiPluginOptions extends Omit<ApiServerOptions, "client"> {
  /** When false, do not call listen in postStart (default true). */
  automaticallyListen?: boolean;
}

export interface ApiPluginHandle {
  readonly server: ApiServer;
  readonly listenHandle: ApiServerHandle | null;
  close(): Promise<void>;
}

/**
 * Stambha plugin that starts the HTTP API on `postStart` and exposes a close handle.
 *
 * ```ts
 * import { attachPlugins } from "@stambha/plugins";
 * import { createApiPlugin } from "@stambha/api";
 *
 * const api = createApiPlugin({ listenOptions: { port: 4000 } });
 * await attachPlugins(client, { plugins: [api.plugin] });
 * // after client.start() — server is listening
 * ```
 */
export function createApiPlugin(options: ApiPluginOptions = {}): {
  plugin: ReturnType<typeof definePlugin>;
  getHandle: () => ApiPluginHandle | null;
} {
  let handle: ApiPluginHandle | null = null;
  const automaticallyListen = options.automaticallyListen ?? true;

  const plugin = definePlugin("api", {
    postStart: async ({ client }) => {
      const server = createApiServer({
        ...options,
        client,
      });

      let listenHandle: ApiServerHandle | null = null;
      if (automaticallyListen) {
        listenHandle = await server.listen();
      }

      handle = {
        server,
        listenHandle,
        async close() {
          if (listenHandle) await listenHandle.close();
          listenHandle = null;
        },
      };
    },
  });

  return {
    plugin,
    getHandle: () => handle,
  };
}

/** Compatibility alias for `createApiPlugin`. */
export const createDashboardPlugin = createApiPlugin;
