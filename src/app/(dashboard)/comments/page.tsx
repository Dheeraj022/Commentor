"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  MessageSquare,
  Sparkles,
  LayoutGrid,
  List,
  Smile,
  Frown,
  Minus,
  X,
  Heart,
  Share2,
} from "lucide-react";
import {
  SocialComment,
  Platform,
  SentimentLabel,
  SocialAccount,
  PostWithStats,
} from "@/types";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import { SentimentBadge } from "@/components/ui/SentimentBadge";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils";

export default function AllCommentsPage() {
  const [viewMode, setViewMode] = useState<"posts" | "table">("posts");

  // Posts State
  const [posts, setPosts] = useState<PostWithStats[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsPage, setPostsPage] = useState(1);
  const [postsLimit] = useState(12);

  // Comments Table State
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsLimit] = useState(15);

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Post Detail Slide-over / Modal
  const [selectedPost, setSelectedPost] = useState<PostWithStats | null>(null);
  const [postCommentFilter, setPostCommentFilter] = useState<string>("all");
  const [postCommentSearch, setPostCommentSearch] = useState<string>("");

  // Single Comment Detail Modal
  const [selectedComment, setSelectedComment] = useState<SocialComment | null>(null);

  // Fetch Accounts
  useEffect(() => {
    fetch("/api/accounts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAccounts(data.accounts);
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch Posts with Stats & Comments
  const fetchPosts = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set("page", postsPage.toString());
      query.set("limit", postsLimit.toString());
      if (searchQuery.trim()) query.set("searchQuery", searchQuery.trim());
      if (selectedPlatform !== "all") query.set("platform", selectedPlatform);
      if (selectedAccountId !== "all") query.set("socialAccountId", selectedAccountId);
      if (selectedSentiment !== "all") query.set("sentiment", selectedSentiment);
      if (startDate) query.set("startDate", startDate);
      if (endDate) query.set("endDate", endDate);

      const res = await fetch(`/api/posts?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
        setPostsTotal(data.pagination.total);

        // Update selectedPost if it's currently open
        if (selectedPost) {
          const updated = data.posts.find((p: PostWithStats) => p.id === selectedPost.id);
          if (updated) setSelectedPost(updated);
        }
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch Flat Comments (for Table View)
  const fetchComments = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set("page", commentsPage.toString());
      query.set("limit", commentsLimit.toString());
      if (searchQuery.trim()) query.set("searchQuery", searchQuery.trim());
      if (selectedPlatform !== "all") query.set("platform", selectedPlatform);
      if (selectedAccountId !== "all") query.set("socialAccountId", selectedAccountId);
      if (selectedSentiment !== "all") query.set("sentiment", selectedSentiment);
      if (startDate) query.set("startDate", startDate);
      if (endDate) query.set("endDate", endDate);

      const res = await fetch(`/api/comments?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments);
        setCommentsTotal(data.pagination.total);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Load active view data
  useEffect(() => {
    if (viewMode === "posts") {
      fetchPosts();
    } else {
      fetchComments();
    }
  }, [
    viewMode,
    postsPage,
    commentsPage,
    selectedPlatform,
    selectedAccountId,
    selectedSentiment,
    startDate,
    endDate,
  ]);

  // Real-time live sync polling every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (viewMode === "posts") {
        fetchPosts(true);
      } else {
        fetchComments(true);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [
    viewMode,
    postsPage,
    commentsPage,
    searchQuery,
    selectedPlatform,
    selectedAccountId,
    selectedSentiment,
    startDate,
    endDate,
    selectedPost?.id,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewMode === "posts") {
      setPostsPage(1);
      fetchPosts();
    } else {
      setCommentsPage(1);
      fetchComments();
    }
  };

  const handleUpdateSentiment = async (commentId: string, newSentiment: SentimentLabel) => {
    try {
      const res = await fetch(`/api/comments/${commentId}/sentiment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentiment: newSentiment }),
      });
      const data = await res.json();
      if (data.success) {
        // Update comments table
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, sentiment: data.comment.sentiment } : c))
        );

        // Update in selectedPost if open
        if (selectedPost && selectedPost.comments) {
          const updatedComments = selectedPost.comments.map((c) =>
            c.id === commentId ? { ...c, sentiment: data.comment.sentiment } : c
          );
          let pos = 0, neg = 0, neu = 0;
          for (const c of updatedComments) {
            const label = c.sentiment?.manualLabel || c.sentiment?.automatedLabel || "neutral";
            if (label === "positive") pos++;
            else if (label === "negative") neg++;
            else neu++;
          }
          const total = updatedComments.length;
          setSelectedPost({
            ...selectedPost,
            comments: updatedComments,
            stats: {
              ...selectedPost.stats,
              positive: pos,
              neutral: neu,
              negative: neg,
              positiveRate: total > 0 ? Math.round((pos / total) * 100) : 0,
              negativeRate: total > 0 ? Math.round((neg / total) * 100) : 0,
              neutralRate: total > 0 ? Math.round((neu / total) * 100) : 0,
            },
          });
        }

        // Silent re-fetch posts
        fetchPosts(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCsv = () => {
    const query = new URLSearchParams();
    if (searchQuery.trim()) query.set("searchQuery", searchQuery.trim());
    if (selectedPlatform !== "all") query.set("platform", selectedPlatform);
    if (selectedAccountId !== "all") query.set("socialAccountId", selectedAccountId);
    if (selectedSentiment !== "all") query.set("sentiment", selectedSentiment);
    if (startDate) query.set("startDate", startDate);
    if (endDate) query.set("endDate", endDate);

    window.open(`/api/export/comments?${query.toString()}`, "_blank");
  };

  const totalPages =
    viewMode === "posts"
      ? Math.ceil(postsTotal / postsLimit) || 1
      : Math.ceil(commentsTotal / commentsLimit) || 1;

  // Filtered comments inside the selected post drawer
  const drawerComments = (selectedPost?.comments || []).filter((c) => {
    const activeLabel = c.sentiment?.manualLabel || c.sentiment?.automatedLabel || "neutral";
    if (postCommentFilter !== "all" && activeLabel !== postCommentFilter) {
      return false;
    }
    if (postCommentSearch.trim()) {
      const q = postCommentSearch.toLowerCase();
      const matchText = c.commentText.toLowerCase().includes(q);
      const matchAuthor = c.authorName && c.authorName.toLowerCase().includes(q);
      if (!matchText && !matchAuthor) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Posts & Audience Comments
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Browse social media posts, analyze sentiment banners, and inspect user comments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("posts")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "posts"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Post Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Comments Table
            </button>
          </div>

          {/* Live Sync Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Sync Active</span>
          </div>

          <button
            onClick={() => (viewMode === "posts" ? fetchPosts(false) : fetchComments(false))}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={
                viewMode === "posts"
                  ? "Search post caption, keywords, hashtags..."
                  : "Search comment text or author username..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Platform */}
          <select
            value={selectedPlatform}
            onChange={(e) => {
              setSelectedPlatform(e.target.value);
              setPostsPage(1);
              setCommentsPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="facebook">Facebook</option>
            <option value="linkedin">LinkedIn</option>
          </select>

          {/* Account */}
          <select
            value={selectedAccountId}
            onChange={(e) => {
              setSelectedAccountId(e.target.value);
              setPostsPage(1);
              setCommentsPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
          >
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.displayName} ({a.handle})
              </option>
            ))}
          </select>

          {/* Sentiment */}
          <select
            value={selectedSentiment}
            onChange={(e) => {
              setSelectedSentiment(e.target.value);
              setPostsPage(1);
              setCommentsPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Has Positive Feedback</option>
            <option value="negative">Has Negative Complaints</option>
            <option value="neutral">Has Neutral Queries</option>
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-slate-400 text-[11px]">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPostsPage(1);
                setCommentsPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-xs"
            />
            <span className="text-slate-400 text-[11px]">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPostsPage(1);
                setCommentsPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-xs"
            />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW MODE 1: POST CARDS WITH SENTIMENT BANNERS (DEFAULT)   */}
      {/* ========================================================= */}
      {viewMode === "posts" && (
        <div className="space-y-6">
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((post) => {
                const totalComm = post.stats.totalComments;
                const posRate = post.stats.positiveRate;
                const neuRate = post.stats.neutralRate;
                const negRate = post.stats.negativeRate;

                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden group hover:border-blue-400"
                  >
                    <div>
                      {/* 1. TOP SENTIMENT BANNER */}
                      <div className="bg-slate-50 border-b border-slate-100 p-3">
                        {totalComm > 0 ? (
                          <div className="space-y-1.5">
                            {/* Visual Progress Bar Banner */}
                            <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200">
                              {posRate > 0 && (
                                <div
                                  className="bg-emerald-500 h-full"
                                  style={{ width: `${posRate}%` }}
                                  title={`Positive: ${posRate}%`}
                                />
                              )}
                              {neuRate > 0 && (
                                <div
                                  className="bg-slate-400 h-full"
                                  style={{ width: `${neuRate}%` }}
                                  title={`Neutral: ${neuRate}%`}
                                />
                              )}
                              {negRate > 0 && (
                                <div
                                  className="bg-rose-500 h-full"
                                  style={{ width: `${negRate}%` }}
                                  title={`Negative: ${negRate}%`}
                                />
                              )}
                            </div>

                            {/* Sentiment Breakdown Badges */}
                            <div className="flex items-center justify-between text-[11px] font-semibold">
                              <span className="text-emerald-700 flex items-center gap-1">
                                <Smile className="w-3.5 h-3.5 text-emerald-600" />
                                {post.stats.positive} Pos ({posRate}%)
                              </span>
                              <span className="text-slate-600 flex items-center gap-1">
                                <Minus className="w-3.5 h-3.5 text-slate-500" />
                                {post.stats.neutral} Neu
                              </span>
                              <span className="text-rose-700 flex items-center gap-1">
                                <Frown className="w-3.5 h-3.5 text-rose-600" />
                                {post.stats.negative} Neg ({negRate}%)
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[11px] text-slate-400 py-0.5">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5" /> No comments extracted
                            </span>
                            <span className="text-[10px] bg-slate-200/60 px-2 py-0.5 rounded-full font-medium text-slate-500">
                              0 Comments
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 2. POST HEADER & METADATA */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <PlatformBadge platform={post.platform} />
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">
                              {formatDate(post.publishedAt)}
                            </span>
                            {post.postUrl && (
                              <a
                                href={post.postUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-slate-400 hover:text-blue-600"
                                title="Open original post"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Account Name */}
                        <div className="text-xs">
                          <span className="font-semibold text-slate-900">
                            {post.account?.displayName || "Social Account"}
                          </span>
                          <span className="text-slate-400 text-[11px] ml-1.5 font-mono">
                            {post.account?.handle}
                          </span>
                        </div>

                        {/* Thumbnail Image (if available) */}
                        {post.thumbnailUrl && (
                          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                            <img
                              src={post.thumbnailUrl}
                              alt="Post Media"
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}

                        {/* Caption Text */}
                        <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                          {post.textContent || (
                            <span className="italic text-slate-400">No caption text provided</span>
                          )}
                        </p>

                        {/* Quick preview of top comments */}
                        {post.commentsPreview && post.commentsPreview.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              Recent Comments Preview:
                            </span>
                            {post.commentsPreview.slice(0, 2).map((cp) => (
                              <div
                                key={cp.id}
                                className="text-[11px] text-slate-600 truncate bg-slate-50 p-1.5 rounded-md flex items-center gap-1.5"
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    cp.sentimentLabel === "positive"
                                      ? "bg-emerald-500"
                                      : cp.sentimentLabel === "negative"
                                      ? "bg-rose-500"
                                      : "bg-slate-400"
                                  }`}
                                />
                                <span className="font-semibold text-slate-700 shrink-0">
                                  {cp.authorName || "User"}:
                                </span>
                                <span className="truncate">{cp.commentText}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. CARD ACTION FOOTER */}
                    <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-600 flex items-center gap-1 font-semibold">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        {totalComm} {totalComm === 1 ? "Comment" : "Comments"}
                      </span>
                      <button
                        type="button"
                        className="font-semibold text-blue-600 group-hover:text-blue-700 flex items-center gap-1"
                      >
                        Click to view comments →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No posts match your filters</h3>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your platform, account, or date range selections above.
              </p>
            </div>
          )}

          {/* Posts Pagination */}
          {postsTotal > 0 && (
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-500 shadow-2xs">
              <div>
                Showing <span className="font-semibold text-slate-800">{posts.length}</span> of{" "}
                <span className="font-semibold text-slate-800">{postsTotal}</span> tracked posts
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
                  disabled={postsPage <= 1}
                  className="p-1.5 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 text-slate-700 font-medium">
                  Page {postsPage} of {totalPages}
                </span>
                <button
                  onClick={() => setPostsPage((p) => Math.min(totalPages, p + 1))}
                  disabled={postsPage >= totalPages}
                  className="p-1.5 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW MODE 2: FLAT ALL COMMENTS TABLE (ACCESSIBLE VIA TAB) */}
      {/* ========================================================= */}
      {viewMode === "table" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4 min-w-[280px]">Comment Text</th>
                  <th className="py-3 px-4">Sentiment</th>
                  <th className="py-3 px-4">Likes</th>
                  <th className="py-3 px-4">Published</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comments.length > 0 ? (
                  comments.map((c) => {
                    const activeSentiment = c.sentiment?.manualLabel || c.sentiment?.automatedLabel || "neutral";
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <PlatformBadge platform={c.platform} />
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {c.authorProfileUrl ? (
                            <a
                              href={c.authorProfileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline flex items-center gap-1 text-slate-900"
                            >
                              {c.authorName || "Anonymous"}
                              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                            </a>
                          ) : (
                            c.authorName || "Anonymous"
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700 leading-relaxed">
                          <p className="line-clamp-2">{c.commentText}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <SentimentBadge
                              sentiment={activeSentiment}
                              confidence={c.sentiment?.confidence}
                              isManual={Boolean(c.sentiment?.manualLabel)}
                            />
                            <select
                              value={activeSentiment}
                              onChange={(e) => handleUpdateSentiment(c.id, e.target.value as SentimentLabel)}
                              className="text-[10px] bg-slate-100 border-none rounded px-1.5 py-0.5 text-slate-600 cursor-pointer hover:bg-slate-200"
                              title="Override sentiment manually"
                            >
                              <option value="positive">Set Positive</option>
                              <option value="negative">Set Negative</option>
                              <option value="neutral">Set Neutral</option>
                            </select>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {formatNumber(c.likeCount)}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {formatDate(c.publishedAt)}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedComment(c)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {c.post?.postUrl && (
                            <a
                              href={c.post.postUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 inline-block"
                              title="Open original post"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No comments match your search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{comments.length}</span> of{" "}
              <span className="font-semibold text-slate-800">{commentsTotal}</span> comments
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCommentsPage((p) => Math.max(1, p - 1))}
                disabled={commentsPage <= 1}
                className="p-1.5 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-slate-700 font-medium">
                Page {commentsPage} of {totalPages}
              </span>
              <button
                onClick={() => setCommentsPage((p) => Math.min(totalPages, p + 1))}
                disabled={commentsPage >= totalPages}
                className="p-1.5 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SLIDE-OVER DRAWER: POST DETAILS & ALL COMMENTS FOR POST   */}
      {/* ========================================================= */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Top Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <PlatformBadge platform={selectedPost.platform} />
                <span className="text-xs font-semibold text-slate-900">
                  {selectedPost.account?.displayName || "Post Feedback"}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {selectedPost.account?.handle}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedPost(null);
                  setPostCommentFilter("all");
                  setPostCommentSearch("");
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              {/* Post Details Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                {selectedPost.thumbnailUrl && (
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-100 max-h-56">
                    <img
                      src={selectedPost.thumbnailUrl}
                      alt="Post Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Published: {formatDateTime(selectedPost.publishedAt)}</span>
                  {selectedPost.postUrl && (
                    <a
                      href={selectedPost.postUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      View on {selectedPost.platform} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedPost.textContent || "No caption available for this post."}
                </p>
              </div>

              {/* POST SENTIMENT BANNER & BREAKDOWN */}
              <div className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Audience Sentiment Analysis
                  </h3>
                  <span className="text-xs font-bold font-mono text-slate-700">
                    {selectedPost.stats.totalComments} Total Comments
                  </span>
                </div>

                {/* Sentiment Ratio Bar */}
                {selectedPost.stats.totalComments > 0 && (
                  <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-200">
                    {selectedPost.stats.positiveRate > 0 && (
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${selectedPost.stats.positiveRate}%` }}
                      />
                    )}
                    {selectedPost.stats.neutralRate > 0 && (
                      <div
                        className="bg-slate-400 h-full"
                        style={{ width: `${selectedPost.stats.neutralRate}%` }}
                      />
                    )}
                    {selectedPost.stats.negativeRate > 0 && (
                      <div
                        className="bg-rose-500 h-full"
                        style={{ width: `${selectedPost.stats.negativeRate}%` }}
                      />
                    )}
                  </div>
                )}

                {/* Sentiment Cards */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800">
                    <div className="text-base font-bold">{selectedPost.stats.positive}</div>
                    <div className="text-[10px] text-emerald-600 font-medium">
                      Positive ({selectedPost.stats.positiveRate}%)
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                    <div className="text-base font-bold">{selectedPost.stats.neutral}</div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Neutral ({selectedPost.stats.neutralRate}%)
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-800">
                    <div className="text-base font-bold">{selectedPost.stats.negative}</div>
                    <div className="text-[10px] text-rose-600 font-medium">
                      Negative ({selectedPost.stats.negativeRate}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* COMMENTS FILTER FOR THIS POST */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Comments List ({drawerComments.length})
                  </h4>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                    <button
                      onClick={() => setPostCommentFilter("all")}
                      className={`px-2 py-0.5 rounded-md font-medium ${
                        postCommentFilter === "all"
                          ? "bg-white text-slate-900 shadow-2xs font-bold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      All ({selectedPost.comments?.length || 0})
                    </button>
                    <button
                      onClick={() => setPostCommentFilter("positive")}
                      className={`px-2 py-0.5 rounded-md font-medium ${
                        postCommentFilter === "positive"
                          ? "bg-emerald-500 text-white font-bold"
                          : "text-emerald-700 hover:bg-emerald-100/50"
                      }`}
                    >
                      Pos ({selectedPost.stats.positive})
                    </button>
                    <button
                      onClick={() => setPostCommentFilter("neutral")}
                      className={`px-2 py-0.5 rounded-md font-medium ${
                        postCommentFilter === "neutral"
                          ? "bg-slate-600 text-white font-bold"
                          : "text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Neu ({selectedPost.stats.neutral})
                    </button>
                    <button
                      onClick={() => setPostCommentFilter("negative")}
                      className={`px-2 py-0.5 rounded-md font-medium ${
                        postCommentFilter === "negative"
                          ? "bg-rose-500 text-white font-bold"
                          : "text-rose-700 hover:bg-rose-100/50"
                      }`}
                    >
                      Neg ({selectedPost.stats.negative})
                    </button>
                  </div>
                </div>

                {/* Search within this post */}
                <input
                  type="text"
                  placeholder="Filter comments on this post..."
                  value={postCommentSearch}
                  onChange={(e) => setPostCommentSearch(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />

                {/* Comments Stream */}
                <div className="space-y-2.5">
                  {drawerComments.length > 0 ? (
                    drawerComments.map((c) => {
                      const activeSent = c.sentiment?.manualLabel || c.sentiment?.automatedLabel || "neutral";
                      return (
                        <div
                          key={c.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {c.authorProfileUrl ? (
                                <a
                                  href={c.authorProfileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-bold text-xs text-slate-900 hover:underline flex items-center gap-1"
                                >
                                  {c.authorName || "Anonymous"}
                                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                </a>
                              ) : (
                                <span className="font-bold text-xs text-slate-900">
                                  {c.authorName || "Anonymous"}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                • {formatDate(c.publishedAt)}
                              </span>
                            </div>

                            {/* Sentiment Controls */}
                            <div className="flex items-center gap-1.5">
                              <SentimentBadge sentiment={activeSent} />
                              <select
                                value={activeSent}
                                onChange={(e) =>
                                  handleUpdateSentiment(c.id, e.target.value as SentimentLabel)
                                }
                                className="text-[10px] bg-slate-100 border-none rounded px-1.5 py-0.5 text-slate-600 cursor-pointer hover:bg-slate-200"
                                title="Override sentiment manually"
                              >
                                <option value="positive">Set Positive</option>
                                <option value="negative">Set Negative</option>
                                <option value="neutral">Set Neutral</option>
                              </select>
                            </div>
                          </div>

                          {/* Comment Body */}
                          <p className="text-xs text-slate-800 leading-relaxed bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                            {c.commentText}
                          </p>

                          {/* Sentiment explanation & likes */}
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span>
                              {c.sentiment?.reason ? `Analysis: ${c.sentiment.reason}` : ""}
                            </span>
                            {typeof c.likeCount === "number" && c.likeCount > 0 && (
                              <span className="flex items-center gap-1 text-slate-500 font-mono">
                                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> {c.likeCount}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No comments match this filter for this post.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Bottom Close */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-mono">
                Post ID: {selectedPost.externalPostId}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedPost(null);
                  setPostCommentFilter("all");
                  setPostCommentSearch("");
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SINGLE COMMENT DETAIL MODAL (FOR TABLE VIEW)              */}
      {/* ========================================================= */}
      {selectedComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlatformBadge platform={selectedComment.platform} />
                Comment Inspection
              </h2>
              <button
                onClick={() => setSelectedComment(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Author</span>
                <span className="font-semibold text-slate-800">
                  {selectedComment.authorName || "Anonymous"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Comment Text</span>
                <div className="p-3 bg-slate-50 rounded-lg text-slate-900 text-sm leading-relaxed border border-slate-100">
                  {selectedComment.commentText}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block mb-0.5">Automated Sentiment</span>
                  <SentimentBadge sentiment={selectedComment.sentiment?.automatedLabel} />
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Confidence Score</span>
                  <span className="font-mono text-slate-800">
                    {selectedComment.sentiment?.confidence
                      ? `${(selectedComment.sentiment.confidence * 100).toFixed(0)}%`
                      : "N/A"}
                  </span>
                </div>
              </div>

              {selectedComment.sentiment?.reason && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Analysis Explanation</span>
                  <p className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                    {selectedComment.sentiment.reason}
                  </p>
                </div>
              )}

              {selectedComment.post?.textContent && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Associated Post</span>
                  <p className="text-slate-600 line-clamp-2 italic">
                    "{selectedComment.post.textContent}"
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedComment(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
