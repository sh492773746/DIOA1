-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.app_settings (
  key text NOT NULL,
  value text,
  description text,
  type text DEFAULT 'string'::text,
  tenant_id integer NOT NULL,
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text,
  CONSTRAINT app_settings_pkey PRIMARY KEY (key, tenant_id),
  CONSTRAINT app_settings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant_requests(id)
);
CREATE TABLE public.comments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  post_id bigint NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  rejection_reason text,
  tenant_id integer,
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT comments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant_requests(id)
);
CREATE TABLE public.daily_check_ins (
  user_id uuid NOT NULL,
  check_in_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT daily_check_ins_pkey PRIMARY KEY (user_id, check_in_date),
  CONSTRAINT daily_check_ins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.game_categories (
  id integer NOT NULL DEFAULT nextval('game_categories_id_seq'::regclass),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text,
  position integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT game_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.likes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  post_id bigint NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  tenant_id integer,
  CONSTRAINT likes_pkey PRIMARY KEY (id),
  CONSTRAINT likes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant_requests(id),
  CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.notifications (
  id bigint NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  user_id uuid NOT NULL,
  type text NOT NULL,
  content jsonb NOT NULL,
  is_read boolean DEFAULT false,
  related_post_id bigint,
  related_comment_id bigint,
  related_user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_related_post_id_fkey FOREIGN KEY (related_post_id) REFERENCES public.posts(id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT notifications_related_user_id_fkey FOREIGN KEY (related_user_id) REFERENCES public.profiles(id),
  CONSTRAINT notifications_related_comment_id_fkey FOREIGN KEY (related_comment_id) REFERENCES public.comments(id)
);
CREATE TABLE public.page_content (
  id integer NOT NULL DEFAULT nextval('page_content_id_seq'::regclass),
  page text NOT NULL DEFAULT 'home'::text,
  section text NOT NULL DEFAULT 'general'::text,
  content jsonb NOT NULL,
  position integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  tenant_id integer,
  is_public boolean DEFAULT true,
  CONSTRAINT page_content_pkey PRIMARY KEY (id),
  CONSTRAINT fk_page_content_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenant_requests(id)
);
CREATE TABLE public.points_history (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  change_amount integer NOT NULL,
  reason text NOT NULL,
  related_post_id bigint,
  related_comment_id bigint,
  related_user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT points_history_pkey PRIMARY KEY (id),
  CONSTRAINT points_history_related_comment_id_fkey FOREIGN KEY (related_comment_id) REFERENCES public.comments(id),
  CONSTRAINT points_history_related_user_id_fkey FOREIGN KEY (related_user_id) REFERENCES public.profiles(id),
  CONSTRAINT points_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT points_history_related_post_id_fkey FOREIGN KEY (related_post_id) REFERENCES public.posts(id)
);
CREATE TABLE public.posts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  is_ad boolean DEFAULT false,
  image_urls ARRAY,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  rejection_reason text,
  is_pinned boolean DEFAULT false,
  updated_at timestamp with time zone,
  edit_count integer DEFAULT 0,
  tenant_id integer,
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant_requests(id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  avatar_url text,
  points integer DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  virtual_currency integer DEFAULT 0,
  free_posts_count integer DEFAULT 0,
  invite_code text UNIQUE,
  invited_by uuid,
  invited_users_count integer DEFAULT 0,
  invitation_points integer DEFAULT 0,
  role text NOT NULL DEFAULT 'user'::text,
  uid bigint NOT NULL,
  last_username_update timestamp with time zone,
  tenant_id integer,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id),
  CONSTRAINT fk_tenant_profile FOREIGN KEY (tenant_id) REFERENCES public.tenant_requests(id)
);
CREATE TABLE public.shop_products (
  id bigint NOT NULL DEFAULT nextval('shop_products_id_seq'::regclass),
  name text NOT NULL,
  description text,
  image_url text,
  price integer NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT '-1'::integer,
  is_active boolean NOT NULL DEFAULT true,
  tenant_id integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT shop_products_pkey PRIMARY KEY (id),
  CONSTRAINT shop_products_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant_requests(id)
);
CREATE TABLE public.shop_redemptions (
  id bigint NOT NULL DEFAULT nextval('shop_redemptions_id_seq'::regclass),
  user_id uuid NOT NULL,
  product_id bigint NOT NULL,
  points_spent integer NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  notes text,
  tenant_id integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT shop_redemptions_pkey PRIMARY KEY (id),
  CONSTRAINT shop_redemptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant_requests(id),
  CONSTRAINT shop_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT shop_redemptions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.shop_products(id)
);
CREATE TABLE public.tenant_admins (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  tenant_id integer NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tenant_admins_pkey PRIMARY KEY (id),
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenant_requests(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.tenant_requests (
  id integer NOT NULL DEFAULT nextval('tenant_requests_id_seq'::regclass),
  user_id uuid NOT NULL,
  desired_domain text NOT NULL,
  contact_wangwang text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  vercel_project_id text,
  vercel_deployment_status text,
  vercel_assigned_domain text,
  CONSTRAINT tenant_requests_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);