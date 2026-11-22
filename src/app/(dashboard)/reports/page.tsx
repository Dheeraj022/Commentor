"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Smile,
  Frown,
  Minus,
  Sparkles,
  RefreshCw,
  TrendingUp,
  MessageCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Platform } from "@/types";
import { PlatformBadge, PlatformIcon, SOCIAL_COLORS } from "@/components/ui/PlatformBadge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

interface SentimentReportData {
  totalComments: number;
  positiveComments: number;
  negativeComments: number;
  neutralComments: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  commentsByPlatform: {
    platform: Platform;
    count: number;
    positive: number;
    negative: number;
    neutral: number;
  }[];
  accountSentiment: {
    accountId: string;
    displayName: string;
    handle: string;
    platform: Platform;
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    positiveRate: number;
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
}

export default function SentimentReportsPage() {
  const [data, setData] = useState<SentimentReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/sentiment");
      const json = await res.json();
      if (json.success) setData(json.report);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Sentiment Intelligence & Reports
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Deep-dive audience reception metrics, praise topics, and common friction points.
          </p>
        </div>
        <button
          onClick={fetchReport}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Sentiment Overview Ratio Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Positive */}
        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Positive Sentiment
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Smile className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-700">
              {data?.positivePercentage || 0}%
            </span>
            <span className="text-xs text-slate-500">
              ({data?.positiveComments || 0} comments)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${data?.positivePercentage || 0}%` }}
            />
          </div>
        </div>

        {/* Negative */}
        <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">
              Negative Sentiment
            </span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <Frown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-700">
              {data?.negativePercentage || 0}%
            </span>
            <span className="text-xs text-slate-500">
              ({data?.negativeComments || 0} comments)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full"
              style={{ width: `${data?.negativePercentage || 0}%` }}
            />
          </div>
        </div>

        {/* Neutral */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Neutral / Inquiries
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Minus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-700">
              {data?.neutralPercentage || 0}%
            </span>
            <span className="text-xs text-slate-500">
              ({data?.neutralComments || 0} comments)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-slate-400 h-full rounded-full"
              style={{ width: `${data?.neutralPercentage || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Platform Summary Cards (Social Brand Colors) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(["instagram", "facebook", "youtube", "linkedin"] as Platform[]).map((plt) => {
          const item = data?.commentsByPlatform.find((c) => c.platform === plt) || {
            platform: plt,
            count: 0,
            positive: 0,
            neutral: 0,
            negative: 0,
          };
          const posRate = item.count > 0 ? Math.round((item.positive / item.count) * 100) : 0;

          // Brand color card borders & accents
          let cardStyle = "border-slate-200 bg-white";
          if (plt === "instagram") cardStyle = "border-pink-200 bg-gradient-to-br from-pink-50/40 via-white to-pink-50/10";
          if (plt === "youtube") cardStyle = "border-red-200 bg-gradient-to-br from-red-50/40 via-white to-red-50/10";
          if (plt === "facebook") cardStyle = "border-blue-900/30 bg-gradient-to-br from-blue-950/5 via-white to-blue-900/5";
          if (plt === "linkedin") cardStyle = "border-blue-200 bg-gradient-to-br from-blue-50/40 via-white to-blue-50/10";

          return (
            <div key={plt} className={`p-4 rounded-xl border shadow-2xs ${cardStyle}`}>
              <div className="flex items-center justify-between">
                <PlatformBadge platform={plt} />
                <span className="text-xs font-mono font-semibold text-slate-700">
                  {item.count} {item.count === 1 ? "comment" : "comments"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1 text-[11px] text-center">
                <div className="p-1.5 rounded-md bg-emerald-50/80 text-emerald-800">
                  <div className="font-bold">{item.positive}</div>
                  <div className="text-[10px] text-emerald-600">Pos</div>
                </div>
                <div className="p-1.5 rounded-md bg-slate-50 text-slate-700">
                  <div className="font-bold">{item.neutral}</div>
                  <div className="text-[10px] text-slate-500">Neu</div>
                </div>
                <div className="p-1.5 rounded-md bg-rose-50/80 text-rose-800">
                  <div className="font-bold">{item.negative}</div>
                  <div className="text-[10px] text-rose-600">Neg</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>Positive Reception</span>
                <span className="font-semibold text-slate-800">{posRate}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${posRate}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Account-by-Account Sentiment Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">
          Account Sentiment Comparison
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Detailed sentiment ratios across your connected brand profiles
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Account</th>
                <th className="py-2.5 px-3">Platform</th>
                <th className="py-2.5 px-3">Total</th>
                <th className="py-2.5 px-3 text-emerald-700">Positive</th>
                <th className="py-2.5 px-3 text-rose-700">Negative</th>
                <th className="py-2.5 px-3 text-slate-600">Neutral</th>
                <th className="py-2.5 px-3">Positive Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.accountSentiment.map((acc) => (
                <tr key={acc.accountId} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    {acc.displayName}
                    <div className="text-[11px] font-normal text-slate-400">{acc.handle}</div>
                  </td>
                  <td className="py-3 px-3">
                    <PlatformBadge platform={acc.platform} />
                  </td>
                  <td className="py-3 px-3 font-mono">{acc.total}</td>
                  <td className="py-3 px-3 font-mono font-medium text-emerald-700">{acc.positive}</td>
                  <td className="py-3 px-3 font-mono font-medium text-rose-700">{acc.negative}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{acc.neutral}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${acc.positiveRate}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-800 text-[11px]">
                        {acc.positiveRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Sentiment Summary & Themes Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positive Themes */}
        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <ThumbsUp className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-emerald-900">
              Top Positive Feedback Themes
            </h2>
          </div>
          <ul className="space-y-2">
            {data?.aiSummary.positiveThemes.map((t, idx) => (
              <li key={idx} className="text-xs text-slate-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Negative Complaints */}
        <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <ThumbsDown className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-semibold text-rose-900">
              Common Complaints & Critical Topics
            </h2>
          </div>
          <ul className="space-y-2">
            {data?.aiSummary.negativeThemes.map((t, idx) => (
              <li key={idx} className="text-xs text-slate-700 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100 flex items-start gap-2">
                <span className="text-rose-600 font-bold">✗</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
