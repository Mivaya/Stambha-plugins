import { Counter, Histogram, Registry } from "prom-client";
import type { RestMetricsCollector } from "./types.js";

export interface PrometheusRestMetricsOptions {
  register?: Registry;
  prefix?: string;
}

export interface PrometheusRestMetricsHandle {
  readonly register: Registry;
  readonly collector: RestMetricsCollector;
}

export function createPrometheusRestMetrics(
  options: PrometheusRestMetricsOptions = {},
): PrometheusRestMetricsHandle {
  const register = options.register ?? new Registry();
  const prefix = options.prefix ?? "stambha_";

  const requestsTotal = new Counter({
    name: `${prefix}rest_requests_total`,
    help: "Discord REST requests from native worker",
    labelNames: ["method", "route", "status"],
    registers: [register],
  });

  const requestDuration = new Histogram({
    name: `${prefix}rest_request_duration_seconds`,
    help: "Native REST request duration in seconds",
    labelNames: ["method", "route"],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register],
  });

  const rateLimitsTotal = new Counter({
    name: `${prefix}rest_rate_limits_total`,
    help: "HTTP 429 rate-limit hits on native REST worker",
    labelNames: ["bucket"],
    registers: [register],
  });

  const waitDuration = new Histogram({
    name: `${prefix}rest_wait_duration_seconds`,
    help: "Time spent waiting on rate-limit buckets before REST calls",
    labelNames: ["bucket"],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
    registers: [register],
  });

  const collector: RestMetricsCollector = {
    recordRestRequest(event) {
      requestsTotal.inc({
        method: event.method,
        route: event.route,
        status: String(event.status),
      });
      requestDuration.observe(
        { method: event.method, route: event.route },
        event.durationMs / 1000,
      );
    },
    recordRestRateLimit(bucketId) {
      rateLimitsTotal.inc({ bucket: bucketId });
    },
    recordRestWait(bucketId, waitMs) {
      waitDuration.observe({ bucket: bucketId }, waitMs / 1000);
    },
  };

  return { register, collector };
}
