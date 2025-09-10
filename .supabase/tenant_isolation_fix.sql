-- 🔧 租户隔离修复脚本
-- 此脚本修复分站显示主站内容的问题

-- 1. 创建 get_tenant_id_by_hostname RPC 函数
CREATE OR REPLACE FUNCTION public.get_tenant_id_by_hostname(p_hostname text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 检查是否为主站域名 (你需要根据实际情况调整主站域名)
    IF p_hostname IN ('localhost', '127.0.0.1', 'yourmainsite.com') THEN
        RETURN 0;
    END IF;
    
    -- 从 tenant_requests 表中查找对应的租户ID
    RETURN (
        SELECT id 
        FROM public.tenant_requests 
        WHERE vercel_assigned_domain = p_hostname 
           OR desired_domain = p_hostname
           AND status = 'approved'
        LIMIT 1
    );
    
    -- 如果没找到，返回主站ID (0)
    EXCEPTION WHEN OTHERS THEN
        RETURN 0;
END;
$$;

-- 2. 更新所有 tenant_id 为 NULL 的记录，设置为主站 (tenant_id = 0)
UPDATE public.posts 
SET tenant_id = 0 
WHERE tenant_id IS NULL;

UPDATE public.comments 
SET tenant_id = 0 
WHERE tenant_id IS NULL;

UPDATE public.likes 
SET tenant_id = 0 
WHERE tenant_id IS NULL;

UPDATE public.profiles 
SET tenant_id = 0 
WHERE tenant_id IS NULL;

UPDATE public.page_content 
SET tenant_id = 0 
WHERE tenant_id IS NULL;

-- 3. 修改表结构，设置默认值并添加约束
ALTER TABLE public.posts 
ALTER COLUMN tenant_id SET DEFAULT 0,
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.comments 
ALTER COLUMN tenant_id SET DEFAULT 0,
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.likes 
ALTER COLUMN tenant_id SET DEFAULT 0,
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.profiles 
ALTER COLUMN tenant_id SET DEFAULT 0,
ALTER COLUMN tenant_id SET NOT NULL;

-- 4. 启用行级安全策略 (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略

-- 获取当前用户的租户ID的辅助函数
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS integer
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(
        public.get_tenant_id_by_hostname(current_setting('request.headers', true)::json->>'host'),
        0
    );
$$;

-- Posts 表的 RLS 策略
DROP POLICY IF EXISTS "tenant_isolation_posts_select" ON public.posts;
CREATE POLICY "tenant_isolation_posts_select" 
ON public.posts 
FOR SELECT 
USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "tenant_isolation_posts_insert" ON public.posts;
CREATE POLICY "tenant_isolation_posts_insert" 
ON public.posts 
FOR INSERT 
WITH CHECK (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "tenant_isolation_posts_update" ON public.posts;
CREATE POLICY "tenant_isolation_posts_update" 
ON public.posts 
FOR UPDATE 
USING (tenant_id = public.get_current_tenant_id());

-- Comments 表的 RLS 策略
DROP POLICY IF EXISTS "tenant_isolation_comments_select" ON public.comments;
CREATE POLICY "tenant_isolation_comments_select" 
ON public.comments 
FOR SELECT 
USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "tenant_isolation_comments_insert" ON public.comments;
CREATE POLICY "tenant_isolation_comments_insert" 
ON public.comments 
FOR INSERT 
WITH CHECK (tenant_id = public.get_current_tenant_id());

-- Likes 表的 RLS 策略
DROP POLICY IF EXISTS "tenant_isolation_likes_select" ON public.likes;
CREATE POLICY "tenant_isolation_likes_select" 
ON public.likes 
FOR SELECT 
USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "tenant_isolation_likes_insert" ON public.likes;
CREATE POLICY "tenant_isolation_likes_insert" 
ON public.likes 
FOR INSERT 
WITH CHECK (tenant_id = public.get_current_tenant_id());

-- Page Content 表的 RLS 策略 (允许显示主站内容作为后备)
DROP POLICY IF EXISTS "tenant_isolation_page_content_select" ON public.page_content;
CREATE POLICY "tenant_isolation_page_content_select" 
ON public.page_content 
FOR SELECT 
USING (
    tenant_id = public.get_current_tenant_id() 
    OR tenant_id = 0  -- 允许显示主站内容作为后备
);

-- 6. 创建触发器，确保新记录自动设置正确的 tenant_id

-- 为 posts 表创建触发器
CREATE OR REPLACE FUNCTION public.set_tenant_id_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.tenant_id IS NULL THEN
        NEW.tenant_id := public.get_current_tenant_id();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_tenant_id_posts ON public.posts;
CREATE TRIGGER trigger_set_tenant_id_posts 
    BEFORE INSERT ON public.posts 
    FOR EACH ROW 
    EXECUTE FUNCTION public.set_tenant_id_on_insert();

DROP TRIGGER IF EXISTS trigger_set_tenant_id_comments ON public.comments;
CREATE TRIGGER trigger_set_tenant_id_comments 
    BEFORE INSERT ON public.comments 
    FOR EACH ROW 
    EXECUTE FUNCTION public.set_tenant_id_on_insert();

DROP TRIGGER IF EXISTS trigger_set_tenant_id_likes ON public.likes;
CREATE TRIGGER trigger_set_tenant_id_likes 
    BEFORE INSERT ON public.likes 
    FOR EACH ROW 
    EXECUTE FUNCTION public.set_tenant_id_on_insert();

-- 完成
SELECT 'Tenant isolation fix completed successfully!' as result; 