import type { MiddlewareDefinition, MiddlewareHandler } from "../types.js";

export class MiddlewareStore {
  private readonly items: MiddlewareDefinition[] = [];

  register(middleware: MiddlewareDefinition): void {
    this.items.push({
      ...middleware,
      position: middleware.position ?? 1000,
    });
    this.items.sort((a, b) => (a.position ?? 1000) - (b.position ?? 1000));
  }

  get sorted(): readonly MiddlewareDefinition[] {
    return this.items;
  }

  /** Run middlewares then `terminal`. Stops early if response already ended. */
  async run(
    request: Parameters<MiddlewareHandler>[0],
    response: Parameters<MiddlewareHandler>[1],
    terminal: () => Promise<void>,
  ): Promise<void> {
    let index = 0;
    const stack = this.items;

    const next = async (): Promise<void> => {
      if (response.writableEnded) return;
      if (index >= stack.length) {
        await terminal();
        return;
      }
      const current = stack[index++];
      if (!current) {
        await terminal();
        return;
      }
      await current.run(request, response, next);
    };

    await next();
  }
}
