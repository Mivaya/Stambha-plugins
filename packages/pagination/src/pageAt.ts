import type { Page } from "./types.js";

/** Sessions always have ≥1 page; return a safe page for the index. */
export function pageAt(pages: readonly Page[], index: number): Page {
  return pages[index] ?? pages[0] ?? {};
}
