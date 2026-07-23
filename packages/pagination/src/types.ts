import type { ReplyPayload } from "@stambha/core";

/**
 * One page of paginator content.
 *
 * Under Components V2 (default), `content` / `displays` become Text Displays.
 * `embeds` are converted to markdown (Discord forbids classic embeds with IS_COMPONENTS_V2).
 * Use `variant: "classic"` on {@link PaginatorOptions} to keep raw embeds.
 */
export interface Page {
  /** Markdown body (Text Display under V2). */
  content?: string;
  /** Extra Text Display blocks (V2 only; ignored in classic mode). */
  displays?: readonly string[];
  /**
   * Classic Discord embeds.
   * V2: converted to markdown via title / description / fields.
   * Classic: sent as top-level `embeds`.
   */
  embeds?: readonly unknown[];
}

export type PaginationAction = "prev" | "next" | "dismiss";

/** Message layout: Components V2 (default) or classic action-row + embeds. */
export type PaginatorVariant = "v2" | "classic";

export interface PaginatorLabels {
  prev?: string;
  next?: string;
  dismiss?: string;
}

export interface ResolvedPaginatorLabels {
  prev: string;
  next: string;
  dismiss: string;
}

export interface PaginatorOptions {
  /** Static pages or a resolver invoked once when the paginator is created. */
  pages: readonly Page[] | (() => readonly Page[] | Promise<readonly Page[]>);
  /** When set, only this user may click the buttons. */
  userId?: string;
  /** Session TTL in milliseconds (default 5 minutes). */
  timeoutMs?: number;
  labels?: PaginatorLabels;
  /** Zero-based start index (default 0). */
  startAt?: number;
  /**
   * When true, prev/next wrap around the ends.
   * When false (default), buttons at the ends are disabled.
   */
  wrap?: boolean;
  /**
   * `v2` (default) — Container + Text Display + `IS_COMPONENTS_V2`.
   * `classic` — content/embeds + Action Row (legacy).
   */
  variant?: PaginatorVariant;
  /** V2 container accent bar (`0xRRGGBB`). Ignored for classic. */
  accentColor?: number | null;
  /** V2: append `Page i / n` under the body (default true). */
  showPageCount?: boolean;
}

export interface Paginator {
  readonly sessionId: string;
  /** Current zero-based page index. */
  readonly index: number;
  /** Total page count. */
  readonly pageCount: number;
  /** Build a {@link ReplyPayload} for the current page + controls. */
  message(): ReplyPayload;
}

export interface PaginationSession {
  pages: Page[];
  index: number;
  userId?: string;
  expiresAt: number;
  wrap: boolean;
  labels: ResolvedPaginatorLabels;
  timeoutMs: number;
  variant: PaginatorVariant;
  accentColor?: number | null;
  showPageCount: boolean;
}
