# @stambha/pagination

**Embed pagination** with prev / next / dismiss buttons — built on Stambha **Signals** (`stambha:` custom ids).

Part of [**Stambha plugins**](https://github.com/Mivaya/Stambha-plugins) · requires [`@stambha/core`](https://github.com/Mivaya/Stambha) `^1.2.0`

---

## Install

```bash
pnpm add @stambha/pagination @stambha/core
```

Requires **Node.js 20+**.

---

## Quick start

Register the signal once (loader or manual register), then create a paginator from a command:

```ts
// src/signals/PaginationSignal.ts — or register in setup
import { PaginationSignal } from "@stambha/pagination";
// Piece loader discovers classes under src/signals/ when named accordingly.
export { PaginationSignal };
```

```ts
import { Command, type CommandContext, ok, type Registry } from "@stambha/core";
import { createPaginator } from "@stambha/pagination";

export class HelpPagesCommand extends Command {
  constructor(registry: Registry<Command>) {
    super(registry, {
      name: "pages",
      description: "Show a multi-page help embed",
      kinds: ["slash", "prefix"],
    });
  }

  async execute(ctx: CommandContext) {
    const paginator = await createPaginator({
      userId: ctx.userId,
      pages: [
        { embeds: [{ title: "Page 1", description: "Getting started" }] },
        { embeds: [{ title: "Page 2", description: "Commands" }] },
        { embeds: [{ title: "Page 3", description: "Deployment" }] },
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
| `Page`, `PaginatorOptions` | Types |

### Options

| Option | Default | Notes |
|--------|---------|--------|
| `pages` | required | Array or async resolver |
| `userId` | unset | Lock controls to the invoker |
| `timeoutMs` | `300000` | Session TTL (5 minutes) |
| `wrap` | `false` | Cycle at ends; otherwise disable prev/next |
| `labels` | Prev / Next / Dismiss | Button labels |
| `startAt` | `0` | Initial page index |

Page turns prefer Discord **UPDATE_MESSAGE** (interaction callback type 7) when `client.restPort` is set. Otherwise they fall back to `SignalContext.reply`.

---

## Related packages

| Package | Role |
|---------|------|
| [`@stambha/core`](https://github.com/mivaya/Stambha/tree/main/packages/core) | Signals, `ReplyPayload`, client |
| [`@stambha/gateway`](https://github.com/mivaya/Stambha/tree/main/packages/gateway) | `attachStambhaClient` routing |

---

## Development

```bash
pnpm --filter @stambha/pagination build
pnpm --filter @stambha/pagination test
```
