export type Platform = 'instagram' | 'facebook' | 'youtube' | 'linkedin';

export type SentimentLabel = 'positive' | 'negative' | 'neutral';

export type BatchStatus = 'queued' | 'running' | 'processing' | 'completed' | 'partially_completed' | 'failed' | 'cancelled';

export type CoverageStatus = 'complete' | 'partial' | 'missing' | 'unknown';

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
}

export interface SocialAccount {
  id: string;
  workspaceId: string;
  platform: Platform;
  displayName: string;
  handle: string;
  profileUrl: string;
  externalAccountId?: string | null;
  actorId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastFetchedAt?: string | null;
  postCount?: number;
  commentCount?: number;
}

export interface SocialPost {
  id: string;
  workspaceId: string;
  socialAccountId: string;
  platform: Platform;
  externalPostId: string;
  postUrl?: string | null;
  textContent?: string | null;
  publishedAt?: string | null;
  mediaType?: string | null;
  rawData?: Record<string, unknown> | null;
  firstFetchedAt: string;
  lastFetchedAt: string;
}

export interface PostWithStats extends SocialPost {
  thumbnailUrl?: string | null;
  account?: {
    id: string;
    displayName: string;
    handle: string;
    platform: Platform;
  } | null;
  stats: {
    totalComments: number;
    positive: number;
    neutral: number;
    negative: number;
    positiveRate: number;
    negativeRate: number;
    neutralRate: number;
    dominantSentiment: "positive" | "negative" | "neutral" | "none";
  };
  comments?: SocialComment[];
  commentsPreview?: {
    id: string;
    commentText: string;
    authorName?: string | null;
    publishedAt?: string | null;
    sentimentLabel: SentimentLabel;
  }[];
}

export interface SentimentData {
  id?: string;
  automatedLabel: SentimentLabel;
  manualLabel?: SentimentLabel | null;
  confidence?: number | null;
  reason?: string | null;
  language?: string | null;
  provider?: string | null;
  modelName?: string | null;
  analysisStatus: 'pending' | 'completed' | 'failed';
  analyzedAt?: string | null;
  updatedAt?: string;
}

export interface SocialComment {
  id: string;
  workspaceId: string;
  socialAccountId: string;
  socialPostId?: string | null;
  platform: Platform;
  externalCommentId: string;
  parentExternalCommentId?: string | null;
  commentText: string;
  authorName?: string | null;
  authorProfileUrl?: string | null;
  commentUrl?: string | null;
  publishedAt?: string | null;
  likeCount?: number | null;
  replyCount?: number | null;
  rawData?: Record<string, unknown> | null;
  firstFetchedAt: string;
  lastFetchedAt: string;
  sentiment?: SentimentData | null;
  post?: {
    id: string;
    externalPostId: string;
    textContent?: string | null;
    postUrl?: string | null;
  } | null;
  account?: {
    id: string;
    displayName: string;
    handle: string;
    platform: Platform;
  } | null;
}

export interface FetchBatch {
  id: string;
  workspaceId: string;
  requestedBy?: string | null;
  startDate: string;
  endDate: string;
  timezone: string;
  status: BatchStatus;
  refreshRequested: boolean;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
  postsFetched?: number;
  commentsFetched?: number;
  accounts?: FetchBatchAccount[];
}

export interface FetchBatchAccount {
  id: string;
  fetchBatchId: string;
  socialAccountId: string;
  status: BatchStatus;
  coverageStatus: CoverageStatus;
  postsCount: number;
  commentsCount: number;
  errorMessage?: string | null;
  socialAccount?: SocialAccount;
  apifyRun?: ApifyRunRecord | null;
}

export interface ApifyRunRecord {
  id: string;
  workspaceId: string;
  fetchBatchAccountId: string;
  platform: Platform;
  actorId: string;
  apifyRunId: string;
  datasetId?: string | null;
  status: string;
  usageInfo?: Record<string, unknown> | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  errorMessage?: string | null;
}

export interface FetchCoverage {
  id: string;
  workspaceId: string;
  socialAccountId: string;
  platform: Platform;
  startDate: string;
  endDate: string;
  coverageStatus: CoverageStatus;
  actorId?: string | null;
  lastFetchBatchId?: string | null;
  completedAt?: string | null;
  postsCount: number;
  commentsCount: number;
  configurationVersion?: string | null;
}

export interface FetchPlanPreview {
  startDate: string;
  endDate: string;
  timezone: string;
  accounts: {
    socialAccount: SocialAccount;
    coverageStatus: CoverageStatus;
    cachedCoverage?: FetchCoverage | null;
    needsExtraction: boolean;
    reason: string;
  }[];
  totalAccounts: number;
  cachedAccountsCount: number;
  extractionNeededCount: number;
  estimatedActorRuns: number;
  warnings: string[];
}

export interface OverviewMetrics {
  totalPosts: number;
  totalComments: number;
  positiveComments: number;
  negativeComments: number;
  neutralComments: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  sentimentDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
  commentsByPlatform: {
    platform: Platform;
    count: number;
    positive: number;
    negative: number;
    neutral: number;
  }[];
  commentsOverTime: {
    date: string;
    comments: number;
    positive: number;
    negative: number;
    neutral: number;
  }[];
  sentimentTrend: {
    date: string;
    positive: number;
    negative: number;
    neutral: number;
  }[];
  aiSummary: {
    positiveThemes: string[];
    negativeThemes: string[];
    neutralObservations: string[];
    frequentTopics: string[];
    commonComplaints: string[];
    improvementSuggestions: string[];
  };
  recentBatches: FetchBatch[];
}
