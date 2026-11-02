import {
  EmbedBuilder,
  type EmbedJSON,
  type EmbedView,
  type ReplyPayload,
  resolveColor,
} from "@stambha/core";
import type { ClassicDisplayOptions, EmbedSource, ManagerReplyExtras } from "./types.js";

const EMBED_DESC_LIMIT = 4096;
const EMBED_TITLE_LIMIT = 256;
const EMBED_FIELD_LIMIT = 25;
const EMBED_TOTAL_LIMIT = 6000;

/** Apply classic camelCase display options onto an EmbedBuilder. */
export function applyClassicToEmbed(
  builder: EmbedBuilder,
  options: ClassicDisplayOptions,
): EmbedBuilder {
  if (options.title !== undefined) builder.setTitle(options.title);
  if (options.description !== undefined) builder.setDescription(options.description);
  if (options.url !== undefined) builder.setUrl(options.url);
  if (options.color !== undefined) builder.setColor(options.color);
  if (options.timestamp !== undefined) builder.setTimestamp(options.timestamp);
  if (options.footer !== undefined) {
    builder.setFooter({
      text: options.footer.text,
      ...(options.footer.iconUrl !== undefined ? { iconUrl: options.footer.iconUrl } : {}),
    });
  }
  if (options.author !== undefined) {
    builder.setAuthor({
      name: options.author.name,
      ...(options.author.url !== undefined ? { url: options.author.url } : {}),
      ...(options.author.iconUrl !== undefined ? { iconUrl: options.author.iconUrl } : {}),
    });
  }
  if (options.thumbnailUrl !== undefined) builder.setThumbnail(options.thumbnailUrl);
  if (options.imageUrl !== undefined) builder.setImage(options.imageUrl);
  if (options.fields?.length) {
    for (const field of options.fields) {
      builder.addField(field.name, field.value, field.inline);
    }
  }
  return builder;
}

function looksClassic(source: EmbedSource): source is ClassicDisplayOptions {
  return (
    "thumbnailUrl" in source ||
    "imageUrl" in source ||
    "accentColor" in source ||
    (source.footer !== undefined && "iconUrl" in (source.footer as object))
  );
}

/**
 * Opinionated embed orchestration on top of core {@link EmbedBuilder} / {@link EmbedView}.
 * Validates approximate Discord embed budgets and builds reply payloads.
 */
export class EmbedManager {
  #builder: EmbedBuilder;

  constructor(source?: EmbedSource | EmbedBuilder | EmbedView) {
    if (source instanceof EmbedBuilder) {
      this.#builder = EmbedBuilder.from(source);
    } else if (source && typeof source === "object" && "toJSON" in source) {
      this.#builder = EmbedBuilder.from(source as EmbedView);
    } else if (source && looksClassic(source)) {
      this.#builder = applyClassicToEmbed(new EmbedBuilder(), source);
    } else if (source) {
      this.#builder = EmbedBuilder.from(source as EmbedJSON);
    } else {
      this.#builder = new EmbedBuilder();
    }
  }

  static from(source?: EmbedSource | EmbedBuilder | EmbedView): EmbedManager {
    return new EmbedManager(source);
  }

  static fromClassic(options: ClassicDisplayOptions): EmbedManager {
    return new EmbedManager(options);
  }

  get builder(): EmbedBuilder {
    return this.#builder;
  }

  get view(): EmbedView {
    return this.#builder.toView();
  }

  /** Approximate character budget used by title + description + fields + footer + author. */
  length(): number {
    const json = this.#builder.toJSON();
    let n = 0;
    if (json.title) n += json.title.length;
    if (json.description) n += json.description.length;
    if (json.footer?.text) n += json.footer.text.length;
    if (json.author?.name) n += json.author.name.length;
    for (const field of json.fields ?? []) {
      n += field.name.length + field.value.length;
    }
    return n;
  }

  /** Soft validation against Discord embed limits (throws on hard overflow). */
  validate(): this {
    const json = this.#builder.toJSON();
    if ((json.title?.length ?? 0) > EMBED_TITLE_LIMIT) {
      throw new Error(`Embed title exceeds ${EMBED_TITLE_LIMIT} characters.`);
    }
    if ((json.description?.length ?? 0) > EMBED_DESC_LIMIT) {
      throw new Error(`Embed description exceeds ${EMBED_DESC_LIMIT} characters.`);
    }
    if ((json.fields?.length ?? 0) > EMBED_FIELD_LIMIT) {
      throw new Error(`Embed has more than ${EMBED_FIELD_LIMIT} fields.`);
    }
    if (this.length() > EMBED_TOTAL_LIMIT) {
      throw new Error(`Embed total text exceeds ${EMBED_TOTAL_LIMIT} characters.`);
    }
    return this;
  }

  toJSON(): EmbedJSON {
    return this.#builder.toJSON();
  }

  toReply(extras: ManagerReplyExtras = {}): ReplyPayload {
    this.validate();
    return this.#builder.toReply(extras.ephemeral ? { ephemeral: true } : {});
  }

  /** Accent preset helper — sets embed color from a named or numeric input. */
  setAccent(color: NonNullable<ClassicDisplayOptions["color"]>): this {
    this.#builder.setColor(resolveColor(color));
    return this;
  }
}
