import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

app.get('/health', (c) => c.json({ ok: true }));

const port = process.env.PORT ? Number(process.env.PORT) : 8787;
if (!process.env.VERCEL) {
	serve({ fetch: app.fetch, port });
	console.log(`BFF running on http://localhost:${port}`);
}

export default app;
export { app }; 