"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  RefreshCw,
  ExternalLink,
  Calendar,
  Layers,
} from "lucide-react";
import { FetchBatch } from "@/types";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import Link from "next/link";

export default function FetchHistoryPage() {
  const [batches, setBatches] = useState<FetchBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<FetchBatch | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (data.success) {
        setBatches(data.batches);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRefreshBatch = async (batchId: string) => {
    if (!confirm("Re-running this batch will force a fresh Apify extraction. Do you wish to continue?")) {
      return;
    }
    try {
      const res = await fetch(`/api/fetch/${batchId}/refresh`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert("Batch re-run triggered successfully.");
        fetchHistory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Extraction Run History
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Audit log of all Apify Actor executions, cached range reuses, and account-level status.
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Batch ID</th>
                <th className="py-3 px-4">Date Range</th>
                <th className="py-3 px-4">Accounts</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Posts</th>
                <th className="py-3 px-4">Comments</th>
                <th className="py-3 px-4">Completed At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.length > 0 ? (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      {batch.id}
                      {batch.refreshRequested && (
                        <span className="block text-[10px] text-amber-600 font-sans">
                          (Force refresh)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {formatDate(batch.startDate)} - {formatDate(batch.endDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        {batch.accounts?.map((acc, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono"
                          >
                            {acc.socialAccount?.handle || acc.socialAccountId}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                          batch.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : batch.status === "partially_completed"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : batch.status === "failed"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {batch.status === "completed" && <CheckCircle2 className="w-3 h-3" />}
                        {batch.status === "partially_completed" && <AlertTriangle className="w-3 h-3" />}
                        {batch.status === "failed" && <XCircle className="w-3 h-3" />}
                        {batch.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {batch.postsFetched || 0}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {batch.commentsFetched || 0}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {batch.completedAt ? formatDateTime(batch.completedAt) : "In Progress"}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedBatch(batch)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100"
                        title="View Account Runs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRefreshBatch(batch.id)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-slate-100"
                        title="Force Re-run"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No extraction batches recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Details Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Batch Execution Audit: {selectedBatch.id}
                </h2>
                <p className="text-xs text-slate-400">
                  Target range: {selectedBatch.startDate} to {selectedBatch.endDate} ({selectedBatch.timezone})
                </p>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Account Level Runs
              </h3>

              <div className="space-y-2">
                {selectedBatch.accounts?.map((acc, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {acc.socialAccount && (
                          <PlatformBadge platform={acc.socialAccount.platform} />
                        )}
                        <span className="font-semibold text-slate-800">
                          {acc.socialAccount?.displayName || acc.socialAccountId}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                        Coverage: {acc.coverageStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-slate-600 text-[11px] pt-1">
                      <span>Posts: <strong>{acc.postsCount}</strong></span>
                      <span>Comments: <strong>{acc.commentsCount}</strong></span>
                      {acc.apifyRun?.apifyRunId && (
                        <span>Apify Run ID: <code className="bg-slate-200/60 px-1 py-0.5 rounded text-[10px]">{acc.apifyRun.apifyRunId}</code></span>
                      )}
                    </div>

                    {acc.errorMessage && (
                      <p className="text-rose-600 bg-rose-50 p-2 rounded text-[11px]">
                        Error: {acc.errorMessage}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedBatch(null)}
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
