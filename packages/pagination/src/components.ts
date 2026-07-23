import {
  ButtonStyle,
  button,
  buttonRow,
  componentsV2,
  container,
  type ReplyPayload,
  textDisplay,
} from "@stambha/core";
import { paginationCustomId } from "./ids.js";
import type { Page, ResolvedPaginatorLabels } from "./types.js";

/** Best-effort Discord embed → markdown (V2 cannot send classic embeds). */
export function embedToMarkdown(embed: unknown): string {
  if (!embed || typeof embed !== "object") return "";
  const e = embed as {
    title?: unknown;
    description?: unknown;
    fields?: unknown;
  };
  const parts: string[] = [];
  if (typeof e.title === "string" && e.title.length > 0) {
    parts.push(`# ${e.title}`);
  }
  if (typeof e.description === "string" && e.description.length > 0) {
    parts.push(e.description);
  }
  if (Array.isArray(e.fields)) {
    for (const field of e.fields) {
      if (!field || typeof field !== "object") continue;
      const f = field as { name?: unknown; value?: unknown };
      if (typeof f.name === "string" && f.name.length > 0) {
        parts.push(`**${f.name}**`);
      }
      if (typeof f.value === "string" && f.value.length > 0) {
        parts.push(f.value);
      }
    }
  }
  return parts.join("\n\n");
}

/** Resolve page copy into Text Display strings (V2). */
export function pageTextBlocks(page: Page): string[] {
  const blocks: string[] = [];
  if (page.content !== undefined && page.content.length > 0) {
    blocks.push(page.content);
  }
  if (page.displays) {
    for (const d of page.displays) {
      if (d.length > 0) blocks.push(d);
    }
  }
  if (page.embeds) {
    for (const emb of page.embeds) {
      const md = embedToMarkdown(emb);
      if (md.length > 0) blocks.push(md);
    }
  }
  if (blocks.length === 0) {
    blocks.push("\u200b");
  }
  return blocks;
}

function controlRow(
  sessionId: string,
  index: number,
  pageCount: number,
  labels: ResolvedPaginatorLabels,
  wrap: boolean,
) {
  const atStart = index <= 0;
  const atEnd = index >= pageCount - 1;
  const prevDisabled = !wrap && atStart;
  const nextDisabled = !wrap && atEnd;

  return buttonRow(
    button({
      customId: paginationCustomId("prev", sessionId),
      label: labels.prev,
      style: ButtonStyle.Secondary,
      ...(prevDisabled ? { disabled: true } : {}),
    }),
    button({
      customId: paginationCustomId("next", sessionId),
      label: labels.next,
      style: ButtonStyle.Secondary,
      ...(nextDisabled ? { disabled: true } : {}),
    }),
    button({
      customId: paginationCustomId("dismiss", sessionId),
      label: labels.dismiss,
      style: ButtonStyle.Danger,
    }),
  );
}

export interface BuildPagePayloadOptions {
  sessionId: string;
  index: number;
  pageCount: number;
  labels: ResolvedPaginatorLabels;
  wrap: boolean;
  /** RGB accent for the V2 container (`0xRRGGBB`). */
  accentColor?: number | null;
  /** Show `Page i / n` under the body. Default true. */
  showPageCount?: boolean;
}

/**
 * Build a Components V2 reply (IS_COMPONENTS_V2 + Container + Text Display + buttons).
 * Classic `content` / `embeds` are converted to text displays — Discord forbids them with V2.
 */
export function buildPagePayload(page: Page, options: BuildPagePayloadOptions): ReplyPayload {
  const { sessionId, index, pageCount, labels, wrap, accentColor, showPageCount = true } = options;
  const texts = pageTextBlocks(page);
  if (showPageCount) {
    texts.push(`*Page ${index + 1} / ${pageCount}*`);
  }

  // Container allows at most 10 children — keep text blocks + controls within budget.
  const maxText = 8;
  const clipped = texts.slice(0, maxText);

  return componentsV2({
    components: [
      container({
        ...(accentColor !== undefined ? { accentColor } : {}),
        components: [
          ...clipped.map((content) => textDisplay({ content })),
          controlRow(sessionId, index, pageCount, labels, wrap),
        ],
      }),
    ],
  });
}

/** Same page body without controls (dismiss) — still Components V2. */
export function buildDismissPayload(
  page: Page,
  options: { accentColor?: number | null; index?: number; pageCount?: number } = {},
): ReplyPayload {
  const texts = pageTextBlocks(page);
  if (options.index !== undefined && options.pageCount !== undefined && options.pageCount > 0) {
    texts.push(`*Page ${options.index + 1} / ${options.pageCount}*`);
  }
  const clipped = texts.slice(0, 10);

  return componentsV2({
    components: [
      container({
        ...(options.accentColor !== undefined ? { accentColor: options.accentColor } : {}),
        components: clipped.map((content) => textDisplay({ content })),
      }),
    ],
  });
}

/**
 * Classic Action Row + content/embeds (no IS_COMPONENTS_V2).
 * Prefer {@link buildPagePayload} unless you must keep Discord embeds.
 */
export function buildClassicPagePayload(
  page: Page,
  options: Omit<BuildPagePayloadOptions, "accentColor" | "showPageCount">,
): ReplyPayload {
  const { sessionId, index, pageCount, labels, wrap } = options;
  const payload: ReplyPayload = {
    components: [controlRow(sessionId, index, pageCount, labels, wrap)],
  };
  if (page.content !== undefined) payload.content = page.content;
  if (page.embeds !== undefined) payload.embeds = page.embeds;
  return payload;
}

/** Classic dismiss — content/embeds, no buttons. */
export function buildClassicDismissPayload(page: Page): ReplyPayload {
  const payload: ReplyPayload = {
    components: [],
  };
  if (page.content !== undefined) payload.content = page.content;
  if (page.embeds !== undefined) payload.embeds = page.embeds;
  return payload;
}
