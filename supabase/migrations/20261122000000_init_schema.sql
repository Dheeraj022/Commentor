-- ============================================================================
-- Social Media Comment Monitoring Dashboard - Initial Schema Migration
-- Matches PRD Section 11 & Section 14 (RLS & Security)
-- ============================================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Workspace Members
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (workspace_id, user_id)
);

-- 3. Social Accounts
CREATE TABLE IF NOT EXISTS public.social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'youtube', 'linkedin')),
    display_name TEXT NOT NULL,
    handle TEXT NOT NULL,
    profile_url TEXT NOT NULL,
    external_account_id TEXT,
    actor_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Social Posts
CREATE TABLE IF NOT EXISTS public.social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    social_account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'youtube', 'linkedin')),
    external_post_id TEXT NOT NULL,
    post_url TEXT,
    text_content TEXT,
    published_at TIMESTAMPTZ,
    media_type TEXT,
    raw_data JSONB,
    first_fetched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_fetched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_social_post UNIQUE (social_account_id, platform, external_post_id)
);

-- 5. Social Comments
CREATE TABLE IF NOT EXISTS public.social_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    social_account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
    social_post_id UUID REFERENCES public.social_posts(id) ON DELETE SET NULL,
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'youtube', 'linkedin')),
    external_comment_id TEXT NOT NULL,
    parent_external_comment_id TEXT,
    comment_text TEXT NOT NULL,
    author_name TEXT,
    author_profile_url TEXT,
    comment_url TEXT,
    published_at TIMESTAMPTZ,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    raw_data JSONB,
    first_fetched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_fetched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_social_comment UNIQUE (social_account_id, platform, external_comment_id)
);

-- 6. Sentiment Analysis
CREATE TABLE IF NOT EXISTS public.sentiment_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    social_comment_id UUID NOT NULL REFERENCES public.social_comments(id) ON DELETE CASCADE,
    automated_label TEXT NOT NULL CHECK (automated_label IN ('positive', 'negative', 'neutral')),
    manual_label TEXT CHECK (manual_label IN ('positive', 'negative', 'neutral')),
    confidence NUMERIC(4, 3),
    reason TEXT,
    language TEXT,
    provider TEXT,
    model_name TEXT,
    analysis_status TEXT NOT NULL DEFAULT 'completed',
    analyzed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_comment_sentiment UNIQUE (social_comment_id)
);

-- 7. Fetch Batches
CREATE TABLE IF NOT EXISTS public.fetch_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'processing', 'completed', 'partially_completed', 'failed', 'cancelled')),
    refresh_requested BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

-- 8. Fetch Batch Accounts
CREATE TABLE IF NOT EXISTS public.fetch_batch_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fetch_batch_id UUID NOT NULL REFERENCES public.fetch_batches(id) ON DELETE CASCADE,
    social_account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'processing', 'completed', 'partially_completed', 'failed', 'cancelled')),
    coverage_status TEXT NOT NULL CHECK (coverage_status IN ('complete', 'partial', 'missing', 'unknown')),
    posts_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT
);

-- 9. Apify Runs
CREATE TABLE IF NOT EXISTS public.apify_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    fetch_batch_account_id UUID NOT NULL REFERENCES public.fetch_batch_accounts(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'youtube', 'linkedin')),
    actor_id TEXT NOT NULL,
    apify_run_id TEXT NOT NULL,
    dataset_id TEXT,
    status TEXT NOT NULL,
    usage_info JSONB,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    error_message TEXT
);

-- 10. Fetch Coverage
CREATE TABLE IF NOT EXISTS public.fetch_coverage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    social_account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'youtube', 'linkedin')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    coverage_status TEXT NOT NULL CHECK (coverage_status IN ('complete', 'partial', 'missing', 'unknown')),
    actor_id TEXT,
    last_fetch_batch_id UUID REFERENCES public.fetch_batches(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    posts_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    configuration_version TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_social_posts_workspace ON public.social_posts (workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_account ON public.social_posts (social_account_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_published ON public.social_posts (published_at);

CREATE INDEX IF NOT EXISTS idx_social_comments_workspace ON public.social_comments (workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_account ON public.social_comments (social_account_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_post ON public.social_comments (social_post_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_published ON public.social_comments (published_at);

CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_workspace ON public.sentiment_analysis (workspace_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_labels ON public.sentiment_analysis (automated_label, manual_label);

CREATE INDEX IF NOT EXISTS idx_fetch_batches_workspace ON public.fetch_batches (workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_fetch_coverage_account ON public.fetch_coverage (social_account_id, start_date, end_date);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fetch_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fetch_batch_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apify_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fetch_coverage ENABLE ROW LEVEL SECURITY;

-- Helper function: check if authenticated user belongs to workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
  );
$$;

-- Policies for workspaces
CREATE POLICY "Users can access workspaces they belong to"
  ON public.workspaces FOR ALL
  USING (public.is_workspace_member(id));

-- Policies for workspace_members
CREATE POLICY "Users can view members of their workspaces"
  ON public.workspace_members FOR SELECT
  USING (public.is_workspace_member(workspace_id));

-- Policies for social_accounts
CREATE POLICY "Workspace members can access social_accounts"
  ON public.social_accounts FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

-- Policies for social_posts
CREATE POLICY "Workspace members can access social_posts"
  ON public.social_posts FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

-- Policies for social_comments
CREATE POLICY "Workspace members can access social_comments"
  ON public.social_comments FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

-- Policies for sentiment_analysis
CREATE POLICY "Workspace members can access sentiment_analysis"
  ON public.sentiment_analysis FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

-- Policies for fetch_batches
CREATE POLICY "Workspace members can access fetch_batches"
  ON public.fetch_batches FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

-- Policies for fetch_batch_accounts
CREATE POLICY "Workspace members can access fetch_batch_accounts"
  ON public.fetch_batch_accounts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.fetch_batches b
    WHERE b.id = fetch_batch_id AND public.is_workspace_member(b.workspace_id)
  ));

-- Policies for apify_runs
CREATE POLICY "Workspace members can access apify_runs"
  ON public.apify_runs FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

-- Policies for fetch_coverage
CREATE POLICY "Workspace members can access fetch_coverage"
  ON public.fetch_coverage FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));
