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
  Check,
} from "lucide-react";
import { SocialComment, Platform, SentimentLabel, SocialAccount } from "@/types";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import { SentimentBadge } from "@/components/ui/SentimentBadge";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils";

export default function AllCommentsPage() {
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Detail Modal
  const [selectedComment, setSelectedComment] = useState<SocialComment | null>(null);

  const fetchComments = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set("page", page.toString());
      query.set("limit", limit.toString());
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
        setTotal(data.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/accounts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAccounts(data.accounts);
      });
  }, []);

  useEffect(() => {
    fetchComments();
  }, [page, selectedPlatform, selectedAccountId, selectedSentiment, startDate, endDate]);

  // Periodic live check for incoming comments
  useEffect(() => {
    const interval = setInterval(() => {
      fetchComments(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [page, searchQuery, selectedPlatform, selectedAccountId, selectedSentiment, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComments();
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
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, sentiment: data.comment.sentiment } : c))
        );
        if (selectedComment && selectedComment.id === commentId) {
          setSelectedComment({ ...selectedComment, sentiment: data.comment.sentiment });
        }
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

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            All Extracted Comments
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Search, filter, review sentiment predictions, and export audience feedback.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Sync Active ({total} comments)</span>
          </div>
          <button
            onClick={() => fetchComments(false)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export to CSV
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
              placeholder="Search comment text or author username..."
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
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
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
              setPage(1);
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
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive Only</option>
            <option value="negative">Negative Only</option>
            <option value="neutral">Neutral Only</option>
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-slate-400 text-[11px]">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-xs"
            />
            <span className="text-slate-400 text-[11px]">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Comments Table */}
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
                          {/* Manual Sentiment Quick Override */}
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

        {/* Pagination */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{comments.length}</span> of{" "}
            <span className="font-semibold text-slate-800">{total}</span> comments
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-slate-700 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Comment Details Modal */}
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
