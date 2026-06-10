import { describe, expect, it } from "vitest";
import { createPrometheusRestMetrics } from "./createPrometheusRestMetrics.js";

describe("createPrometheusRestMetrics", () => {
  it("records REST request and rate-limit events", async () => {
    const { register, collector } = createPrometheusRestMetrics();

    collector.recordRestRequest({
      method: "GET",
      route: "/channels/:id/messages",
      status: 200,
      durationMs: 50,
    });
    collector.recordRestRateLimit("abc123");
    collector.recordRestWait("abc123", 500);

    const text = await register.metrics();
    expect(text).toContain("stambha_rest_requests_total");
    expect(text).toContain('method="GET"');
    expect(text).toContain("stambha_rest_rate_limits_total");
    expect(text).toContain("stambha_rest_wait_duration_seconds");
  });
});
