import {
  normalizeReplyData,
  type ReplyPayload,
  type RestPort,
  type SignalContext,
} from "@stambha/core";

interface InteractionRaw {
  id?: string | null;
  token?: string | null;
}

/**
 * Prefer Discord interaction callback type 7 (UPDATE_MESSAGE) via {@link RestPort}.
 * Falls back to {@link SignalContext.reply} (type 4) when REST is unavailable.
 */
export async function respondWithPage(
  ctx: SignalContext,
  restPort: RestPort | null,
  payload: ReplyPayload,
): Promise<void> {
  const raw = ctx.raw as InteractionRaw | null | undefined;
  const id = raw?.id ?? null;
  const token = raw?.token ?? null;

  if (restPort && id && token) {
    await restPort.request({
      method: "POST",
      route: `/interactions/${id}/${token}/callback`,
      body: {
        type: 7,
        data: normalizeReplyData(payload),
      },
    });
    return;
  }

  await ctx.reply(payload);
}
