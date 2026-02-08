-- ============================================================================
-- Migration: Create Blog, Documentation tables and set_rls_context function
-- Date: 2026-02-08
-- Description: Creates all tables needed for the Blog and Documentation CMS
--              plus the set_rls_context RPC function for PIN-based auth RLS
-- ============================================================================

-- ============================================================================
-- ENUM: ContentStatus for blog/doc content
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContentStatus') THEN
    CREATE TYPE public."ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
  END IF;
END
$$;

-- ============================================================================
-- FUNCTION: set_rls_context
-- Used by the app to set session-level variables for RLS when using PIN auth
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_rls_context(
  p_user_id TEXT,
  p_etablissement_id TEXT,
  p_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.user_id', p_user_id, true);
  PERFORM set_config('app.etablissement_id', p_etablissement_id, true);
  PERFORM set_config('app.user_role', p_role, true);
END;
$$;

-- ============================================================================
-- TABLE: blog_categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(50) NOT NULL DEFAULT 'gray',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.blog_categories IS 'Categories for blog posts';

-- ============================================================================
-- TABLE: blog_authors
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.blog_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  role VARCHAR(200),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.blog_authors IS 'Authors for blog posts';

-- ============================================================================
-- TABLE: blog_tags
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.blog_tags IS 'Tags for blog posts';

-- ============================================================================
-- TABLE: blog_posts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(300) NOT NULL UNIQUE,
  title VARCHAR(300) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.blog_categories(id) ON DELETE RESTRICT,
  author_id UUID NOT NULL REFERENCES public.blog_authors(id) ON DELETE RESTRICT,
  featured_image TEXT,
  icon VARCHAR(50) NOT NULL DEFAULT 'FileText',
  color VARCHAR(50) NOT NULL DEFAULT 'gray',
  status public."ContentStatus" NOT NULL DEFAULT 'DRAFT',
  featured BOOLEAN NOT NULL DEFAULT false,
  meta_title VARCHAR(200),
  meta_description VARCHAR(300),
  created_by UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.blog_posts IS 'Blog posts / articles';

-- Indexes for blog_posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON public.blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON public.blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON public.blog_posts(created_at DESC);

-- Foreign key naming for Supabase relationship inference
ALTER TABLE public.blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_created_by_fkey;
ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.utilisateurs(id) ON DELETE SET NULL;

-- ============================================================================
-- TABLE: blog_post_tags (junction table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.blog_post_tags (
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, tag_id)
);

COMMENT ON TABLE public.blog_post_tags IS 'Junction table between blog posts and tags';

CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id ON public.blog_post_tags(tag_id);

-- ============================================================================
-- TABLE: doc_categories (documentation categories)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.doc_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(200) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50) NOT NULL DEFAULT 'Book',
  color VARCHAR(50) NOT NULL DEFAULT 'blue',
  ordre INTEGER NOT NULL DEFAULT 0,
  status public."ContentStatus" NOT NULL DEFAULT 'DRAFT',
  created_by UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.doc_categories IS 'Documentation categories';

CREATE INDEX IF NOT EXISTS idx_doc_categories_slug ON public.doc_categories(slug);
CREATE INDEX IF NOT EXISTS idx_doc_categories_status ON public.doc_categories(status);
CREATE INDEX IF NOT EXISTS idx_doc_categories_ordre ON public.doc_categories(ordre);

-- Explicit FK naming for Supabase relationship inference
ALTER TABLE public.doc_categories
  DROP CONSTRAINT IF EXISTS doc_categories_created_by_fkey;
ALTER TABLE public.doc_categories
  ADD CONSTRAINT doc_categories_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.utilisateurs(id) ON DELETE SET NULL;

-- ============================================================================
-- TABLE: doc_articles (documentation articles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.doc_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.doc_categories(id) ON DELETE CASCADE,
  slug VARCHAR(200) NOT NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  read_time VARCHAR(20) NOT NULL DEFAULT '5 min',
  ordre INTEGER NOT NULL DEFAULT 0,
  status public."ContentStatus" NOT NULL DEFAULT 'DRAFT',
  meta_title VARCHAR(200),
  meta_description VARCHAR(300),
  created_by UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT doc_articles_category_slug_unique UNIQUE (category_id, slug)
);

COMMENT ON TABLE public.doc_articles IS 'Documentation articles';

