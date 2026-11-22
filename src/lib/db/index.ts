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

// Default Workspace
const DEFAULT_WORKSPACE_ID = "ws-default-101";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Realistic Seed Accounts for Initial Workspace
let mockAccounts: SocialAccount[] = [
  {
    id: "acc-ig-1",
    workspaceId: DEFAULT_WORKSPACE_ID,
    platform: "instagram",
    displayName: "TechCorp Global",
    handle: "@techcorp_global",
    profileUrl: "https://www.instagram.com/techcorp_global",
    isActive: true,
    actorId: "apify/instagram-scraper",
    createdAt: "2026-10-01T08:00:00Z",
    updatedAt: "2026-11-20T10:00:00Z",
    lastFetchedAt: "2026-11-20T14:30:00Z",
    postCount: 14,
    commentCount: 48,
  },
  {
    id: "acc-yt-2",
    workspaceId: DEFAULT_WORKSPACE_ID,
    platform: "youtube",
    displayName: "TechCorp Labs & Demos",
    handle: "@TechCorpLabs",
    profileUrl: "https://www.youtube.com/@TechCorpLabs",
    isActive: true,
    actorId: "streamers/youtube-scraper",
    createdAt: "2026-10-01T08:00:00Z",
    updatedAt: "2026-11-19T09:00:00Z",
    lastFetchedAt: "2026-11-19T11:15:00Z",
    postCount: 8,
    commentCount: 36,
  },
  {
    id: "acc-fb-3",
    workspaceId: DEFAULT_WORKSPACE_ID,
    platform: "facebook",
    displayName: "TechCorp Official Page",
    handle: "techcorpofficial",
    profileUrl: "https://www.facebook.com/techcorpofficial",
    isActive: true,
    actorId: "apify/facebook-pages-scraper",
    createdAt: "2026-10-05T08:00:00Z",
    updatedAt: "2026-11-18T10:00:00Z",
    lastFetchedAt: "2026-11-18T16:00:00Z",
    postCount: 6,
    commentCount: 22,
  },
  {
    id: "acc-li-4",
    workspaceId: DEFAULT_WORKSPACE_ID,
    platform: "linkedin",
    displayName: "TechCorp Solutions Inc.",
    handle: "techcorp-solutions",
    profileUrl: "https://www.linkedin.com/company/techcorp-solutions",
    isActive: true,
    actorId: "curious_coder/linkedin-post-search-scraper",
    createdAt: "2026-10-10T08:00:00Z",
    updatedAt: "2026-11-17T10:00:00Z",
    lastFetchedAt: "2026-11-17T12:00:00Z",
    postCount: 5,
    commentCount: 19,
  },
];

let mockPosts: SocialPost[] = [
  {
    id: "post-1",
    workspaceId: DEFAULT_WORKSPACE_ID,
    socialAccountId: "acc-ig-1",
    platform: "instagram",
    externalPostId: "ig_p_101",
    postUrl: "https://www.instagram.com/p/DB101xyz",
    textContent: "Introducing our brand new AI analytics dashboard for digital agencies! Streamline audience insights with 1-click sentiment reporting. #TechLaunch #AI #Analytics",
    publishedAt: "2026-11-15T10:00:00Z",
    mediaType: "image",
    firstFetchedAt: "2026-11-20T14:30:00Z",
    lastFetchedAt: "2026-11-20T14:30:00Z",
  },
  {
    id: "post-2",
    workspaceId: DEFAULT_WORKSPACE_ID,
    socialAccountId: "acc-yt-2",
    platform: "youtube",
    externalPostId: "yt_v_202",
    postUrl: "https://www.youtube.com/watch?v=demo202abc",
    textContent: "Full Walkthrough: How to Monitor Comments & Prevent Duplicate Scraping Costs with Apify and Supabase.",
    publishedAt: "2026-11-16T14:00:00Z",
    mediaType: "video",
    firstFetchedAt: "2026-11-19T11:15:00Z",
    lastFetchedAt: "2026-11-19T11:15:00Z",
  },
  {
    id: "post-3",
    workspaceId: DEFAULT_WORKSPACE_ID,
    socialAccountId: "acc-fb-3",
    platform: "facebook",
    externalPostId: "fb_p_303",
    postUrl: "https://www.facebook.com/techcorpofficial/posts/303",
    textContent: "We are thrilled to announce our Q4 agency summit in Mumbai! Register now to claim early-bird passes.",
    publishedAt: "2026-11-17T09:00:00Z",
    mediaType: "image",
    firstFetchedAt: "2026-11-18T16:00:00Z",
    lastFetchedAt: "2026-11-18T16:00:00Z",
  },
  {
    id: "post-4",
    workspaceId: DEFAULT_WORKSPACE_ID,
    socialAccountId: "acc-li-4",
    platform: "linkedin",
    externalPostId: "li_p_404",
    postUrl: "https://www.linkedin.com/feed/update/urn:li:activity:404",
    textContent: "Scaling marketing intelligence while keeping API infrastructure costs minimal: A deep dive into smart caching.",
    publishedAt: "2026-11-17T11:00:00Z",
    mediaType: "article",
    firstFetchedAt: "2026-11-17T12:00:00Z",
    lastFetchedAt: "2026-11-17T12:00:00Z",
  },
];

