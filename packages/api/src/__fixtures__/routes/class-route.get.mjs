import { Route } from "../../route/Route.js";

export default class ClassRoute extends Route {
  async run(_req, res) {
    res.json({ classRoute: true });
  }
}
