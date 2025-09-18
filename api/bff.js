import fetchHandler from '../server/index.js';

export default async function handler(req, res) {
  try {
    const protocol = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const url = `${protocol}://${host}${req.url}`;

    const method = req.method || 'GET';
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers || {})) {
      if (Array.isArray(v)) headers.set(k, v.join(',')); else if (v != null) headers.set(k, String(v));
    }

    const body = (method === 'GET' || method === 'HEAD') ? undefined : req;
    const request = new Request(url, { method, headers, body });

    const response = await fetchHandler(request);
    res.statusCode = response.status;
    response.headers.forEach((value, name) => res.setHeader(name, value));
    const buf = Buffer.from(await response.arrayBuffer());
    res.end(buf);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'internal', message: e?.message || 'error' }));
  }
} 