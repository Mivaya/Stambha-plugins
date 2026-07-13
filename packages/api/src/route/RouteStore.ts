import { Router } from "../router/Router.js";
import type { RouteDefinition } from "../types.js";

export class RouteStore {
  readonly router = new Router();

  register(route: RouteDefinition): void {
    this.router.add(route);
  }
}
