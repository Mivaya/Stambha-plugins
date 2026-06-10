/** REST worker telemetry (native `@stambha/rest` rate-limit queue). */
export interface RestMetricsCollector {
  recordRestRequest(event: {
    method: string;
    route: string;
    status: number;
    durationMs: number;
  }): void;
  recordRestRateLimit(bucketId: string): void;
  recordRestWait(bucketId: string, waitMs: number): void;
}

/** Map {@link RestMetricsCollector} to `@stambha/rest` {@link RestTelemetry}. */
export function restMetricsToTelemetry(collector: RestMetricsCollector): {
  recordRequest(event: {
    method: string;
    route: string;
    status: number;
    durationMs: number;
  }): void;
  recordRateLimit(bucketId: string): void;
  recordWait(bucketId: string, waitMs: number): void;
} {
  return {
    recordRequest: (event) => collector.recordRestRequest(event),
    recordRateLimit: (bucketId) => collector.recordRestRateLimit(bucketId),
    recordWait: (bucketId, waitMs) => collector.recordRestWait(bucketId, waitMs),
  };
}
