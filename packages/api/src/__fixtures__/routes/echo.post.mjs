export default async function run(req, res) {
  res.json({ body: req.body ?? null });
}
