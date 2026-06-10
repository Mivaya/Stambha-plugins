import { createServer, type Server } from "node:http";
import type { Registry } from "prom-client";

export interface MetricsServerOptions {
  port: number;
  host?: string;
  register: Registry;
  path?: string;
}

export interface MetricsServerHandle {
  readonly url: string;
  close(): Promise<void>;
}

export function createMetricsServer(options: MetricsServerOptions): Promise<MetricsServerHandle> {
  const host = options.host ?? "127.0.0.1";
  const metricsPath = options.path ?? "/metrics";

  const server: Server = createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method === "GET" && req.url === metricsPath) {
      const body = await options.register.metrics();
      res.writeHead(200, { "Content-Type": options.register.contentType });
      res.end(body);
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port, host, () => {
      const addr = server.address();
      const actualPort =
        typeof addr === "object" && addr !== null ? addr.port : options.port;
      resolve({
        url: `http://${host}:${actualPort}`,
        close: () =>
          new Promise<void>((closeResolve, closeReject) => {
            server.close((err) => (err ? closeReject(err) : closeResolve()));
          }),
      });
    });
  });
}
