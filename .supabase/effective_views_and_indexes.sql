-- Views for tenant-aware effective settings and page content

-- Drop and recreate views with safe tenant resolution
DROP VIEW IF EXISTS public.effective_app_settings;
DROP VIEW IF EXISTS public.effective_page_content;

-- effective_app_settings via current tenant (fallback to main 0)
CREATE OR REPLACE VIEW public.effective_app_settings AS
WITH tenant_settings AS (
  SELECT key, value FROM public.app_settings WHERE tenant_id = public.get_current_tenant_id()
),
main_settings AS (
  SELECT key, value FROM public.app_settings WHERE tenant_id = 0
),
keys AS (
  SELECT key FROM tenant_settings UNION SELECT key FROM main_settings
)
SELECT
  public.get_current_tenant_id() AS tenant_id,
  COALESCE(t.key, m.key) AS key,
  COALESCE(t.value, m.value) AS value
FROM keys k
LEFT JOIN tenant_settings t ON t.key = k.key
LEFT JOIN main_settings m ON m.key = k.key;

-- effective_page_content: prefer tenant rows; fallback to main(0) when tenant has none for that page/section
CREATE OR REPLACE VIEW public.effective_page_content AS
WITH tenant_content AS (
  SELECT * FROM public.page_content WHERE tenant_id = public.get_current_tenant_id() AND is_active
),
sections_with_tenant AS (
  SELECT page, section FROM tenant_content GROUP BY page, section
),
fallback_content AS (
  SELECT * FROM public.page_content pm
  WHERE pm.tenant_id = 0 AND pm.is_active
    AND NOT EXISTS (
      SELECT 1 FROM sections_with_tenant s
      WHERE s.page = pm.page AND s.section = pm.section
    )
)
SELECT * FROM tenant_content
UNION ALL
SELECT * FROM fallback_content;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_tenant_status_pinned_created ON public.posts(tenant_id, status, is_pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_tenant_post_created ON public.comments(tenant_id, post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_tenant_post ON public.likes(tenant_id, post_id);
CREATE INDEX IF NOT EXISTS idx_page_content_tenant_page_section ON public.page_content(tenant_id, page, section);
CREATE UNIQUE INDEX IF NOT EXISTS uq_page_content_unique ON public.page_content(tenant_id, page, section, id); 