let mockComments: SocialComment[] = [
  {
    id: "comm-1",
    workspaceId: DEFAULT_WORKSPACE_ID,
    socialAccountId: "acc-ig-1",
    socialPostId: "post-1",
    platform: "instagram",
    externalCommentId: "ig_c_01",
    commentText: "This looks super clean! Bahut badiya interface hai ❤️ loved the sentiment graphs!",
    authorName: "priya_designs",
    authorProfileUrl: "https://www.instagram.com/priya_designs",
    commentUrl: "https://www.instagram.com/p/DB101xyz/c/01",
    publishedAt: "2026-11-15T11:20:00Z",
    likeCount: 14,
    replyCount: 1,
    firstFetchedAt: "2026-11-20T14:30:00Z",
    lastFetchedAt: "2026-11-20T14:30:00Z",
    sentiment: {
      automatedLabel: "positive",
      confidence: 0.95,
      reason: "High praise with Hinglish appreciation (Bahut badiya) and heart emoji",
      language: "hi-en",
      provider: "sentiment-engine-v1",
      modelName: "lexical-context-hybrid",
      analysisStatus: "completed",
      analyzedAt: "2026-11-20T14:30:05Z",
    },
  },
  {
    id: "comm-2",
    workspaceId: DEFAULT_WORKSPACE_ID,
    socialAccountId: "acc-ig-1",
    socialPostId: "post-1",
    platform: "instagram",
    externalCommentId: "ig_c_02",
    commentText: "Pricing model is too high for smaller marketing agencies, please add an affordable tier.",
    authorName: "rahul_agency",
    authorProfileUrl: "https://www.instagram.com/rahul_agency",
    commentUrl: "https://www.instagram.com/p/DB101xyz/c/02",
    publishedAt: "2026-11-15T12:45:00Z",
    likeCount: 8,
    replyCount: 2,
    firstFetchedAt: "2026-11-20T14:30:00Z",
    lastFetchedAt: "2026-11-20T14:30:00Z",
    sentiment: {
      automatedLabel: "negative",
      confidence: 0.88,
      reason: "Pricing dissatisfaction expressed",
      language: "en",
      provider: "sentiment-engine-v1",
      modelName: "lexical-context-hybrid",
      analysisStatus: "completed",
      analyzedAt: "2026-11-20T14:30:05Z",
    },
  },
  {
    id: "comm-3",
    workspaceId: DEFAULT_WORKSPACE_ID,
    socialAccountId: "acc-ig-1",
    socialPostId: "post-1",
    platform: "instagram",
    externalCommentId: "ig_c_03",
    commentText: "Does this support exports to Google Sheets or Excel directly?",
    authorName: "growth_marketer",
    authorProfileUrl: "https://www.instagram.com/growth_marketer",
    commentUrl: "https://www.instagram.com/p/DB101xyz/c/03",
    publishedAt: "2026-11-15T13:10:00Z",
    likeCount: 3,
    replyCount: 0,
    firstFetchedAt: "2026-11-20T14:30:00Z",
    lastFetchedAt: "2026-11-20T14:30:00Z",
    sentiment: {
      automatedLabel: "neutral",
      confidence: 0.90,
      reason: "Product functionality inquiry",
      language: "en",
      provider: "sentiment-engine-v1",
      modelName: "lexical-context-hybrid",
      analysisStatus: "completed",
      analyzedAt: "2026-11-20T14:30:05Z",
    },
  },
  {
    id: "comm-4",
    workspaceId: DEFAULT_WORKSPACE_ID,
    socialAccountId: "acc-yt-2",
    socialPostId: "post-2",
    platform: "youtube",
    externalCommentId: "yt_c_04",
    commentText: "Outstanding tutorial! The duplicate prevention explanation saved our agency thousands in scraping fees. 👏🔥",
    authorName: "Devin K.",
    authorProfileUrl: "https://www.youtube.com/@devin_tech",
    commentUrl: "https://www.youtube.com/watch?v=demo202abc&lc=yt_c_04",
    publishedAt: "2026-11-16T16:00:00Z",
    likeCount: 29,
    replyCount: 1,
    firstFetchedAt: "2026-11-19T11:15:00Z",
    lastFetchedAt: "2026-11-19T11:15:00Z",
    sentiment: {
      automatedLabel: "positive",
      confidence: 0.98,
      reason: "Enthusiastic praise with clapping and fire emojis",
      language: "en",
      provider: "sentiment-engine-v1",
      modelName: "lexical-context-hybrid",
      analysisStatus: "completed",
      analyzedAt: "2026-11-19T11:15:04Z",
    },
  },
  {
    id: "comm-5",
    workspaceId: DEFAULT_WORKSPACE_ID,
    socialAccountId: "acc-yt-2",
    socialPostId: "post-2",
    platform: "youtube",
    externalCommentId: "yt_c_05",
    commentText: "Audio quality gets slightly muffled around the 4:15 mark, please fix in future uploads.",
    authorName: "AudioFan99",
    authorProfileUrl: "https://www.youtube.com/@audiofan",
    commentUrl: "https://www.youtube.com/watch?v=demo202abc&lc=yt_c_05",
    publishedAt: "2026-11-16T18:30:00Z",
    likeCount: 4,
    replyCount: 0,
    firstFetchedAt: "2026-11-19T11:15:00Z",
    lastFetchedAt: "2026-11-19T11:15:00Z",
    sentiment: {
      automatedLabel: "negative",
      confidence: 0.79,
      reason: "Constructive negative feedback on audio quality",
      language: "en",
      provider: "sentiment-engine-v1",
      modelName: "lexical-context-hybrid",
      analysisStatus: "completed",
      analyzedAt: "2026-11-19T11:15:04Z",
    },
  },
  {
    id: "comm-6",
    workspaceId: DEFAULT_WORKSPACE_ID,
    socialAccountId: "acc-fb-3",
    socialPostId: "post-3",
    platform: "facebook",
    externalCommentId: "fb_c_06",
    commentText: "Will the summit sessions be streamed online for participants outside Mumbai?",
    authorName: "Sanjay Verma",
    authorProfileUrl: "https://www.facebook.com/sanjay.verma",
    publishedAt: "2026-11-17T10:15:00Z",
    likeCount: 2,
    replyCount: 1,
    firstFetchedAt: "2026-11-18T16:00:00Z",
    lastFetchedAt: "2026-11-18T16:00:00Z",
    sentiment: {
      automatedLabel: "neutral",
      confidence: 0.92,
      reason: "General event inquiry",
      language: "en",
      provider: "sentiment-engine-v1",
      modelName: "lexical-context-hybrid",
      analysisStatus: "completed",
      analyzedAt: "2026-11-18T16:00:04Z",
    },
  },
  {
    id: "comm-7",
    workspaceId: DEFAULT_WORKSPACE_ID,
    socialAccountId: "acc-li-4",
    socialPostId: "post-4",
    platform: "linkedin",
    externalCommentId: "li_c_07",
    commentText: "Insightful breakdown on API rate limits and data retention strategy. Great leadership!",
    authorName: "Ananya Roy",
    authorProfileUrl: "https://www.linkedin.com/in/ananya-roy-lead",
    publishedAt: "2026-11-17T13:40:00Z",
    likeCount: 11,
    replyCount: 0,
    firstFetchedAt: "2026-11-17T12:00:00Z",
    lastFetchedAt: "2026-11-17T12:00:00Z",
    sentiment: {
      automatedLabel: "positive",
      confidence: 0.96,
      reason: "Professional endorsement and praise",
      language: "en",
      provider: "sentiment-engine-v1",
      modelName: "lexical-context-hybrid",
      analysisStatus: "completed",
      analyzedAt: "2026-11-17T12:00:05Z",
    },
  },
];

