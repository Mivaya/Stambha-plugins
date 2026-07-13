import type { ReplyPayload } from "@stambha/core";
import { buildPagePayload } from "./components.js";
import { pageAt } from "./pageAt.js";
import { createSessionId, setSession } from "./session.js";
import type { Page, Paginator, PaginatorOptions, ResolvedPaginatorLabels } from "./types.js";

const DEFAULT_TIMEOUT_MS = 5 * 60_000;

const DEFAULT_LABELS: ResolvedPaginatorLabels = {
  prev: "Prev",
  next: "Next",
  dismiss: "Dismiss",
};

function resolveLabels(labels?: PaginatorOptions["labels"]): ResolvedPaginatorLabels {
  return {
    prev: labels?.prev ?? DEFAULT_LABELS.prev,
    next: labels?.next ?? DEFAULT_LABELS.next,
    dismiss: labels?.dismiss ?? DEFAULT_LABELS.dismiss,
  };
}

async function resolvePages(pages: PaginatorOptions["pages"]): Promise<Page[]> {
  const resolved = typeof pages === "function" ? await pages() : pages;
  const list = [...resolved];
  if (list.length === 0) {
    throw new Error("@stambha/pagination: pages must be a non-empty array");
  }
  return list;
}

/**
 * Create an in-memory paginator session and return a helper that builds the
 * initial message payload (page content + prev/next/dismiss buttons).
 */
export async function createPaginator(options: PaginatorOptions): Promise<Paginator> {
  const pages = await resolvePages(options.pages);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const wrap = options.wrap ?? false;
  const labels = resolveLabels(options.labels);
  const startAt = options.startAt ?? 0;
  const index = Math.min(Math.max(0, startAt), pages.length - 1);
  const sessionId = createSessionId();

  const session = {
    pages,
    index,
    expiresAt: Date.now() + timeoutMs,
    wrap,
    labels,
    timeoutMs,
    ...(options.userId !== undefined ? { userId: options.userId } : {}),
  };
  setSession(sessionId, session);

  return {
    sessionId,
    get index() {
      return session.index;
    },
    get pageCount() {
      return pages.length;
    },
    message(): ReplyPayload {
      const page = pageAt(pages, session.index);
      return buildPagePayload(page, {
        sessionId,
        index: session.index,
        pageCount: pages.length,
        labels,
        wrap,
      });
    },
  };
}
