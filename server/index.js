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
app.get('/api/health', (c) => c.json({ ok: true }));

// Settings (with and without /api prefix)
app.get('/settings', async (c) => {
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
		const { rows } = await client.execute("select key, value, tenant_id from app_settings where tenant_id in (0)");
    const map = {};
		for (const r of rows || []) map[r.key || r.KEY] = r.value || r.VALUE;
    if (!map['social_forum_mode']) map['social_forum_mode'] = 'shared';
    return c.json(map);
  } catch (e) {
		console.error('GET /settings error', e);
    return c.json({ site_name: '大海团队', social_forum_mode: 'shared' });
  }
});
app.get('/api/settings', async (c) => c.redirect('/settings'));

// Default content fallbacks
const defaultContent = {
  home: {
    carousel: [
      { title: '欢迎来到大海团队', description: '探索我们的产品与社区', image_url: 'https://picsum.photos/1200/400?1', overlay_opacity: 30 },
      { title: '最新活动', description: '关注最新动态与公告', image_url: 'https://picsum.photos/1200/400?2', overlay_opacity: 25 },
    ],
    announcements: [
      { text: '🚀 网站全新上线，欢迎体验！' },
      { text: '📢 加入社区，获取更多福利与资讯。' },
    ],
    feature_cards: [
      { title: '朋友圈', description: '与好友互动交流', icon: 'MessageSquare', path: '/social' },
      { title: '游戏中心', description: '发现有趣的小游戏', icon: 'Gamepad2', path: '/games' },
      { title: '站点设置', description: '自定义你的网站', icon: 'Settings', path: '/admin/site-settings' },
    ],
    hot_games: [
      { id: 1, title: '2048', description: '简单益智小游戏', info: '轻松上手', path: '/games/2048', isOfficial: true },
      { id: 2, title: '贪吃蛇', description: '经典怀旧玩法', info: '适合放松', path: '/games/snake' },
      { id: 3, title: '扫雷', description: '挑战你的反应', info: '烧脑益智', path: '/games/minesweeper' },
    ],
    pinned_ads: [
      { title: '加入VIP会员', description: '解锁更多专属权益', link_url: '#', background_image_url: 'https://picsum.photos/1200/400?ad' }
    ]
  },
  games: {
    game_categories: [
      { slug: 'all', name: '全部', icon: 'AppWindow' },
      { slug: 'puzzle', name: '益智', icon: 'Brain' },
      { slug: 'classic', name: '经典', icon: 'Gamepad2' },
    ],
    game_cards: [
      { id: 1, category_slug: 'puzzle', title: '2048', description: '简单益智小游戏', info: '轻松上手', path: '/games/2048', isOfficial: true },
      { id: 2, category_slug: 'classic', title: '贪吃蛇', description: '经典怀旧玩法', info: '适合放松', path: '/games/snake' },
      { id: 3, category_slug: 'classic', title: '扫雷', description: '挑战你的反应', info: '烧脑益智', path: '/games/minesweeper' },
    ]
  }
};

// Page content
app.get('/page-content', async (c) => {
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
    if (list.length === 0 && defaultContent[page] && defaultContent[page][section]) {
      return c.json(defaultContent[page][section]);
    }
    return c.json(list);
  } catch (e) {
		console.error('GET /page-content error', e);
    const page = c.req.query('page');
    const section = c.req.query('section');
    if (defaultContent[page] && defaultContent[page][section]) {
      return c.json(defaultContent[page][section]);
    }
    return c.json([]);
  }
});
app.get('/api/page-content', async (c) => c.redirect('/page-content'));

// Tenant resolve
app.get('/tenant/resolve', async (c) => {
	try {
		const hostname = c.req.query('host') || '';
		const client = getPrimary();
		const { rows } = await client.execute({
			sql: "select id from tenant_requests where desired_domain = ? limit 1",
			args: [hostname]
		});
		const id = rows && rows[0] ? (rows[0].id || rows[0].ID) : 0;
		return c.json({ tenantId: id || 0 });
  } catch (e) {
		return c.json({ tenantId: 0 });
	}
});
app.get('/api/tenant/resolve', async (c) => c.redirect('/tenant/resolve'));

// Social feed posts (placeholder)
const demoAuthors = [
  { id: 'u1', username: '小海', avatar_url: '/avatar-fallback.png' },
  { id: 'u2', username: '小贝', avatar_url: '/avatar-fallback.png' }
];
const demoPosts = Array.from({ length: 30 }).map((_, i) => ({
  id: i + 1,
  tenant_id: 0,
  author: demoAuthors[i % demoAuthors.length],
  content: `示例动态 ${i + 1}: 欢迎体验大海团队站点！`,
  image_urls: (i % 3 === 0) ? [
    `https://picsum.photos/seed/${i}-1/400/300`,
    `https://picsum.photos/seed/${i}-2/400/300`
  ] : [],
  is_ad: false,
  status: 'approved',
  likes: [],
  likes_count: Math.floor(Math.random() * 50),
  comments: []
}));

app.get('/api/posts', async (c) => {
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '20');
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = demoPosts.slice(start, end);
  const hasMore = end < demoPosts.length;
  return c.json({ items, page, pageSize, hasMore });
});

const port = process.env.PORT ? Number(process.env.PORT) : 8787;
if (!process.env.VERCEL) {
serve({ fetch: app.fetch, port });
console.log(`BFF running on http://localhost:${port}`); 
}

export default app;
export { app }; 