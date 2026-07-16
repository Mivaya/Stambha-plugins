import { Route } from "../../route/Route.js";

export default class DiRoute extends Route {
  constructor(label) {
    super();
    this.label = label;
  }

  static create(ctx) {
    return new DiRoute(ctx.client ? "with-client" : "no-client");
  }

  async run(_req, res) {
    res.json({ di: this.label });
  }
}
