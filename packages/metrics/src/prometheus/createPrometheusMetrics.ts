import { Counter, Gauge, Histogram, Registry } from "prom-client";
import type { MetricsCollector } from "../types.js";

export interface PrometheusMetricsOptions {
  register?: Registry;
  /** Metric name prefix (default `stambha_`). */
  prefix?: string;
}

export interface PrometheusMetricsHandle {
  readonly register: Registry;
  readonly collector: MetricsCollector;
}

export function createPrometheusMetrics(options: PrometheusMetricsOptions = {}): PrometheusMetricsHandle {
  const register = options.register ?? new Registry();
  const prefix = options.prefix ?? "stambha_";

  const commandsTotal = new Counter({
    name: `${prefix}commands_total`,
    help: "Total commands processed by outcome",
    labelNames: ["command", "kind", "outcome"],
    registers: [register],
  });

  const commandDuration = new Histogram({
    name: `${prefix}command_duration_seconds`,
    help: "Command execution duration in seconds",
    labelNames: ["command", "kind"],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register],
  });

  const pieceErrorsTotal = new Counter({
    name: `${prefix}piece_errors_total`,
    help: "Errors from scouts, hooks, signals, chrons, and epilogues",
    labelNames: ["piece", "name"],
    registers: [register],
  });

  const botReady = new Gauge({
    name: `${prefix}bot_ready`,
    help: "1 when the Stambha client has emitted ready",
    registers: [register],
  });

  const collector: MetricsCollector = {
    setReady(ready) {
      botReady.set(ready ? 1 : 0);
    },
    recordCommand(event) {
      commandsTotal.inc({
        command: event.command,
        kind: event.kind,
        outcome: event.outcome,
      });
      if (event.outcome === "success" && event.durationMs !== undefined) {
        commandDuration.observe(
          { command: event.command, kind: event.kind },
          event.durationMs / 1000,
        );
      }
    },
    recordPieceError(piece, name) {
      pieceErrorsTotal.inc({ piece, name });
    },
  };

  return { register, collector };
}
