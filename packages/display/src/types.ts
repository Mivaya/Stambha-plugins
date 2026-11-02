import type { ColorInput, EmbedJSON, ReplyPayload } from "@stambha/core";

/** Classic “panel / embed card” options — maps to EmbedBuilder or Components V2 Container. */
export interface ClassicDisplayOptions {
  title?: string;
  description?: string;
  url?: string;
  color?: ColorInput;
  timestamp?: Date | number | string;
  footer?: { text: string; iconUrl?: string };
  author?: { name: string; url?: string; iconUrl?: string };
  thumbnailUrl?: string;
  imageUrl?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  /** Accent color for Components V2 Container (falls back to `color`). */
  accentColor?: ColorInput;
  ephemeral?: boolean;
}

export type EmbedSource = ClassicDisplayOptions | EmbedJSON;

export interface ManagerReplyExtras {
  ephemeral?: boolean;
}

export type { ReplyPayload };
