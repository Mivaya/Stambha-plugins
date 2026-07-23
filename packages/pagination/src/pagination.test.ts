import {
  ComponentType,
  MessageFlags,
  type ReplyPayload,
  type RestPort,
  type SignalContext,
  StambhaClient,
} from "@stambha/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { embedToMarkdown, pageTextBlocks } from "./components.js";
import { createPaginator } from "./createPaginator.js";
import { paginationCustomId, parsePaginationSuffix } from "./ids.js";
import { PaginationSignal } from "./PaginationSignal.js";
import { clearSessions, getSession } from "./session.js";

afterEach(() => {
  clearSessions();
});

function mockCtx(overrides: Partial<SignalContext> & { customId: string }): SignalContext {
  return {
    signalName: "pagination",
    userId: "user-1",
    guildId: "guild-1",
    channelId: "channel-1",
    values: [],
    raw: { id: "interaction-1", token: "token-1" },
    reply: vi.fn(async () => undefined),
    replyEphemeral: vi.fn(async () => undefined),
    ...overrides,
  };
}

function v2Buttons(message: ReplyPayload) {
  const container = message.components?.[0] as {
    type: number;
    components: Array<{
      type: number;
      content?: string;
      components?: Array<{ custom_id: string; disabled?: boolean; label: string }>;
    }>;
  };
  const row = container.components.find((c) => c.type === ComponentType.ActionRow);
  return row?.components ?? [];
}

describe("ids", () => {
  it("builds and parses custom ids", () => {
    const id = paginationCustomId("next", "abc123");
    expect(id).toBe("stambha:pagination:next:abc123");
    expect(parsePaginationSuffix("next:abc123")).toEqual({
      action: "next",
      sessionId: "abc123",
    });
    expect(parsePaginationSuffix("nope")).toBeNull();
  });
});

describe("pageTextBlocks / embedToMarkdown", () => {
  it("converts embeds to markdown", () => {
    expect(
      embedToMarkdown({
        title: "Hello",
        description: "World",
        fields: [{ name: "A", value: "1" }],
      }),
    ).toBe("# Hello\n\nWorld\n\n**A**\n\n1");
  });

  it("merges content, displays, and embeds", () => {
    expect(
      pageTextBlocks({
        content: "hi",
        displays: ["extra"],
        embeds: [{ title: "T" }],
      }),
    ).toEqual(["hi", "extra", "# T"]);
  });
});

describe("createPaginator", () => {
  it("builds a Components V2 first page with prev disabled when not wrapping", async () => {
    const paginator = await createPaginator({
      pages: [{ content: "page 1" }, { content: "page 2" }, { embeds: [{ title: "page 3" }] }],
      userId: "user-1",
    });

    const message = paginator.message();
    expect(message.flags).toBe(MessageFlags.IsComponentsV2);
    expect(message.content).toBeUndefined();
    expect(message.embeds).toBeUndefined();
    expect(message.components).toHaveLength(1);

    const container = message.components?.[0] as { type: number; components: unknown[] };
    expect(container.type).toBe(ComponentType.Container);

    const buttons = v2Buttons(message);
    expect(buttons).toHaveLength(3);
    expect(buttons[0]?.disabled).toBe(true);
    expect(buttons[1]?.disabled).toBeUndefined();
    expect(buttons[0]?.custom_id).toBe(paginationCustomId("prev", paginator.sessionId));
    expect(getSession(paginator.sessionId)?.index).toBe(0);
  });

  it("supports classic variant with content + action row", async () => {
    const paginator = await createPaginator({
      pages: [{ content: "legacy", embeds: [{ title: "E" }] }],
      variant: "classic",
    });
    const message = paginator.message();
    expect(message.flags).toBeUndefined();
    expect(message.content).toBe("legacy");
    expect(message.embeds).toEqual([{ title: "E" }]);
    expect((message.components?.[0] as { type: number }).type).toBe(ComponentType.ActionRow);
  });

  it("rejects empty pages", async () => {
    await expect(createPaginator({ pages: [] })).rejects.toThrow(/non-empty/);
  });
});

