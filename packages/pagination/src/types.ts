import type { ReplyPayload } from "@stambha/core";

/** One page of content shown by the paginator (components are owned by the package). */
export interface Page {
  content?: string;
  embeds?: readonly unknown[];
}

export type PaginationAction = "prev" | "next" | "dismiss";

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
}

export interface Paginator {
  readonly sessionId: string;
  /** Current zero-based page index. */
  readonly index: number;
  /** Total page count. */
  readonly pageCount: number;
  /** Build a {@link ReplyPayload} for the current page (content/embeds + buttons). */
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
}
