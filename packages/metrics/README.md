# @stambha/metrics

**Prometheus observability** for Stambha — command counters, latency histograms, REST telemetry, and an optional `/metrics` HTTP server.

Part of [**Stambha plugins**](https://github.com/Mivaya/Stambha-plugins) · requires [`@stambha/core`](https://github.com/Mivaya/Stambha) · [Metrics deployment](https://github.com/mivaya/Stambha/tree/main/docs/deployment/metrics.md)

---

## Install

```bash
npm install @stambha/metrics @stambha/core
```

Requires **Node.js 20+**.

---

## Quick start

### Attach to the bot client

```ts
import { createStambhaBot } from "@stambha/core";
import { attachClientMetrics, createPrometheusMetrics } from "@stambha/metrics";

const client = createStambhaBot({ /* … */ });
const { register, collector } = createPrometheusMetrics({ prefix: "stambha" });

attachClientMetrics(client, collector);
```

### Expose `/metrics`

```ts
import { createMetricsServer } from "@stambha/metrics";

const server = await createMetricsServer({
  port: 9090,
  register,
});

console.log(`Metrics at ${server.url}`);
```

### REST worker telemetry

```ts
import { createPrometheusRestMetrics, restMetricsToTelemetry } from "@stambha/metrics";
import { createRestTelemetryListener } from "@stambha/rest";

const restMetrics = createPrometheusRestMetrics();
queue.addListener(createRestTelemetryListener(restMetricsToTelemetry(restMetrics)));
```

---

## Key exports

| Export | Purpose |
|--------|---------|
| `attachClientMetrics` | Hook pipeline events |
| `createPrometheusMetrics` | `prom-client` counters/histograms |
| `createMetricsServer` | Scrape endpoint |
| `createPrometheusRestMetrics` | REST queue stats |
| `InMemoryMetrics` | Dev/testing without Prometheus |

---

## Related packages

| Package | Role |
|---------|------|
| [`@stambha/core`](../core) | Client events |
| [`@stambha/rest`](../rest) | Rate-limit and request telemetry |

---

## Development

```bash
pnpm --filter @stambha/metrics build
pnpm --filter @stambha/metrics test
```