describe("PaginationSignal", () => {
  it("advances pages via RestPort type 7 update (V2)", async () => {
    const requests: unknown[] = [];
    const restPort: RestPort = {
      request: async <T = unknown>(_req: Parameters<RestPort["request"]>[0]) => {
        requests.push(_req);
        return {} as T;
      },
    };

    const client = new StambhaClient({ restPort });
    const signal = new PaginationSignal(client.registries.signals);
    client.registries.signals.register(signal);

    const paginator = await createPaginator({
      pages: [{ content: "a" }, { content: "b" }],
      userId: "user-1",
    });

    const ctx = mockCtx({
      customId: paginationCustomId("next", paginator.sessionId),
    });

    await signal.run(ctx);

    expect(getSession(paginator.sessionId)?.index).toBe(1);
    expect(requests).toHaveLength(1);
    const req = requests[0] as {
      method: string;
      route: string;
      body: { type: number; data: ReplyPayload };
    };
    expect(req.method).toBe("POST");
    expect(req.route).toContain("/interactions/interaction-1/token-1/callback");
    expect(req.body.type).toBe(7);
    expect(req.body.data.flags).toBe(MessageFlags.IsComponentsV2);
    expect(req.body.data.content).toBeUndefined();
    const texts = (
      req.body.data.components?.[0] as { components: Array<{ content?: string }> }
    ).components
      .map((c) => c.content)
      .filter(Boolean);
    expect(texts.some((t) => t?.includes("b"))).toBe(true);
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it("rejects clicks from other users", async () => {
    const client = new StambhaClient();
    const signal = new PaginationSignal(client.registries.signals);

    const paginator = await createPaginator({
      pages: [{ content: "a" }, { content: "b" }],
      userId: "owner",
    });

    const ctx = mockCtx({
      customId: paginationCustomId("next", paginator.sessionId),
      userId: "intruder",
    });

    await signal.run(ctx);

    expect(ctx.replyEphemeral).toHaveBeenCalled();
    expect(getSession(paginator.sessionId)?.index).toBe(0);
  });

  it("dismisses with V2 body and no buttons", async () => {
    const replies: ReplyPayload[] = [];
    const client = new StambhaClient();
    const signal = new PaginationSignal(client.registries.signals);

    const paginator = await createPaginator({
      pages: [{ content: "only" }],
    });

    const ctx = mockCtx({
      customId: paginationCustomId("dismiss", paginator.sessionId),
      raw: {},
      reply: vi.fn(async (payload) => {
        if (typeof payload !== "string") replies.push(payload);
      }),
    });

    await signal.run(ctx);

    expect(getSession(paginator.sessionId)).toBeUndefined();
    expect(replies[0]?.flags).toBe(MessageFlags.IsComponentsV2);
    const dismissed = replies[0];
    expect(dismissed).toBeDefined();
    if (dismissed) expect(v2Buttons(dismissed)).toHaveLength(0);
  });

  it("wraps when wrap is enabled", async () => {
    const replies: ReplyPayload[] = [];
    const client = new StambhaClient();
    const signal = new PaginationSignal(client.registries.signals);

    const paginator = await createPaginator({
      pages: [{ content: "a" }, { content: "b" }],
      wrap: true,
    });

    const ctx = mockCtx({
      customId: paginationCustomId("prev", paginator.sessionId),
      raw: {},
      reply: vi.fn(async (payload) => {
        if (typeof payload !== "string") replies.push(payload);
      }),
    });

    await signal.run(ctx);

    expect(getSession(paginator.sessionId)?.index).toBe(1);
    const texts = (
      replies[0]?.components?.[0] as { components: Array<{ content?: string }> }
    ).components
      .map((c) => c.content)
      .filter(Boolean);
    expect(texts.some((t) => t?.includes("b"))).toBe(true);
  });
});
