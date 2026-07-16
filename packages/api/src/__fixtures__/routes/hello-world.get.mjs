/** @type {import('../../types.js').RouteHandler} */
export default async function run(_req, res) {
  res.json({ hello: "world" });
}