let mockCoverages: FetchCoverage[] = [
  {
    id: "cov-1",
    workspaceId: DEFAULT_WORKSPACE_ID,
    socialAccountId: "acc-ig-1",
    platform: "instagram",
    startDate: "2026-11-10",
    endDate: "2026-11-18",
    coverageStatus: "complete",
    actorId: "apify/instagram-scraper",
    completedAt: "2026-11-20T14:30:00Z",
    postsCount: 14,
    commentsCount: 48,
    configurationVersion: "v1.0",
  },
  {
    id: "cov-2",
    workspaceId: DEFAULT_WORKSPACE_ID,
    socialAccountId: "acc-yt-2",
    platform: "youtube",
    startDate: "2026-11-10",
    endDate: "2026-11-18",
    coverageStatus: "complete",
    actorId: "streamers/youtube-scraper",
    completedAt: "2026-11-19T11:15:00Z",
    postsCount: 8,
    commentsCount: 36,
    configurationVersion: "v1.0",
  },
];

let mockBatches: FetchBatch[] = [
  {
    id: "batch-101",
    workspaceId: DEFAULT_WORKSPACE_ID,
    startDate: "2026-11-10",
    endDate: "2026-11-18",
    timezone: "Asia/Kolkata",
    status: "completed",
    refreshRequested: false,
    createdAt: "2026-11-20T14:28:00Z",
    startedAt: "2026-11-20T14:28:10Z",
    completedAt: "2026-11-20T14:30:00Z",
    postsFetched: 14,
    commentsFetched: 48,
    accounts: [
      {
        id: "ba-1",
        fetchBatchId: "batch-101",
        socialAccountId: "acc-ig-1",
        status: "completed",
        coverageStatus: "complete",
        postsCount: 14,
        commentsCount: 48,
        apifyRun: {
          id: "run-1",
          workspaceId: DEFAULT_WORKSPACE_ID,
          fetchBatchAccountId: "ba-1",
          platform: "instagram",
          actorId: "apify/instagram-scraper",
          apifyRunId: "apify_run_ig_99812",
          datasetId: "apify_ds_ig_99812",
          status: "SUCCEEDED",
          startedAt: "2026-11-20T14:28:15Z",
          finishedAt: "2026-11-20T14:29:55Z",
        },
      },
    ],
  },
];

