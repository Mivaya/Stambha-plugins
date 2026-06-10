import { describe, expect, it } from "vitest";
import { Registry } from "prom-client";
import { createMetricsServer } from "./createMetricsServer.js";
import { createPrometheusMetrics } from "./createPrometheusMetrics.js";

describe("createMetricsServer", () => {
  it("serves Prometheus text on /metrics", async () => {
    const { register, collector } = createPrometheusMetrics({ register: new Registry() });
    collector.setReady(true);
    collector.recordCommand({ command: "ping", kind: "slash", outcome: "success", durationMs: 5 });

    const server = await createMetricsServer({ port: 0, register });
    const port = Number(new URL(server.url).port);

    const res = await fetch(`${server.url}/metrics`);
    const body = await res.text();

    expect(res.ok).toBe(true);
    expect(body).toContain("stambha_bot_ready");
    expect(body).toContain("stambha_commands_total");

    const health = await fetch(`${server.url}/health`);
    expect(health.ok).toBe(true);

    await server.close();
    expect(port).toBeGreaterThan(0);
  });
});