CREATE INDEX IF NOT EXISTS idx_doc_articles_category_id ON public.doc_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_doc_articles_slug ON public.doc_articles(slug);
CREATE INDEX IF NOT EXISTS idx_doc_articles_status ON public.doc_articles(status);
CREATE INDEX IF NOT EXISTS idx_doc_articles_ordre ON public.doc_articles(ordre);

-- Explicit FK naming for Supabase relationship inference
ALTER TABLE public.doc_articles
  DROP CONSTRAINT IF EXISTS doc_articles_created_by_fkey;
ALTER TABLE public.doc_articles
  ADD CONSTRAINT doc_articles_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.utilisateurs(id) ON DELETE SET NULL;

-- ============================================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_authors_updated_at
  BEFORE UPDATE ON public.blog_authors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doc_categories_updated_at
  BEFORE UPDATE ON public.doc_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doc_articles_updated_at
  BEFORE UPDATE ON public.doc_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS: Enable RLS on all new tables
-- ============================================================================

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_articles ENABLE ROW LEVEL SECURITY;

-- Blog Categories: public read, SUPER_ADMIN write
CREATE POLICY "blog_categories_select_all" ON public.blog_categories
  FOR SELECT USING (true);

CREATE POLICY "blog_categories_insert_super_admin" ON public.blog_categories
  FOR INSERT WITH CHECK (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );

CREATE POLICY "blog_categories_update_super_admin" ON public.blog_categories
  FOR UPDATE USING (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );

CREATE POLICY "blog_categories_delete_super_admin" ON public.blog_categories
  FOR DELETE USING (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );

-- Blog Authors
CREATE POLICY "blog_authors_select_all" ON public.blog_authors
  FOR SELECT USING (true);

CREATE POLICY "blog_authors_insert_super_admin" ON public.blog_authors
  FOR INSERT WITH CHECK (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );

CREATE POLICY "blog_authors_update_super_admin" ON public.blog_authors
  FOR UPDATE USING (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );

CREATE POLICY "blog_authors_delete_super_admin" ON public.blog_authors
  FOR DELETE USING (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );

-- Blog Tags
CREATE POLICY "blog_tags_select_all" ON public.blog_tags
  FOR SELECT USING (true);

CREATE POLICY "blog_tags_insert_super_admin" ON public.blog_tags
  FOR INSERT WITH CHECK (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );

CREATE POLICY "blog_tags_delete_super_admin" ON public.blog_tags
  FOR DELETE USING (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );

-- Blog Posts
CREATE POLICY "blog_posts_select_all" ON public.blog_posts
  FOR SELECT USING (true);

CREATE POLICY "blog_posts_insert_super_admin" ON public.blog_posts
  FOR INSERT WITH CHECK (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );

CREATE POLICY "blog_posts_update_super_admin" ON public.blog_posts
  FOR UPDATE USING (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );

CREATE POLICY "blog_posts_delete_super_admin" ON public.blog_posts
  FOR DELETE USING (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );

-- Blog Post Tags
CREATE POLICY "blog_post_tags_select_all" ON public.blog_post_tags
  FOR SELECT USING (true);

CREATE POLICY "blog_post_tags_insert_super_admin" ON public.blog_post_tags
  FOR INSERT WITH CHECK (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );

CREATE POLICY "blog_post_tags_delete_super_admin" ON public.blog_post_tags
  FOR DELETE USING (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );

-- Doc Categories
CREATE POLICY "doc_categories_select_all" ON public.doc_categories
  FOR SELECT USING (true);

CREATE POLICY "doc_categories_insert_super_admin" ON public.doc_categories
  FOR INSERT WITH CHECK (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );

CREATE POLICY "doc_categories_update_super_admin" ON public.doc_categories
  FOR UPDATE USING (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );

CREATE POLICY "doc_categories_delete_super_admin" ON public.doc_categories
  FOR DELETE USING (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );

-- Doc Articles
CREATE POLICY "doc_articles_select_all" ON public.doc_articles
  FOR SELECT USING (true);

CREATE POLICY "doc_articles_insert_super_admin" ON public.doc_articles
  FOR INSERT WITH CHECK (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );

CREATE POLICY "doc_articles_update_super_admin" ON public.doc_articles
  FOR UPDATE USING (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );

CREATE POLICY "doc_articles_delete_super_admin" ON public.doc_articles
  FOR DELETE USING (
    COALESCE(current_setting('app.user_role', true), '') = 'SUPER_ADMIN'
    OR current_setting('role', true) = 'service_role'
  );
