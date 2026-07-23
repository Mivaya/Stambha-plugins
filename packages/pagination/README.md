# @stambha/pagination

**Components V2 pagination** with prev / next / dismiss — built on Stambha **Signals** (`stambha:` custom ids).

Default layout: `IS_COMPONENTS_V2` + Container + Text Display + button row (same builders as `@stambha/core`). Classic embeds are converted to markdown. Use `variant: "classic"` only if you must keep Discord embeds.

Part of [**Stambha plugins**](https://github.com/Mivaya/Stambha-plugins) · requires [`@stambha/core`](https://github.com/Mivaya/Stambha) `^1.2.2` (Components V2 builders)

---

## Install

```bash
pnpm add @stambha/pagination@^1.1.0 @stambha/core@^1.2.2
```

Requires **Node.js 20+**.

---

## Quick start

Register the signal once (loader or manual register), then create a paginator from a command:

```ts
// src/signals/PaginationSignal.ts
export { PaginationSignal } from "@stambha/pagination";
```

```ts
import { Command, type CommandContext, ok, type Registry } from "@stambha/core";
import { createPaginator } from "@stambha/pagination";

export class HelpPagesCommand extends Command {
  constructor(registry: Registry<Command>) {
    super(registry, {
      name: "pages",
      description: "Show multi-page help (Components V2)",
      kinds: ["slash", "prefix"],
    });
  }

  async execute(ctx: CommandContext) {
    const paginator = await createPaginator({
      userId: ctx.userId,
      accentColor: 0x5865f2,
      pages: [
        { content: "# Getting started\n\nInstall `@stambha/core`…" },
        { content: "# Commands\n\nUse slash or prefix…" },
        {
          // embeds still work — converted to markdown under V2
          embeds: [{ title: "Deployment", description: "Tier-split when you outgrow one process." }],
        },
      ],
    });

    await ctx.reply(paginator.message());
    return ok(undefined);
  }
}
```

Ensure `attachStambhaClient(hub, client, { signals: true })` (default) so button clicks route to `PaginationSignal`.

Custom ids look like:

```text
stambha:pagination:next:<sessionId>
```

---

## Key exports

| Export | Purpose |
|--------|---------|
| `createPaginator` | Create a session and build the initial `ReplyPayload` |
| `PaginationSignal` | Handles prev / next / dismiss clicks |
| `Page`, `PaginatorOptions`, `PaginatorVariant` | Types |
| `buildPagePayload` / `buildClassicPagePayload` | Manual payload builders |

### Options

| Option | Default | Notes |
|--------|---------|--------|
| `pages` | required | Array or async resolver |
| `variant` | `"v2"` | `"classic"` keeps content/embeds + Action Row |
| `accentColor` | unset | V2 container accent (`0xRRGGBB`) |
| `showPageCount` | `true` | V2 footer `Page i / n` |
| `userId` | unset | Lock controls to the invoker |
| `timeoutMs` | `300000` | Session TTL (5 minutes) |
| `wrap` | `false` | Cycle at ends; otherwise disable prev/next |
| `labels` | Prev / Next / Dismiss | Button labels |
| `startAt` | `0` | Initial page index |

### Page shape

| Field | V2 | Classic |
|-------|----|---------|
| `content` | Text Display | `content` |
| `displays` | Extra Text Displays | ignored |
| `embeds` | Converted to markdown | top-level `embeds` |

Page turns prefer Discord **UPDATE_MESSAGE** (interaction callback type 7) when `client.restPort` is set. Otherwise they fall back to `SignalContext.reply`.

---

## Related packages

| Package | Role |
|---------|------|
| [`@stambha/core`](https://github.com/Mivaya/Stambha/tree/main/packages/core) | Signals, Components V2 builders, client |
| [`@stambha/gateway`](https://github.com/Mivaya/Stambha/tree/main/packages/gateway) | `attachStambhaClient` routing |

---

## Development

```bash
pnpm --filter @stambha/pagination build
pnpm --filter @stambha/pagination test
```
