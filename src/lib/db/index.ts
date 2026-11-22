import {
  Platform,
  SentimentLabel,
  SocialAccount,
  SocialPost,
  SocialComment,
  FetchBatch,
  FetchCoverage,
  OverviewMetrics,
} from "@/types";
import { generateFeedbackSummary } from "../sentiment/summary-generator";
import { analyzeSentimentRuleBased } from "../sentiment/analyzer";
import { createClient } from "@supabase/supabase-js";

// Default Workspace ID
const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Clean Fallback Memory State
let mockAccounts: SocialAccount[] = [];
let mockPosts: SocialPost[] = [];
let mockComments: SocialComment[] = [];
let mockCoverages: FetchCoverage[] = [];
let mockBatches: FetchBatch[] = [];

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "00000000-0000-4000-8000-" + Date.now().toString(16).padStart(12, "0");
}

export const db = {
  getDefaultWorkspaceId: () => DEFAULT_WORKSPACE_ID,

  // ==========================================
  // Social Accounts
  // ==========================================
  async getAccounts(workspaceId: string = DEFAULT_WORKSPACE_ID): Promise<SocialAccount[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("social_accounts")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          return data.map((r) => ({
            id: r.id,
            workspaceId: r.workspace_id,
            platform: r.platform,
            displayName: r.display_name,
            handle: r.handle,
            profileUrl: r.profile_url,
            externalAccountId: r.external_account_id,
            actorId: r.actor_id,
            isActive: r.is_active,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            lastFetchedAt: r.last_fetched_at,
          }));
        }
      } catch (err) {
        console.error("Supabase getAccounts error:", err);
      }
    }
    return [...mockAccounts.filter((a) => a.workspaceId === workspaceId)];
  },

  async addAccount(accountData: Omit<SocialAccount, "id" | "createdAt" | "updatedAt">): Promise<SocialAccount> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("social_accounts")
          .insert({
            workspace_id: accountData.workspaceId || DEFAULT_WORKSPACE_ID,
            platform: accountData.platform,
            display_name: accountData.displayName,
            handle: accountData.handle,
            profile_url: accountData.profileUrl,
            external_account_id: accountData.externalAccountId || null,
            actor_id: accountData.actorId,
            is_active: accountData.isActive ?? true,
          })
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            workspaceId: data.workspace_id,
            platform: data.platform,
            displayName: data.display_name,
            handle: data.handle,
            profileUrl: data.profile_url,
            externalAccountId: data.external_account_id,
            actorId: data.actor_id,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            postCount: 0,
            commentCount: 0,
          };
        }
      } catch (err) {
        console.error("Supabase addAccount error:", err);
      }
    }

    const newAccount: SocialAccount = {
      ...accountData,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      postCount: 0,
      commentCount: 0,
    };
    mockAccounts.push(newAccount);
    return newAccount;
  },

  async updateAccount(id: string, updates: Partial<SocialAccount>): Promise<SocialAccount | null> {
    if (supabase) {
      try {
        const updatePayload: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (updates.displayName !== undefined) updatePayload.display_name = updates.displayName;
        if (updates.handle !== undefined) updatePayload.handle = updates.handle;
        if (updates.profileUrl !== undefined) updatePayload.profile_url = updates.profileUrl;
        if (updates.actorId !== undefined) updatePayload.actor_id = updates.actorId;
        if (updates.isActive !== undefined) updatePayload.is_active = updates.isActive;
        if (updates.lastFetchedAt !== undefined) updatePayload.last_fetched_at = updates.lastFetchedAt;

        const { data, error } = await supabase
          .from("social_accounts")
          .update(updatePayload)
          .eq("id", id)
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            workspaceId: data.workspace_id,
            platform: data.platform,
            displayName: data.display_name,
            handle: data.handle,
            profileUrl: data.profile_url,
            externalAccountId: data.external_account_id,
            actorId: data.actor_id,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            lastFetchedAt: data.last_fetched_at,
          };
        }
      } catch (err) {
        console.error("Supabase updateAccount error:", err);
      }
    }

    const index = mockAccounts.findIndex((a) => a.id === id);
    if (index === -1) return null;
    mockAccounts[index] = {
      ...mockAccounts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return mockAccounts[index];
  },

  async deleteAccount(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase.from("social_accounts").delete().eq("id", id);
        if (!error) return true;
      } catch (err) {
        console.error("Supabase deleteAccount error:", err);
      }
    }
    const idx = mockAccounts.findIndex((a) => a.id === id);
    if (idx !== -1) {
      mockAccounts.splice(idx, 1);
      return true;
    }
    return false;
  },

  // ==========================================
  // Fetch Coverage
  // ==========================================
  async getCoverages(workspaceId: string = DEFAULT_WORKSPACE_ID): Promise<FetchCoverage[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from("fetch_coverage").select("*");
        if (!error && data) {
          return data.map((r) => ({
            id: r.id,
            workspaceId: r.workspace_id,
            socialAccountId: r.social_account_id,
            platform: r.platform,
            startDate: r.start_date,
            endDate: r.end_date,
            coverageStatus: r.coverage_status,
            actorId: r.actor_id,
            lastFetchBatchId: r.last_fetch_batch_id,
            completedAt: r.completed_at,
            postsCount: r.posts_count,
            commentsCount: r.comments_count,
            configurationVersion: r.configuration_version,
          }));
        }
      } catch (err) {
        console.error("Supabase getCoverages error:", err);
      }
    }
    return [...mockCoverages.filter((c) => c.workspaceId === workspaceId)];
  },

  async recordCoverage(coverage: Omit<FetchCoverage, "id">): Promise<FetchCoverage> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("fetch_coverage")
          .upsert(
            {
              workspace_id: coverage.workspaceId || DEFAULT_WORKSPACE_ID,
              social_account_id: coverage.socialAccountId,
              platform: coverage.platform,
              start_date: coverage.startDate,
              end_date: coverage.endDate,
              coverage_status: coverage.coverageStatus,
              actor_id: coverage.actorId,
              last_fetch_batch_id: coverage.lastFetchBatchId && coverage.lastFetchBatchId.includes("-") && coverage.lastFetchBatchId.length === 36 ? coverage.lastFetchBatchId : null,
              completed_at: new Date().toISOString(),
              posts_count: coverage.postsCount,
              comments_count: coverage.commentsCount,
              configuration_version: coverage.configurationVersion || "v1.0",
            },
            { onConflict: "social_account_id, start_date, end_date" }
          )
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            workspaceId: data.workspace_id,
            socialAccountId: data.social_account_id,
            platform: data.platform,
            startDate: data.start_date,
            endDate: data.end_date,
            coverageStatus: data.coverage_status,
            actorId: data.actor_id,
            lastFetchBatchId: data.last_fetch_batch_id,
            completedAt: data.completed_at,
            postsCount: data.posts_count,
            commentsCount: data.comments_count,
            configurationVersion: data.configuration_version,
          };
        }
      } catch (err) {
        console.error("Supabase recordCoverage error:", err);
      }
    }

    const newCov: FetchCoverage = {
      ...coverage,
      id: generateUUID(),
      completedAt: new Date().toISOString(),
    };
    mockCoverages.push(newCov);
    return newCov;
  },

  // ==========================================
  // Batches
  // ==========================================
  async getBatches(workspaceId: string = DEFAULT_WORKSPACE_ID): Promise<FetchBatch[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("fetch_batches")
          .select(`
            *,
            accounts:fetch_batch_accounts(
              id,
              fetch_batch_id,
              social_account_id,
              status,
              coverage_status,
              posts_count,
              comments_count,
              error_message,
              social_account:social_accounts(*)
            )
          `)
          .order("created_at", { ascending: false });

        if (!error && data) {
          return data.map((b) => ({
            id: b.id,
            workspaceId: b.workspace_id,
            requestedBy: b.requested_by,
            startDate: b.start_date,
            endDate: b.end_date,
            timezone: b.timezone,
            status: b.status,
            refreshRequested: b.refresh_requested,
            createdAt: b.created_at,
            startedAt: b.started_at,
            completedAt: b.completed_at,
            errorMessage: b.error_message,
            postsFetched: (b.accounts || []).reduce((acc: number, a: { posts_count?: number }) => acc + (a.posts_count || 0), 0),
            commentsFetched: (b.accounts || []).reduce((acc: number, a: { comments_count?: number }) => acc + (a.comments_count || 0), 0),
            accounts: (b.accounts || []).map((a: Record<string, unknown>) => ({
              id: a.id as string,
              fetchBatchId: a.fetch_batch_id as string,
              socialAccountId: a.social_account_id as string,
              status: a.status as FetchBatch["status"],
              coverageStatus: a.coverage_status as any,
              postsCount: (a.posts_count as number) || 0,
              commentsCount: (a.comments_count as number) || 0,
              errorMessage: a.error_message as string | undefined,
              socialAccount: a.social_account ? {
                id: (a.social_account as Record<string, unknown>).id as string,
                workspaceId: (a.social_account as Record<string, unknown>).workspace_id as string,
                platform: (a.social_account as Record<string, unknown>).platform as Platform,
                displayName: (a.social_account as Record<string, unknown>).display_name as string,
                handle: (a.social_account as Record<string, unknown>).handle as string,
                profileUrl: (a.social_account as Record<string, unknown>).profile_url as string,
                actorId: (a.social_account as Record<string, unknown>).actor_id as string,
                isActive: (a.social_account as Record<string, unknown>).is_active as boolean,
                createdAt: (a.social_account as Record<string, unknown>).created_at as string,
                updatedAt: (a.social_account as Record<string, unknown>).updated_at as string,
              } : undefined,
            })),
          }));
        }
      } catch (err) {
        console.error("Supabase getBatches error:", err);
      }
    }
    return [...mockBatches.filter((b) => b.workspaceId === workspaceId)].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getBatchById(id: string): Promise<FetchBatch | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("fetch_batches")
          .select(`
            *,
            accounts:fetch_batch_accounts(
              id,
              fetch_batch_id,
              social_account_id,
              status,
              coverage_status,
              posts_count,
              comments_count,
              error_message,
              social_account:social_accounts(*)
            )
          `)
          .eq("id", id)
          .single();

        if (!error && data) {
          const accounts = (data.accounts || []).map((a: Record<string, unknown>) => ({
            id: a.id as string,
            fetchBatchId: a.fetch_batch_id as string,
            socialAccountId: a.social_account_id as string,
            status: a.status as FetchBatch["status"],
            coverageStatus: a.coverage_status as any,
            postsCount: (a.posts_count as number) || 0,
            commentsCount: (a.comments_count as number) || 0,
            errorMessage: a.error_message as string | undefined,
            socialAccount: a.social_account ? {
              id: (a.social_account as Record<string, unknown>).id as string,
              workspaceId: (a.social_account as Record<string, unknown>).workspace_id as string,
              platform: (a.social_account as Record<string, unknown>).platform as Platform,
              displayName: (a.social_account as Record<string, unknown>).display_name as string,
              handle: (a.social_account as Record<string, unknown>).handle as string,
              profileUrl: (a.social_account as Record<string, unknown>).profile_url as string,
              actorId: (a.social_account as Record<string, unknown>).actor_id as string,
              isActive: (a.social_account as Record<string, unknown>).is_active as boolean,
              createdAt: (a.social_account as Record<string, unknown>).created_at as string,
              updatedAt: (a.social_account as Record<string, unknown>).updated_at as string,
            } : undefined,
          }));

          const postsFetched = accounts.reduce((acc: number, a: { postsCount: number }) => acc + a.postsCount, 0);
          const commentsFetched = accounts.reduce((acc: number, a: { commentsCount: number }) => acc + a.commentsCount, 0);

          return {
            id: data.id,
            workspaceId: data.workspace_id,
            requestedBy: data.requested_by,
            startDate: data.start_date,
            endDate: data.end_date,
            timezone: data.timezone,
            status: data.status,
            refreshRequested: data.refresh_requested,
            createdAt: data.created_at,
            startedAt: data.started_at,
            completedAt: data.completed_at,
            errorMessage: data.error_message,
            postsFetched,
            commentsFetched,
            accounts,
          };
        }
      } catch (err) {
        console.error("Supabase getBatchById error:", err);
      }
    }

    const batch = mockBatches.find((b) => b.id === id);
    if (!batch) return null;
    return batch;
  },

  async createBatch(batchData: Omit<FetchBatch, "id" | "createdAt">): Promise<FetchBatch> {
    const batchId = generateUUID();
    const now = new Date().toISOString();

    if (supabase) {
      try {
        const { data: batch, error: batchErr } = await supabase
          .from("fetch_batches")
          .insert({
            id: batchId,
            workspace_id: batchData.workspaceId || DEFAULT_WORKSPACE_ID,
            start_date: batchData.startDate,
            end_date: batchData.endDate,
            timezone: batchData.timezone || "Asia/Kolkata",
            status: batchData.status || "running",
            refresh_requested: batchData.refreshRequested || false,
            started_at: batchData.startedAt || now,
          })
          .select()
          .single();

        if (!batchErr && batch) {
          if (batchData.accounts && batchData.accounts.length > 0) {
            const batchAccountsPayload = batchData.accounts.map((a) => ({
              id: generateUUID(),
              fetch_batch_id: batchId,
              social_account_id: a.socialAccountId,
              status: a.status || "queued",
              coverage_status: a.coverageStatus || "missing",
              posts_count: a.postsCount || 0,
              comments_count: a.commentsCount || 0,
            }));

            await supabase.from("fetch_batch_accounts").insert(batchAccountsPayload);
          }

          const created = await this.getBatchById(batchId);
          if (created) return created;
        }
      } catch (err) {
        console.error("Supabase createBatch error:", err);
      }
    }

    const fallbackBatch: FetchBatch = {
      ...batchData,
      id: batchId,
      createdAt: now,
    };
    mockBatches.unshift(fallbackBatch);
    return fallbackBatch;
  },

  async updateBatch(id: string, updates: Partial<FetchBatch>): Promise<FetchBatch | null> {
    if (supabase) {
      try {
        const payload: Record<string, unknown> = {};
        if (updates.status) payload.status = updates.status;
        if (updates.completedAt) payload.completed_at = updates.completedAt;
        if (updates.errorMessage !== undefined) payload.error_message = updates.errorMessage;

        if (Object.keys(payload).length > 0) {
          await supabase.from("fetch_batches").update(payload).eq("id", id);
        }

        // Update accounts if provided
        if (updates.accounts && updates.accounts.length > 0) {
          for (const acc of updates.accounts) {
            if (acc.id) {
              await supabase
                .from("fetch_batch_accounts")
                .update({
                  status: acc.status,
                  posts_count: acc.postsCount,
                  comments_count: acc.commentsCount,
                  error_message: acc.errorMessage || null,
                })
                .eq("id", acc.id);
            }
          }
        }

        return await this.getBatchById(id);
      } catch (err) {
        console.error("Supabase updateBatch error:", err);
      }
    }

    const index = mockBatches.findIndex((b) => b.id === id);
    if (index === -1) return null;
    mockBatches[index] = {
      ...mockBatches[index],
      ...updates,
    };
    return mockBatches[index];
  },

  // ==========================================
  // Posts & Comments Storage (Real Supabase Upsert)
  // ==========================================
  async getPosts(options?: {
    workspaceId?: string;
    platform?: Platform;
    socialAccountId?: string;
  }): Promise<SocialPost[]> {
    if (supabase) {
      try {
        let query = supabase.from("social_posts").select("*").order("published_at", { ascending: false });
        if (options?.platform) query = query.eq("platform", options.platform);
        if (options?.socialAccountId) query = query.eq("social_account_id", options.socialAccountId);

        const { data, error } = await query;
        if (!error && data) {
          return data.map((p) => ({
            id: p.id,
            workspaceId: p.workspace_id,
            socialAccountId: p.social_account_id,
            platform: p.platform,
            externalPostId: p.external_post_id,
            postUrl: p.post_url,
            textContent: p.text_content,
            publishedAt: p.published_at,
            mediaType: p.media_type,
            rawData: p.raw_data,
            firstFetchedAt: p.first_fetched_at,
            lastFetchedAt: p.last_fetched_at,
          }));
        }
      } catch (err) {
        console.error("Supabase getPosts error:", err);
      }
    }
    return [...mockPosts];
  },

  async upsertPosts(posts: Omit<SocialPost, "id" | "firstFetchedAt" | "lastFetchedAt">[]): Promise<SocialPost[]> {
    if (posts.length === 0) return [];
    const now = new Date().toISOString();

    if (supabase) {
      try {
        const payload = posts.map((p) => ({
          workspace_id: p.workspaceId || DEFAULT_WORKSPACE_ID,
          social_account_id: p.socialAccountId,
          platform: p.platform,
          external_post_id: p.externalPostId,
          post_url: p.postUrl,
          text_content: p.textContent,
          published_at: p.publishedAt,
          media_type: p.mediaType,
          raw_data: p.rawData || {},
          last_fetched_at: now,
        }));

        const { data, error } = await supabase
          .from("social_posts")
          .upsert(payload, { onConflict: "social_account_id, platform, external_post_id" })
          .select();

        if (!error && data && data.length > 0) {
          return data.map((p) => ({
            id: p.id,
            workspaceId: p.workspace_id,
            socialAccountId: p.social_account_id,
            platform: p.platform,
            externalPostId: p.external_post_id,
            postUrl: p.post_url,
            textContent: p.text_content,
            publishedAt: p.published_at,
            mediaType: p.media_type,
            rawData: p.raw_data,
            firstFetchedAt: p.first_fetched_at,
            lastFetchedAt: p.last_fetched_at,
          }));
        }
      } catch (err) {
        console.error("Supabase upsertPosts error:", err);
      }
    }

    // Fallback in-memory
    const result: SocialPost[] = [];
    for (const post of posts) {
      const idx = mockPosts.findIndex(
        (p) => p.socialAccountId === post.socialAccountId && p.platform === post.platform && p.externalPostId === post.externalPostId
      );
      if (idx >= 0) {
        mockPosts[idx] = { ...mockPosts[idx], ...post, lastFetchedAt: now };
        result.push(mockPosts[idx]);
      } else {
        const newP: SocialPost = {
          ...post,
          id: generateUUID(),
          firstFetchedAt: now,
          lastFetchedAt: now,
        };
        mockPosts.push(newP);
        result.push(newP);
      }
    }
    return result;
  },

  async upsertComments(
    comments: (Omit<SocialComment, "id" | "firstFetchedAt" | "lastFetchedAt"> & {
      sentiment?: SentimentLabel | null;
    })[]
  ): Promise<SocialComment[]> {
    if (comments.length === 0) return [];
    const now = new Date().toISOString();

    if (supabase) {
      try {
        const payload = comments.map((c) => ({
          workspace_id: c.workspaceId || DEFAULT_WORKSPACE_ID,
          social_account_id: c.socialAccountId,
          social_post_id: c.socialPostId && c.socialPostId.length === 36 ? c.socialPostId : null,
          platform: c.platform,
          external_comment_id: c.externalCommentId,
          parent_external_comment_id: c.parentExternalCommentId || null,
          comment_text: c.commentText,
          author_name: c.authorName,
          author_profile_url: c.authorProfileUrl,
          comment_url: c.commentUrl,
          published_at: c.publishedAt,
          like_count: c.likeCount || 0,
          reply_count: c.replyCount || 0,
          raw_data: c.rawData || {},
          last_fetched_at: now,
        }));

        const { data: savedComments, error: commErr } = await supabase
          .from("social_comments")
          .upsert(payload, { onConflict: "social_account_id, platform, external_comment_id" })
          .select();

        if (!commErr && savedComments && savedComments.length > 0) {
          // Compute and store sentiment analysis for each comment
          const sentimentPayload = savedComments.map((sc) => {
            const analysis = analyzeSentimentRuleBased(sc.comment_text);
            return {
              workspace_id: sc.workspace_id,
              social_comment_id: sc.id,
              automated_label: analysis.automatedLabel,
              confidence: analysis.confidence,
              reason: analysis.reason,
              language: analysis.language,
              provider: "rule_based_lexicon",
              model_name: "v1.0",
              analysis_status: "completed",
              updated_at: now,
            };
          });

          await supabase
            .from("sentiment_analysis")
            .upsert(sentimentPayload, { onConflict: "social_comment_id" });

          return savedComments.map((sc) => {
            const analysis = analyzeSentimentRuleBased(sc.comment_text);
            return {
              id: sc.id,
              workspaceId: sc.workspace_id,
              socialAccountId: sc.social_account_id,
              socialPostId: sc.social_post_id,
              platform: sc.platform,
              externalCommentId: sc.external_comment_id,
              parentExternalCommentId: sc.parent_external_comment_id,
              commentText: sc.comment_text,
              authorName: sc.author_name,
              authorProfileUrl: sc.author_profile_url,
              commentUrl: sc.comment_url,
              publishedAt: sc.published_at,
              likeCount: sc.like_count,
              replyCount: sc.reply_count,
              rawData: sc.raw_data,
              firstFetchedAt: sc.first_fetched_at,
              lastFetchedAt: sc.last_fetched_at,
              sentiment: {
                ...analysis,
                analyzedAt: now,
              },
            };
          });
        }
      } catch (err) {
        console.error("Supabase upsertComments error:", err);
      }
    }

    // Fallback in-memory
    const result: SocialComment[] = [];
    for (const comment of comments) {
      const idx = mockComments.findIndex(
        (c) => c.socialAccountId === comment.socialAccountId && c.platform === comment.platform && c.externalCommentId === comment.externalCommentId
      );
      if (idx >= 0) {
        mockComments[idx] = { ...mockComments[idx], ...comment, lastFetchedAt: now };
        result.push(mockComments[idx]);
      } else {
        const sentimentResult = analyzeSentimentRuleBased(comment.commentText);
        const newComm: SocialComment = {
          ...comment,
          id: generateUUID(),
          firstFetchedAt: now,
          lastFetchedAt: now,
          sentiment: {
            ...sentimentResult,
            analyzedAt: now,
          },
        };
        mockComments.push(newComm);
        result.push(newComm);
      }
    }
    return result;
  },

  async updateCommentSentiment(commentId: string, manualLabel: SentimentLabel): Promise<SocialComment | null> {
    const now = new Date().toISOString();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("sentiment_analysis")
          .update({
            manual_label: manualLabel,
            updated_at: now,
          })
          .eq("social_comment_id", commentId)
          .select()
          .single();

        if (!error && data) {
          const { comments } = await this.getComments({ limit: 1 });
          const match = comments.find((c) => c.id === commentId);
          if (match) return match;
        }
      } catch (err) {
        console.error("Supabase updateCommentSentiment error:", err);
      }
    }

    const index = mockComments.findIndex((c) => c.id === commentId);
    if (index === -1) return null;
    mockComments[index] = {
      ...mockComments[index],
      sentiment: {
        ...(mockComments[index].sentiment || { automatedLabel: "neutral", analysisStatus: "completed" }),
        manualLabel,
        updatedAt: now,
      },
    };
    return mockComments[index];
  },

  // ==========================================
  // Comments Querying
  // ==========================================
  async getComments(options?: {
    workspaceId?: string;
    platform?: Platform;
    socialAccountId?: string;
    sentiment?: SentimentLabel;
    startDate?: string;
    endDate?: string;
    searchQuery?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ comments: SocialComment[]; total: number }> {
    if (supabase) {
      try {
        let query = supabase
          .from("social_comments")
          .select(`
            *,
            sentiment:sentiment_analysis(automated_label, manual_label, confidence, reason, language, updated_at),
            account:social_accounts(id, display_name, handle, platform),
            post:social_posts(id, external_post_id, text_content, post_url)
          `, { count: "exact" })
          .order("published_at", { ascending: false, nullsFirst: false });

        if (options?.platform) query = query.eq("platform", options.platform);
        if (options?.socialAccountId && options.socialAccountId !== "all") query = query.eq("social_account_id", options.socialAccountId);
        if (options?.startDate) query = query.gte("published_at", options.startDate);
        if (options?.endDate) query = query.lte("published_at", options.endDate + "T23:59:59.999Z");
        if (options?.searchQuery) query = query.ilike("comment_text", `%${options.searchQuery}%`);

        const limit = options?.limit || 50;
        const offset = options?.offset || 0;
        query = query.range(offset, offset + limit - 1);

        const { data, count, error } = await query;

        if (!error && data) {
          const mapped: SocialComment[] = data.map((r) => {
            const sent = Array.isArray(r.sentiment) ? r.sentiment[0] : r.sentiment;
            return {
              id: r.id,
              workspaceId: r.workspace_id,
              socialAccountId: r.social_account_id,
              socialPostId: r.social_post_id,
              platform: r.platform,
              externalCommentId: r.external_comment_id,
              parentExternalCommentId: r.parent_external_comment_id,
              commentText: r.comment_text,
              authorName: r.author_name,
              authorProfileUrl: r.author_profile_url,
              commentUrl: r.comment_url,
              publishedAt: r.published_at,
              likeCount: r.like_count,
              replyCount: r.reply_count,
              rawData: r.raw_data,
              firstFetchedAt: r.first_fetched_at,
              lastFetchedAt: r.last_fetched_at,
              sentiment: sent ? {
                automatedLabel: sent.automated_label,
                manualLabel: sent.manual_label,
                confidence: Number(sent.confidence || 0.9),
                reason: sent.reason,
                language: sent.language,
                updatedAt: sent.updated_at,
                analysisStatus: "completed",
              } : analyzeSentimentRuleBased(r.comment_text),
              account: r.account ? {
                id: r.account.id,
                displayName: r.account.display_name,
                handle: r.account.handle,
                platform: r.account.platform,
              } : null,
              post: r.post ? {
                id: r.post.id,
                externalPostId: r.post.external_post_id,
                textContent: r.post.text_content,
                postUrl: r.post.post_url,
              } : null,
            };
          });

          // Filter by sentiment if requested
          let filtered = mapped;
          if (options?.sentiment && (options.sentiment as string) !== "all") {
            filtered = mapped.filter((c) => {
              const activeLabel = c.sentiment?.manualLabel || c.sentiment?.automatedLabel;
              return activeLabel === options.sentiment;
            });
          }

          return { comments: filtered, total: count || filtered.length };
        }
      } catch (err) {
        console.error("Supabase getComments error:", err);
      }
    }

    // In-memory fallback
    const wsId = options?.workspaceId || DEFAULT_WORKSPACE_ID;
    let list = mockComments.filter((c) => c.workspaceId === wsId);
    if (options?.platform && (options.platform as string) !== "all") list = list.filter((c) => c.platform === options.platform);
    if (options?.socialAccountId && options.socialAccountId !== "all") list = list.filter((c) => c.socialAccountId === options.socialAccountId);
    if (options?.sentiment && (options.sentiment as string) !== "all") {
      list = list.filter((c) => (c.sentiment?.manualLabel || c.sentiment?.automatedLabel) === options.sentiment);
    }
    const total = list.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    return { comments: list.slice(offset, offset + limit), total };
  },

  // ==========================================
  // Metrics & Analytics
  // ==========================================
  async getOverviewMetrics(options?: {
    workspaceId?: string;
    platform?: Platform;
    socialAccountId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<OverviewMetrics> {
    const wsId = options?.workspaceId || DEFAULT_WORKSPACE_ID;

    // Fetch comments and posts
    let totalPosts = 0;
    let commentsList: SocialComment[] = [];

    if (supabase) {
      try {
        // Query posts count
        let pQuery = supabase.from("social_posts").select("id", { count: "exact", head: true });
        if (options?.platform && (options.platform as string) !== "all") pQuery = pQuery.eq("platform", options.platform);
        if (options?.socialAccountId && options.socialAccountId !== "all") pQuery = pQuery.eq("social_account_id", options.socialAccountId);
        const { count: pCount } = await pQuery;
        totalPosts = pCount || 0;

        // Query comments
        const { comments, total } = await this.getComments({
          workspaceId: wsId,
          platform: options?.platform,
          socialAccountId: options?.socialAccountId,
          startDate: options?.startDate,
          endDate: options?.endDate,
          limit: 1000,
        });
        commentsList = comments;
      } catch (err) {
        console.error("Supabase getOverviewMetrics error:", err);
      }
    }

    if (commentsList.length === 0 && mockComments.length > 0) {
      commentsList = mockComments;
      totalPosts = mockPosts.length;
    }

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    for (const c of commentsList) {
      const label = c.sentiment?.manualLabel || c.sentiment?.automatedLabel || "neutral";
      if (label === "positive") positiveCount++;
      else if (label === "negative") negativeCount++;
      else neutralCount++;
    }

    const totalComments = commentsList.length;
    const positivePercentage = totalComments > 0 ? Math.round((positiveCount / totalComments) * 100) : 0;
    const negativePercentage = totalComments > 0 ? Math.round((negativeCount / totalComments) * 100) : 0;
    const neutralPercentage = totalComments > 0 ? Math.round((neutralCount / totalComments) * 100) : 0;

    const sentimentDistribution = [
      { name: "Positive", value: positiveCount, color: "#10b981" },
      { name: "Negative", value: negativeCount, color: "#f43f5e" },
      { name: "Neutral", value: neutralCount, color: "#94a3b8" },
    ];

    const platforms: Platform[] = ["instagram", "facebook", "youtube", "linkedin"];
    const commentsByPlatform = platforms.map((p) => {
      const platComments = commentsList.filter((c) => c.platform === p);
      return {
        platform: p,
        count: platComments.length,
        positive: platComments.filter((c) => (c.sentiment?.manualLabel || c.sentiment?.automatedLabel) === "positive").length,
        negative: platComments.filter((c) => (c.sentiment?.manualLabel || c.sentiment?.automatedLabel) === "negative").length,
        neutral: platComments.filter((c) => (c.sentiment?.manualLabel || c.sentiment?.automatedLabel) === "neutral").length,
      };
    });

    const dateMap: Record<string, { comments: number; positive: number; negative: number; neutral: number }> = {};
    for (const c of commentsList) {
      const dateStr = c.publishedAt ? c.publishedAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { comments: 0, positive: 0, negative: 0, neutral: 0 };
      }
      dateMap[dateStr].comments++;
      const label = c.sentiment?.manualLabel || c.sentiment?.automatedLabel;
      if (label === "positive") dateMap[dateStr].positive++;
      else if (label === "negative") dateMap[dateStr].negative++;
      else dateMap[dateStr].neutral++;
    }

    const sortedDates = Object.keys(dateMap).sort();
    const commentsOverTime = sortedDates.map((date) => ({
      date,
      comments: dateMap[date].comments,
      positive: dateMap[date].positive,
      negative: dateMap[date].negative,
      neutral: dateMap[date].neutral,
      total: dateMap[date].comments,
    }));

    const sentimentTrend = commentsOverTime.map((d) => ({
      date: d.date,
      positive: d.positive,
      negative: d.negative,
      neutral: d.neutral,
    }));

    const aiSummary = generateFeedbackSummary(commentsList);
    const recentBatches = await this.getBatches(wsId);

    return {
      totalPosts,
      totalComments,
      positiveComments: positiveCount,
      negativeComments: negativeCount,
      neutralComments: neutralCount,
      positivePercentage,
      negativePercentage,
      neutralPercentage,
      sentimentDistribution,
      commentsByPlatform,
      commentsOverTime,
      sentimentTrend,
      aiSummary,
      recentBatches: recentBatches.slice(0, 5),
    };
  },
};
