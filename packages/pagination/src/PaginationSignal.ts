import { type Registry, Signal, type SignalContext } from "@stambha/core";
import {
  buildClassicDismissPayload,
  buildClassicPagePayload,
  buildDismissPayload,
  buildPagePayload,
} from "./components.js";
import { PAGINATION_SIGNAL_NAME, parsePaginationSuffix } from "./ids.js";
import { pageAt } from "./pageAt.js";
import { respondWithPage } from "./respond.js";
import { deleteSession, getSession, touchSession } from "./session.js";

/**
 * Signal piece that handles `stambha:pagination:{action}:{sessionId}` button clicks.
 * Register under `src/signals/` (or construct and `registries.signals.register`).
 */
export class PaginationSignal extends Signal {
  constructor(registry: Registry<Signal>) {
    super(registry, {
      name: PAGINATION_SIGNAL_NAME,
      types: ["button"],
    });
  }

  async run(ctx: SignalContext): Promise<void> {
    const parsed = Signal.parseCustomId(ctx.customId);
    if (!parsed || parsed.name !== PAGINATION_SIGNAL_NAME) return;

    const parts = parsePaginationSuffix(parsed.suffix);
    if (!parts) {
      await ctx.replyEphemeral("This pagination control is invalid.");
      return;
    }

    const session = getSession(parts.sessionId);
    if (!session) {
      await ctx.replyEphemeral("This paginator has expired. Run the command again.");
      return;
    }

    if (session.userId !== undefined && session.userId !== ctx.userId) {
      await ctx.replyEphemeral("Only the user who opened this paginator can use it.");
      return;
    }

    const restPort = this.client.restPort;
    const pageCount = session.pages.length;
    const classic = session.variant === "classic";

    if (parts.action === "dismiss") {
      const page = pageAt(session.pages, session.index);
      const index = session.index;
      deleteSession(parts.sessionId);
      const payload = classic
        ? buildClassicDismissPayload(page)
        : buildDismissPayload(page, {
            index,
            pageCount,
            ...(session.accentColor !== undefined ? { accentColor: session.accentColor } : {}),
          });
      await respondWithPage(ctx, restPort, payload);
      return;
    }

    let nextIndex = session.index;
    if (parts.action === "prev") {
      if (session.wrap) {
        nextIndex = (session.index - 1 + pageCount) % pageCount;
      } else if (session.index > 0) {
        nextIndex = session.index - 1;
      }
    } else if (parts.action === "next") {
      if (session.wrap) {
        nextIndex = (session.index + 1) % pageCount;
      } else if (session.index < pageCount - 1) {
        nextIndex = session.index + 1;
      }
    }

    session.index = nextIndex;
    touchSession(parts.sessionId);

    const page = pageAt(session.pages, session.index);
    const payload = classic
      ? buildClassicPagePayload(page, {
          sessionId: parts.sessionId,
          index: session.index,
          pageCount,
          labels: session.labels,
          wrap: session.wrap,
        })
      : buildPagePayload(page, {
          sessionId: parts.sessionId,
          index: session.index,
          pageCount,
          labels: session.labels,
          wrap: session.wrap,
          showPageCount: session.showPageCount,
          ...(session.accentColor !== undefined ? { accentColor: session.accentColor } : {}),
        });

    await respondWithPage(ctx, restPort, payload);
  }
}