export const db = {
  getDefaultWorkspaceId: () => DEFAULT_WORKSPACE_ID,

  async getAccounts(workspaceId: string = DEFAULT_WORKSPACE_ID): Promise<SocialAccount[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from("social_accounts").select("*");
        if (!error && data && data.length > 0) {
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
        // Fall back to seed accounts
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
            workspace_id: accountData.workspaceId,
            platform: accountData.platform,
            display_name: accountData.displayName,
            handle: accountData.handle,
            profile_url: accountData.profileUrl,
            external_account_id: accountData.externalAccountId,
            actor_id: accountData.actorId,
            is_active: accountData.isActive,
          })
          .select()
          .single();

        if (!error && data) {
          const acc: SocialAccount = {
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
          mockAccounts.push(acc);
          return acc;
        }
      } catch (err) {
        // Fall back
      }
    }

    const newAccount: SocialAccount = {
      ...accountData,
      id: `acc-${Date.now()}`,
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
        if (updates.externalAccountId !== undefined) updatePayload.external_account_id = updates.externalAccountId;
        if (updates.actorId !== undefined) updatePayload.actor_id = updates.actorId;
        if (updates.isActive !== undefined) updatePayload.is_active = updates.isActive;

        await supabase.from("social_accounts").update(updatePayload).eq("id", id);
      } catch {}
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
        await supabase.from("social_accounts").delete().eq("id", id);
      } catch {}
    }
    const initialLength = mockAccounts.length;
    mockAccounts = mockAccounts.filter((a) => a.id !== id);
    return mockAccounts.length < initialLength;
  },

  async getCoverages(workspaceId: string = DEFAULT_WORKSPACE_ID): Promise<FetchCoverage[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from("fetch_coverage").select("*");
        if (!error && data && data.length > 0) {
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
      } catch {}
    }
    return [...mockCoverages.filter((c) => c.workspaceId === workspaceId)];
  },

  async recordCoverage(coverage: Omit<FetchCoverage, "id">): Promise<FetchCoverage> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from("fetch_coverage").insert({
          workspace_id: coverage.workspaceId,
          social_account_id: coverage.socialAccountId,
          platform: coverage.platform,
          start_date: coverage.startDate,
          end_date: coverage.endDate,
          coverage_status: coverage.coverageStatus,
          actor_id: coverage.actorId,
          last_fetch_batch_id: coverage.lastFetchBatchId,
          completed_at: new Date().toISOString(),
          posts_count: coverage.postsCount,
          comments_count: coverage.commentsCount,
          configuration_version: coverage.configurationVersion,
        }).select().single();

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
      } catch {}
    }

    const existingIndex = mockCoverages.findIndex(
      (c) =>
        c.socialAccountId === coverage.socialAccountId &&
        c.startDate === coverage.startDate &&
        c.endDate === coverage.endDate
    );

    if (existingIndex >= 0) {
      mockCoverages[existingIndex] = {
        ...mockCoverages[existingIndex],
        ...coverage,
        completedAt: new Date().toISOString(),
      };
      return mockCoverages[existingIndex];
    }

    const newCoverage: FetchCoverage = {
      ...coverage,
      id: `cov-${Date.now()}`,
      completedAt: new Date().toISOString(),
    };
    mockCoverages.push(newCoverage);
    return newCoverage;
  },

  async getBatches(workspaceId: string = DEFAULT_WORKSPACE_ID): Promise<FetchBatch[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from("fetch_batches").select("*").order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
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
          }));
        }
      } catch {}
    }

    return [...mockBatches.filter((b) => b.workspaceId === workspaceId)].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getBatchById(id: string): Promise<FetchBatch | null> {
    const batch = mockBatches.find((b) => b.id === id);
    if (!batch) return null;

    const accounts = await this.getAccounts();
    const enrichedAccounts = batch.accounts?.map((acc) => ({
      ...acc,
      socialAccount: accounts.find((a) => a.id === acc.socialAccountId),
    }));

    return {
      ...batch,
      accounts: enrichedAccounts,
    };
  },

  async createBatch(batchData: Omit<FetchBatch, "id" | "createdAt">): Promise<FetchBatch> {
    const newBatch: FetchBatch = {
      ...batchData,
      id: `batch-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockBatches.unshift(newBatch);
    return newBatch;
  },

  async updateBatch(id: string, updates: Partial<FetchBatch>): Promise<FetchBatch | null> {
    const index = mockBatches.findIndex((b) => b.id === id);
    if (index === -1) return null;
    mockBatches[index] = {
      ...mockBatches[index],
      ...updates,
    };
    return mockBatches[index];
  },

  async upsertPosts(posts: Omit<SocialPost, "id" | "firstFetchedAt" | "lastFetchedAt">[]): Promise<SocialPost[]> {
    const result: SocialPost[] = [];
    const now = new Date().toISOString();

    for (const post of posts) {
      const existingIndex = mockPosts.findIndex(
        (p) =>
          p.socialAccountId === post.socialAccountId &&
          p.platform === post.platform &&
          p.externalPostId === post.externalPostId
      );

      if (existingIndex >= 0) {
        mockPosts[existingIndex] = {
          ...mockPosts[existingIndex],
          ...post,
          lastFetchedAt: now,
        };
        result.push(mockPosts[existingIndex]);
      } else {
        const newPost: SocialPost = {
          ...post,
          id: `post-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          firstFetchedAt: now,
          lastFetchedAt: now,
        };
        mockPosts.push(newPost);
        result.push(newPost);
      }
    }
    return result;
  },

  async upsertComments(
    comments: (Omit<SocialComment, "id" | "firstFetchedAt" | "lastFetchedAt"> & {
      sentiment?: SentimentLabel | null;
    })[]
  ): Promise<SocialComment[]> {
    const result: SocialComment[] = [];
    const now = new Date().toISOString();

    for (const comment of comments) {
      const existingIndex = mockComments.findIndex(
        (c) =>
          c.socialAccountId === comment.socialAccountId &&
          c.platform === comment.platform &&
          c.externalCommentId === comment.externalCommentId
      );

      if (existingIndex >= 0) {
        const currentSentiment = mockComments[existingIndex].sentiment;
        mockComments[existingIndex] = {
          ...mockComments[existingIndex],
          ...comment,
          lastFetchedAt: now,
          sentiment: currentSentiment || (comment.sentiment ? analyzeSentimentRuleBased(comment.commentText) : mockComments[existingIndex].sentiment),
        };
        result.push(mockComments[existingIndex]);
      } else {
        const sentimentResult = analyzeSentimentRuleBased(comment.commentText);
        const newComment: SocialComment = {
          ...comment,
          id: `comm-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          firstFetchedAt: now,
          lastFetchedAt: now,
          sentiment: {
            ...sentimentResult,
            analyzedAt: now,
          },
        };
        mockComments.push(newComment);
        result.push(newComment);
      }
    }
    return result;
  },

  async updateCommentSentiment(commentId: string, manualLabel: SentimentLabel): Promise<SocialComment | null> {
    const index = mockComments.findIndex((c) => c.id === commentId);
    if (index === -1) return null;

    const existingSentiment = mockComments[index].sentiment || {
      automatedLabel: "neutral",
      analysisStatus: "completed",
    };

    mockComments[index] = {
      ...mockComments[index],
      sentiment: {
        ...existingSentiment,
        manualLabel,
        updatedAt: new Date().toISOString(),
      },
    };

    return mockComments[index];
  },

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
    const wsId = options?.workspaceId || DEFAULT_WORKSPACE_ID;
    let list = mockComments.filter((c) => c.workspaceId === wsId);

    if (options?.platform) {
      list = list.filter((c) => c.platform === options.platform);
    }

    if (options?.socialAccountId) {
      list = list.filter((c) => c.socialAccountId === options.socialAccountId);
    }

    if (options?.sentiment) {
      list = list.filter((c) => {
        const activeLabel = c.sentiment?.manualLabel || c.sentiment?.automatedLabel;
        return activeLabel === options.sentiment;
      });
    }

    if (options?.startDate) {
      const s = new Date(options.startDate).getTime();
      list = list.filter((c) => (c.publishedAt ? new Date(c.publishedAt).getTime() >= s : true));
    }

    if (options?.endDate) {
      const e = new Date(options.endDate).getTime();
      list = list.filter((c) => (c.publishedAt ? new Date(c.publishedAt).getTime() <= e : true));
    }

    if (options?.searchQuery) {
      const q = options.searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.commentText.toLowerCase().includes(q) ||
          (c.authorName && c.authorName.toLowerCase().includes(q))
      );
    }

    const total = list.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;

    const accounts = await this.getAccounts();
    const enriched = list.slice(offset, offset + limit).map((c) => {
      const account = accounts.find((a) => a.id === c.socialAccountId);
      const post = mockPosts.find((p) => p.id === c.socialPostId);
      return {
        ...c,
        account: account
          ? {
              id: account.id,
              displayName: account.displayName,
              handle: account.handle,
              platform: account.platform,
            }
          : null,
        post: post
          ? {
              id: post.id,
              externalPostId: post.externalPostId,
              textContent: post.textContent,
              postUrl: post.postUrl,
            }
          : null,
      };
    });

    return { comments: enriched, total };
  },

  async getOverviewMetrics(options?: {
    workspaceId?: string;
    platform?: Platform;
    socialAccountId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<OverviewMetrics> {
    const wsId = options?.workspaceId || DEFAULT_WORKSPACE_ID;
    const { comments } = await this.getComments({
      workspaceId: wsId,
      platform: options?.platform,
      socialAccountId: options?.socialAccountId,
      startDate: options?.startDate,
      endDate: options?.endDate,
      limit: 1000,
    });

    const posts = mockPosts.filter((p) => {
      if (p.workspaceId !== wsId) return false;
      if (options?.platform && p.platform !== options.platform) return false;
      if (options?.socialAccountId && p.socialAccountId !== options.socialAccountId) return false;
      return true;
    });

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    for (const c of comments) {
      const label = c.sentiment?.manualLabel || c.sentiment?.automatedLabel || "neutral";
      if (label === "positive") positiveCount++;
      else if (label === "negative") negativeCount++;
      else neutralCount++;
    }

    const totalComments = comments.length;
    const totalPosts = posts.length;

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
      const platComments = comments.filter((c) => c.platform === p);
      return {
        platform: p,
        count: platComments.length,
        positive: platComments.filter((c) => (c.sentiment?.manualLabel || c.sentiment?.automatedLabel) === "positive").length,
        negative: platComments.filter((c) => (c.sentiment?.manualLabel || c.sentiment?.automatedLabel) === "negative").length,
        neutral: platComments.filter((c) => (c.sentiment?.manualLabel || c.sentiment?.automatedLabel) === "neutral").length,
      };
    });

    const dateMap: Record<string, { comments: number; positive: number; negative: number; neutral: number }> = {};
    for (const c of comments) {
      const dateStr = c.publishedAt ? c.publishedAt.slice(0, 10) : "2026-11-15";
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
    }));

    const sentimentTrend = commentsOverTime.map((d) => ({
      date: d.date,
      positive: d.positive,
      negative: d.negative,
      neutral: d.neutral,
    }));

    const aiSummary = generateFeedbackSummary(comments);
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
