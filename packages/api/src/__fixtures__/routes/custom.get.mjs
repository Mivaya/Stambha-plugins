/** Explicit RouteDefinition overrides filename path/method if both set — path from definition wins. */
export default {
  method: "GET",
  path: "/custom-path",
  run: async (_req, res) => {
    res.json({ custom: true });
  },
};
