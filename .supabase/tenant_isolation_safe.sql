-- Safe tenant isolation setup (no RLS)
-- 1) RPC: get_tenant_id_by_hostname
CREATE OR REPLACE FUNCTION public.get_tenant_id_by_hostname(p_hostname text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Adjust main site hostnames as needed
    IF p_hostname IN ('localhost', '127.0.0.1') THEN
        RETURN 0;
    END IF;

    RETURN (
        SELECT id
        FROM public.tenant_requests
        WHERE (vercel_assigned_domain = p_hostname OR desired_domain = p_hostname)
          AND status = 'approved'
        ORDER BY id
        LIMIT 1
    );
EXCEPTION WHEN OTHERS THEN
    RETURN 0;
END;
$$;

-- 2) Backfill NULL tenant_id to 0 (main site)
UPDATE public.posts SET tenant_id = 0 WHERE tenant_id IS NULL;
UPDATE public.comments SET tenant_id = 0 WHERE tenant_id IS NULL;
UPDATE public.likes SET tenant_id = 0 WHERE tenant_id IS NULL;
UPDATE public.profiles SET tenant_id = 0 WHERE tenant_id IS NULL;
UPDATE public.page_content SET tenant_id = 0 WHERE tenant_id IS NULL;

-- 3) Enforce defaults + NOT NULL (data already clean)
ALTER TABLE public.posts ALTER COLUMN tenant_id SET DEFAULT 0;
ALTER TABLE public.posts ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.comments ALTER COLUMN tenant_id SET DEFAULT 0;
ALTER TABLE public.comments ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.likes ALTER COLUMN tenant_id SET DEFAULT 0;
ALTER TABLE public.likes ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.profiles ALTER COLUMN tenant_id SET DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN tenant_id SET NOT NULL;

-- Optional: page_content can remain nullable to allow fallback logic
-- Uncomment if you want strict NOT NULL:
-- ALTER TABLE public.page_content ALTER COLUMN tenant_id SET DEFAULT 0;
-- ALTER TABLE public.page_content ALTER COLUMN tenant_id SET NOT NULL;

SELECT 'safe_tenant_setup_completed' AS result; 