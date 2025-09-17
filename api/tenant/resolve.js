export default function handler(req, res) {
  const { host } = req.query || {};
  res.setHeader('Content-Type', 'application/json');
  if (!host) {
    res.status(200).send(JSON.stringify({ tenantId: 0 }));
    return;
  }
  // Minimal stub: return 0 to unblock UI. Hono app also serves this path.
  res.status(200).send(JSON.stringify({ tenantId: 0 }));
} 