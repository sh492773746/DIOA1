export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  // Minimal default settings to unblock UI
  res.status(200).send(JSON.stringify({ site_name: '大海团队', social_forum_mode: 'shared' }));
} 