import type { StambhaClient } from "@stambha/core";
import type { MetricsCollector } from "./types.js";

/** Subscribe to Stambha client events and forward them to a {@link MetricsCollector}. */
export function attachClientMetrics(
  client: StambhaClient,
  collector: MetricsCollector,
): () => void {
  const onReady = (): void => {
    collector.setReady(true);
  };

  const onSuccess = (payload: {
    ctx: { kind: import("@stambha/core").CommandKind };
    command: string;
    durationMs: number;
  }): void => {
    collector.recordCommand({
      command: payload.command,
      kind: payload.ctx.kind,
      outcome: "success",
      durationMs: payload.durationMs,
    });
  };

  const onError = (payload: {
    ctx: { kind: import("@stambha/core").CommandKind };
    command: string;
  }): void => {
    collector.recordCommand({
      command: payload.command,
      kind: payload.ctx.kind,
      outcome: "error",
    });
  };

  const onBlocked = (payload: {
    ctx: { commandName: string; kind: import("@stambha/core").CommandKind };
  }): void => {
    collector.recordCommand({
      command: payload.ctx.commandName,
      kind: payload.ctx.kind,
      outcome: "blocked",
    });
  };

  const onDenied = (payload: {
    ctx: { commandName: string; kind: import("@stambha/core").CommandKind };
  }): void => {
    collector.recordCommand({
      command: payload.ctx.commandName,
      kind: payload.ctx.kind,
      outcome: "denied",
    });
  };

  const onScoutError = (payload: { scout: string }): void => {
    collector.recordPieceError("scout", payload.scout);
  };

  const onHookError = (payload: { hook: string }): void => {
    collector.recordPieceError("hook", payload.hook);
  };

  const onSignalError = (payload: { signal: string }): void => {
    collector.recordPieceError("signal", payload.signal);
  };

  const onChronError = (payload: { chron: string }): void => {
    collector.recordPieceError("chron", payload.chron);
  };

  const onEpilogueError = (payload: { epilogue: string }): void => {
    collector.recordPieceError("epilogue", payload.epilogue);
  };

  client.on("ready", onReady);
  client.on("commandSuccess", onSuccess);
  client.on("commandError", onError);
  client.on("commandBlocked", onBlocked);
  client.on("commandDenied", onDenied);
  client.on("scoutError", onScoutError);
  client.on("hookError", onHookError);
  client.on("signalError", onSignalError);
  client.on("chronError", onChronError);
  client.on("epilogueError", onEpilogueError);

  return () => {
    client.off("ready", onReady);
    client.off("commandSuccess", onSuccess);
    client.off("commandError", onError);
    client.off("commandBlocked", onBlocked);
    client.off("commandDenied", onDenied);
    client.off("scoutError", onScoutError);
    client.off("hookError", onHookError);
    client.off("signalError", onSignalError);
    client.off("chronError", onChronError);
    client.off("epilogueError", onEpilogueError);
    collector.setReady(false);
  };
}
