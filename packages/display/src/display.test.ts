import { ComponentType, MessageFlags } from "@stambha/core";
import { describe, expect, it } from "vitest";
import { ContainerManager } from "./ContainerManager.js";
import { EmbedManager } from "./EmbedManager.js";

describe("@stambha/display", () => {
  it("EmbedManager builds classic replies", () => {
    const mgr = EmbedManager.fromClassic({
      title: "Hello",
      description: "World",
      color: 0x5865f2,
      fields: [{ name: "A", value: "1" }],
    });
    expect(mgr.length()).toBeGreaterThan(5);
    const reply = mgr.toReply();
    expect(reply.embeds?.[0]).toMatchObject({ title: "Hello", description: "World" });
  });

  it("ContainerManager.fromClassicOptions returns V2 reply", () => {
    const mgr = ContainerManager.fromClassicOptions({
      title: "Panel",
      description: "Body",
      fields: [{ name: "K", value: "V" }],
      accentColor: "#5865F2",
    });
    const reply = mgr.toReply({ ephemeral: true });
    expect(reply.flags! & MessageFlags.IsComponentsV2).toBeTruthy();
    expect(reply.components?.[0]).toMatchObject({ type: ComponentType.Container });
    expect(mgr.length()).toBeGreaterThan(0);
  });

  it("ContainerManager.fromEmbed migrates embed JSON", () => {
    const embed = EmbedManager.fromClassic({ title: "T", description: "D" });
    const container = ContainerManager.fromEmbed(embed);
    const json = container.toJSON();
    expect(json.type).toBe(ComponentType.Container);
    expect(json.components.some((c) => "content" in c && String(c.content).includes("T"))).toBe(
      true,
    );
  });
});
