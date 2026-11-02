import {
  type ColorInput,
  ContainerBuilder,
  type ContainerComponent,
  type ContainerView,
  type EmbedJSON,
  type EmbedView,
  type ReplyPayload,
  resolveColor,
  textDisplay,
} from "@stambha/core";
import { EmbedManager } from "./EmbedManager.js";
import type { ClassicDisplayOptions, EmbedSource, ManagerReplyExtras } from "./types.js";

/** Map classic embed / panel fields into TextDisplay blocks inside a Container. */
export function classicToContainerBuilder(
  options: ClassicDisplayOptions,
  accent?: ColorInput,
): ContainerBuilder {
  const builder = new ContainerBuilder();
  const color = accent ?? options.accentColor ?? options.color;
  if (color !== undefined) builder.setAccentColor(resolveColor(color));

  if (options.title) builder.addTextDisplayComponents(textDisplay({ content: `**${options.title}**` }));
  if (options.description) {
    builder.addTextDisplayComponents(textDisplay({ content: options.description }));
  }

  if (options.author?.name) {
    const authorLine = options.author.url
      ? `*${options.author.name}* — ${options.author.url}`
      : `*${options.author.name}*`;
    builder.addTextDisplayComponents(textDisplay({ content: authorLine }));
  }

  for (const field of options.fields ?? []) {
    builder.addTextDisplayComponents(textDisplay({ content: `**${field.name}**\n${field.value}` }));
  }

  if (options.footer?.text) {
    builder.addTextDisplayComponents(textDisplay({ content: `— ${options.footer.text}` }));
  }
  if (options.url) builder.addTextDisplayComponents(textDisplay({ content: options.url }));

  // Ensure at least one child so Discord accepts the container.
  if (builder.toJSON().components.length === 0) {
    builder.addTextDisplayComponents(textDisplay({ content: "\u200b" }));
  }

  return builder;
}

function embedJsonToClassic(json: EmbedJSON): ClassicDisplayOptions {
  const options: ClassicDisplayOptions = {};
  if (json.title !== undefined) options.title = json.title;
  if (json.description !== undefined) options.description = json.description;
  if (json.url !== undefined) options.url = json.url;
  if (json.color !== undefined) options.color = json.color;
  if (json.timestamp !== undefined) options.timestamp = json.timestamp;
  if (json.footer) {
    options.footer = {
      text: json.footer.text,
      ...(json.footer.icon_url !== undefined ? { iconUrl: json.footer.icon_url } : {}),
    };
  }
  if (json.author) {
    options.author = {
      name: json.author.name,
      ...(json.author.url !== undefined ? { url: json.author.url } : {}),
      ...(json.author.icon_url !== undefined ? { iconUrl: json.author.icon_url } : {}),
    };
  }
  if (json.thumbnail?.url) options.thumbnailUrl = json.thumbnail.url;
  if (json.image?.url) options.imageUrl = json.image.url;
  if (json.fields?.length) {
    options.fields = json.fields.map((f) => ({
      name: f.name,
      value: f.value,
      ...(f.inline !== undefined ? { inline: f.inline } : {}),
    }));
  }
  return options;
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
 * Components V2 Container orchestration + classic embed → container migration.
 * Replaces the former core `panel()` / `PanelBuilder` path.
 */
export class ContainerManager {
  #builder: ContainerBuilder;

  constructor(builder?: ContainerBuilder) {
    this.#builder = builder ?? new ContainerBuilder();
  }

  static from(builder?: ContainerBuilder): ContainerManager {
    return new ContainerManager(builder);
  }

  /** Build a Container from classic panel/embed-shaped options. */
  static fromClassicOptions(options: ClassicDisplayOptions): ContainerManager {
    return new ContainerManager(classicToContainerBuilder(options));
  }

  /** Migrate an embed (builder, view, JSON, or classic options) into a Container. */
  static fromEmbed(
    source: EmbedSource | EmbedManager | EmbedView | { toJSON(): EmbedJSON },
  ): ContainerManager {
    if (source instanceof EmbedManager) {
      return ContainerManager.fromClassicOptions(embedJsonToClassic(source.toJSON()));
    }
    if (typeof source === "object" && source !== null && "toJSON" in source) {
      return ContainerManager.fromClassicOptions(embedJsonToClassic(source.toJSON()));
    }
    if (looksClassic(source)) {
      return ContainerManager.fromClassicOptions(source);
    }
    return ContainerManager.fromClassicOptions(embedJsonToClassic(source as EmbedJSON));
  }

  get builder(): ContainerBuilder {
    return this.#builder;
  }

  get view(): ContainerView {
    return this.#builder.toView();
  }

  setAccent(color: ColorInput): this {
    this.#builder.setAccentColor(resolveColor(color));
    return this;
  }

  addText(content: string): this {
    this.#builder.addTextDisplayComponents(textDisplay({ content }));
    return this;
  }

  length(): number {
    let n = 0;
    for (const child of this.#builder.toJSON().components) {
      if ("content" in child && typeof child.content === "string") n += child.content.length;
    }
    return n;
  }

  toJSON(): ContainerComponent {
    return this.#builder.toJSON();
  }

  toReply(extras: ManagerReplyExtras = {}): ReplyPayload {
    return this.#builder.toReply(extras.ephemeral ? { ephemeral: true } : {});
  }
}
