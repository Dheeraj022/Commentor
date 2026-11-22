"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  MessageSquare,
  FileText,
  Smile,
  Frown,
  Minus,
  Calendar,
  Filter,
  RefreshCw,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { OverviewMetrics, Platform, SocialAccount } from "@/types";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import { formatNumber, formatDate } from "@/lib/utils";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const PLATFORMS: { id: Platform | "all"; label: string }[] = [
  { id: "all", label: "All Platforms" },
  { id: "instagram", label: "Instagram" },
  { id: "youtube", label: "YouTube" },
  { id: "facebook", label: "Facebook" },
  { id: "linkedin", label: "LinkedIn" },
];

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | "all">("all");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("2026-11-01");
  const [endDate, setEndDate] = useState<string>("2026-11-22");
  const [isPending, startTransition] = useTransition();

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (selectedPlatform !== "all") query.set("platform", selectedPlatform);
      if (selectedAccountId !== "all") query.set("socialAccountId", selectedAccountId);
      if (startDate) query.set("startDate", startDate);
      if (endDate) query.set("endDate", endDate);

      const [resMetrics, resAccounts] = await Promise.all([
        fetch(`/api/reports/overview?${query.toString()}`),
        fetch("/api/accounts"),
      ]);

      const dataMetrics = await resMetrics.json();
      const dataAccounts = await resAccounts.json();

      if (dataMetrics.success) setMetrics(dataMetrics.metrics);
      if (dataAccounts.success) setAccounts(dataAccounts.accounts);
    } catch (err) {
      console.error("Error fetching overview metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [selectedPlatform, selectedAccountId, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Real-time comment monitoring, sentiment distribution, and cross-platform feedback metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchMetrics()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
            Refresh
          </button>
          <Link
            href="/fetch"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-2xs transition-colors"
          >
            Run Apify Extraction
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 md:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
        {/* Platform Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedPlatform === p.id
                  ? "bg-white text-blue-700 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Account Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Social Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.displayName} ({acc.handle})
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filters */}
        <div className="flex items-center gap-2 ml-auto">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {/* Total Posts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tracked Posts</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatNumber(metrics?.totalPosts)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Across eligible range</p>
        </div>

        {/* Total Comments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Comments</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatNumber(metrics?.totalComments)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Extracted & normalized</p>
        </div>

        {/* Positive Comments */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800">Positive</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Smile className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            {formatNumber(metrics?.positiveComments)}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
            {metrics?.positivePercentage || 0}% of audience
          </p>
        </div>

        {/* Negative Comments */}
        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-800">Negative</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <Frown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-700">
            {formatNumber(metrics?.negativeComments)}
          </div>
          <p className="text-[11px] text-rose-600 font-medium mt-0.5">
            {metrics?.negativePercentage || 0}% of audience
          </p>
        </div>

        {/* Neutral Comments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Neutral</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Minus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-700">
            {formatNumber(metrics?.neutralComments)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {metrics?.neutralPercentage || 0}% queries / remarks
          </p>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment Distribution Pie */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">
            Sentiment Breakdown
          </h2>
          <p className="text-xs text-slate-400 mb-4">Percentage ratio of audience reception</p>
          <div className="h-56 w-full flex items-center justify-center">
            {metrics && metrics.sentimentDistribution && metrics.totalComments > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.sentimentDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {metrics.sentimentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No comment data in selected period</p>
            )}
          </div>
        </div>

        {/* Comments by Platform */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">
            Platform Volume & Sentiment
          </h2>
          <p className="text-xs text-slate-400 mb-4">Total extracted comments grouped by platform</p>
          <div className="h-56 w-full">
            {metrics && metrics.commentsByPlatform && metrics.commentsByPlatform.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.commentsByPlatform}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="positive" name="Positive" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="neutral" name="Neutral" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="negative" name="Negative" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No platform activity recorded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comments Over Time Area Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">
          Comment Activity & Sentiment Trend Over Time
        </h2>
        <p className="text-xs text-slate-400 mb-4">Daily volume of incoming social feedback</p>
        <div className="h-64 w-full">
          {metrics && metrics.commentsOverTime && metrics.commentsOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.commentsOverTime}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartsTooltip />
                <Legend />
                <Area type="monotone" dataKey="positive" name="Positive" stroke="#10b981" fill="#ecfdf5" />
                <Area type="monotone" dataKey="neutral" name="Neutral" stroke="#94a3b8" fill="#f8fafc" />
                <Area type="monotone" dataKey="negative" name="Negative" stroke="#f43f5e" fill="#fff1f2" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              No trend data available for current date range
            </div>
          )}
        </div>
      </div>

      {/* AI Audience Feedback Summary */}
      <div className="bg-gradient-to-br from-blue-50/50 via-white to-slate-50 p-5 rounded-xl border border-blue-100 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              AI Audience Feedback Intelligence
            </h2>
            <p className="text-[11px] text-slate-500">
              Synthesized from active comments in current date filter
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Positive Themes */}
          <div className="bg-white p-3.5 rounded-lg border border-emerald-100 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 mb-2">
              <Smile className="w-4 h-4 text-emerald-600" />
              Positive Praise & Themes
            </div>
            <ul className="space-y-1.5">
              {metrics?.aiSummary.positiveThemes.map((theme, i) => (
                <li key={i} className="text-xs text-slate-600 leading-relaxed flex items-start gap-1.5">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>{theme}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Negative Themes */}
          <div className="bg-white p-3.5 rounded-lg border border-rose-100 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800 mb-2">
              <Frown className="w-4 h-4 text-rose-600" />
              Complaints & Friction Points
            </div>
            <ul className="space-y-1.5">
              {metrics?.aiSummary.negativeThemes.map((theme, i) => (
                <li key={i} className="text-xs text-slate-600 leading-relaxed flex items-start gap-1.5">
                  <span className="text-rose-500 mt-1">•</span>
                  <span>{theme}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggestions */}
          <div className="bg-white p-3.5 rounded-lg border border-blue-100 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Actionable Recommendations
            </div>
            <ul className="space-y-1.5">
              {metrics?.aiSummary.improvementSuggestions.map((sug, i) => (
                <li key={i} className="text-xs text-slate-600 leading-relaxed flex items-start gap-1.5">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Extraction Activity */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Recent Extraction Batches</h2>
            <p className="text-xs text-slate-400">Latest runs and coverage status</p>
          </div>
          <Link
            href="/history"
            className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View all history <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                <th className="pb-2 font-medium">Batch ID</th>
                <th className="pb-2 font-medium">Date Range</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Posts</th>
                <th className="pb-2 font-medium">Comments</th>
                <th className="pb-2 font-medium">Executed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics?.recentBatches && metrics.recentBatches.length > 0 ? (
                metrics.recentBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 font-mono text-[11px] text-slate-700">{b.id}</td>
                    <td className="py-2.5 text-slate-600">
                      {formatDate(b.startDate)} - {formatDate(b.endDate)}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                          b.status === "completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : b.status === "running"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-700">{b.postsFetched || 0}</td>
                    <td className="py-2.5 font-semibold text-slate-900">{b.commentsFetched || 0}</td>
                    <td className="py-2.5 text-slate-400">{formatDate(b.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">
                    No recent extraction batches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
