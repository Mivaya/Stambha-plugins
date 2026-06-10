import type { CommandKind } from "@stambha/core";

export type CommandOutcome = "success" | "error" | "blocked" | "denied";

export type PieceKind = "scout" | "hook" | "signal" | "chron" | "epilogue";

/** Transport-agnostic metrics sink wired via {@link attachClientMetrics}. */
export interface MetricsCollector {
  setReady(ready: boolean): void;
  recordCommand(event: {
    command: string;
    kind: CommandKind;
    outcome: CommandOutcome;
    durationMs?: number;
  }): void;
  recordPieceError(piece: PieceKind, name: string): void;
}
