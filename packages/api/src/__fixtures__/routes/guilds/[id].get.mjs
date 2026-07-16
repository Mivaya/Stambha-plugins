export default async function run(req, res) {
  res.json({ id: req.params.id });
}
