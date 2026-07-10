import type { ReplyPayload } from "@stambha/core";
import { paginationCustomId } from "./ids.js";
import type { Page, ResolvedPaginatorLabels } from "./types.js";

const BUTTON = 2;
const ACTION_ROW = 1;
const STYLE_SECONDARY = 2;
const STYLE_DANGER = 4;

interface ButtonComponent {
  type: number;
  style: number;
  label: string;
  custom_id: string;
  disabled?: boolean;
}

interface ActionRow {
  type: number;
  components: ButtonComponent[];
}

export function buildPagePayload(
  page: Page,
  options: {
    sessionId: string;
    index: number;
    pageCount: number;
    labels: ResolvedPaginatorLabels;
    wrap: boolean;
  },
): ReplyPayload {
  const { sessionId, index, pageCount, labels, wrap } = options;
  const atStart = index <= 0;
  const atEnd = index >= pageCount - 1;

  const prevDisabled = !wrap && atStart;
  const nextDisabled = !wrap && atEnd;

  const prev: ButtonComponent = {
    type: BUTTON,
    style: STYLE_SECONDARY,
    label: labels.prev,
    custom_id: paginationCustomId("prev", sessionId),
  };
  if (prevDisabled) prev.disabled = true;

  const next: ButtonComponent = {
    type: BUTTON,
    style: STYLE_SECONDARY,
    label: labels.next,
    custom_id: paginationCustomId("next", sessionId),
  };
  if (nextDisabled) next.disabled = true;

  const dismiss: ButtonComponent = {
    type: BUTTON,
    style: STYLE_DANGER,
    label: labels.dismiss,
    custom_id: paginationCustomId("dismiss", sessionId),
  };

  const row: ActionRow = {
    type: ACTION_ROW,
    components: [prev, next, dismiss],
  };

  const payload: ReplyPayload = {
    components: [row],
  };
  if (page.content !== undefined) payload.content = page.content;
  if (page.embeds !== undefined) payload.embeds = page.embeds;
  return payload;
}

/** Same page content with controls removed (dismiss). */
export function buildDismissPayload(page: Page): ReplyPayload {
  const payload: ReplyPayload = {
    components: [],
  };
  if (page.content !== undefined) payload.content = page.content;
  if (page.embeds !== undefined) payload.embeds = page.embeds;
  return payload;
}
