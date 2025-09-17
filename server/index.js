import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createClient } from '@libsql/client';

const app = new Hono();

function getClient(url) {
	const authToken = process.env.TURSO_AUTH_TOKEN;
	if (!url || !authToken) throw new Error('Turso env not set');
	return createClient({ url, authToken });
}

function getPrimary() {
	const url = process.env.TURSO_PRIMARY_URL || process.env.TURSO_DATABASE_URL;
	return getClient(url);
}

app.get('/health', (c) => c.json({ ok: true }));

app.get('/api/settings', async (c) => {
	try {
		const scope = c.req.query('scope') || 'merged';
		const client = getPrimary();
		if (scope === 'main') {
			const { rows } = await client.execute("select key, value from app_settings where tenant_id = 0");
			const map = {};
			for (const r of rows || []) map[r.key || r.KEY] = r.value || r.VALUE;
			if (!map['social_forum_mode']) map['social_forum_mode'] = 'shared';
			return c.json(map);
		}
		// merged: tenant + main fallback. TenantId resolved由前端 hostname，但此处简化为 0（主站）
		// 若你需要域名租户解析，可在此按 host 做映射；目前先返回主站设置，避免前端空白。
		const { rows } = await client.execute("select key, value, tenant_id from app_settings where tenant_id in (0)");
		const map = {};
		for (const r of rows || []) map[r.key || r.KEY] = r.value || r.VALUE;
		if (!map['social_forum_mode']) map['social_forum_mode'] = 'shared';
		return c.json(map);
	} catch (e) {
		console.error('GET /api/settings error', e);
		return c.json({});
	}
});

app.get('/api/page-content', async (c) => {
	try {
		const page = c.req.query('page');
		const section = c.req.query('section');
		if (!page || !section) return c.json([]);
		const client = getPrimary();
		const { rows } = await client.execute({
			sql: "select id, tenant_id, position, content from page_content where page = ? and section = ? and tenant_id in (0) order by position",
			args: [page, section]
		});
		const list = (rows || []).map((r) => {
			let contentObj = {};
			try {
				contentObj = typeof r.content === 'string' ? JSON.parse(r.content) : (r.content || {});
			} catch {}
			return { id: r.id || r.ID, position: r.position || r.POSITION, ...contentObj };
		});
		return c.json(list);
	} catch (e) {
		console.error('GET /api/page-content error', e);
		return c.json([]);
	}
});

const port = process.env.PORT ? Number(process.env.PORT) : 8787;
if (!process.env.VERCEL) {
	serve({ fetch: app.fetch, port });
	console.log(`BFF running on http://localhost:${port}`);
}

export default app;
export { app }; 