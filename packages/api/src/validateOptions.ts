import type { ApiServerOptions } from "./types.js";

export interface ResolvedApiServerOptions {
  prefix: string;
  origins: string[];
  credentials: boolean;
  maximumBodyLength: number;
  port: number;
  host: string;
  trustProxy: boolean;
}

export function resolveApiServerOptions(options: ApiServerOptions = {}): ResolvedApiServerOptions {
  const credentials = options.credentials ?? false;
  const originInput = options.origin ?? "*";
  const origins = (Array.isArray(originInput) ? [...originInput] : [originInput]).map((o) =>
    o.trim(),
  );

  if (origins.length === 0) {
    throw new Error("@stambha/api: origin must not be empty");
  }

  if (credentials && origins.includes("*")) {
    throw new Error(
      '@stambha/api: credentials cannot be used with origin "*". Set explicit origin(s).',
    );
  }

  const listen = options.listenOptions ?? {};
  const port = listen.port ?? 4000;
  const host = listen.host ?? "127.0.0.1";

  return {
    prefix: options.prefix ?? "",
    origins,
    credentials,
    maximumBodyLength: options.maximumBodyLength ?? 1_048_576,
    port,
    host,
    trustProxy: options.trustProxy ?? false,
  };
}
