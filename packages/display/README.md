# `@stambha/display`

Opinionated display DX on top of `@stambha/core` builders — **EmbedManager**, **ContainerManager**, and classic embed → Components V2 migration helpers.

Core keeps Discord-API-shaped builders (`EmbedBuilder`, `ContainerBuilder`). This package adds validation, templates, and the former `panel()` migration path.

## Install

```bash
pnpm add @stambha/display@^1.0.0 @stambha/core@^1.3.3
```

## EmbedManager

```ts
import { EmbedManager } from "@stambha/display";

const reply = EmbedManager.fromClassic({
  title: "Status",
  description: "All systems nominal",
  color: 0x57f287,
  fields: [{ name: "Latency", value: "42ms", inline: true }],
}).toReply();

await ctx.reply(reply);
```

## ContainerManager (Components V2)

```ts
import { ContainerManager } from "@stambha/display";

const reply = ContainerManager.fromClassicOptions({
  title: "Welcome",
  description: "Thanks for joining.",
  accentColor: "#5865F2",
  fields: [{ name: "Rules", value: "Be kind." }],
}).toReply();

await ctx.reply(reply);
```

### Migrate classic embeds → Container

```ts
import { ContainerManager, EmbedManager } from "@stambha/display";

const embed = EmbedManager.fromClassic({ title: "Old panel", description: "…" });
const v2 = ContainerManager.fromEmbed(embed).toReply();
```

## Notes

- Does **not** re-export removed `Panel*` names — use `ContainerManager.fromClassicOptions` / `fromEmbed`.
- Peers on `@stambha/core` EmbedBuilder / ContainerBuilder + Views.
