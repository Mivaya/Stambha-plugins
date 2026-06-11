import { StambhaClient } from "@stambha/core";
import { describe, expect, it } from "vitest";
import { attachClientMetrics } from "./attachClientMetrics.js";
import { InMemoryMetrics } from "./InMemoryMetrics.js";

describe("attachClientMetrics", () => {
  it("records command success and errors", () => {
    const client = new StambhaClient();
    const metrics = new InMemoryMetrics();
    const detach = attachClientMetrics(client, metrics);

    client.emit("ready");
    expect(metrics.ready).toBe(true);

    client.emit("commandSuccess", {
      ctx: {
        kind: "slash",
        commandName: "ping",
        userId: "1",
        guildId: null,
        channelId: "c",
        raw: null,
        reply: async () => undefined,
        replyEphemeral: async () => undefined,
      },
      command: "ping",
      durationMs: 12,
    });

    client.emit("commandError", {
      ctx: {
        kind: "prefix",
        commandName: "fail",
        userId: "1",
        guildId: null,
        channelId: "c",
        raw: null,
        reply: async () => undefined,
        replyEphemeral: async () => undefined,
      },
      command: "fail",
      error: new Error("boom"),
    });

    client.emit("scoutError", { scout: "spam", error: new Error("x"), ctx: {} as never });

    expect(metrics.commands).toEqual([
      { command: "ping", kind: "slash", outcome: "success", durationMs: 12 },
      { command: "fail", kind: "prefix", outcome: "error" },
    ]);
    expect(metrics.errors).toEqual([{ piece: "scout", name: "spam" }]);

    detach();
    expect(metrics.ready).toBe(false);
  });
});
