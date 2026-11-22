"use client";

import React, { useState, useEffect } from "react";
import {
  DownloadCloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Play,
  Check,
  AlertCircle,
} from "lucide-react";
import { SocialAccount, FetchPlanPreview, FetchBatch } from "@/types";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import Link from "next/link";

export default function FetchCommentsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("2026-11-10");
  const [endDate, setEndDate] = useState("2026-11-20");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [forceRefresh, setForceRefresh] = useState(false);

  const [preview, setPreview] = useState<FetchPlanPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Execution state
  const [activeBatch, setActiveBatch] = useState<FetchBatch | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    fetch("/api/accounts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAccounts(data.accounts);
          // Default select all active accounts
          setSelectedAccountIds(data.accounts.filter((a: SocialAccount) => a.isActive).map((a: SocialAccount) => a.id));
        }
      });
  }, []);

  const toggleAccount = (id: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleGeneratePreview = async () => {
    setErrorMsg("");
    if (selectedAccountIds.length === 0) {
      setErrorMsg("Please select at least one social media account.");
      return;
    }
    if (endDate < startDate) {
      setErrorMsg("End date cannot be earlier than start date.");
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await fetch("/api/fetch/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountIds: selectedAccountIds,
          startDate,
          endDate,
          timezone,
          forceRefresh,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPreview(data.preview);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate fetch plan";
      setErrorMsg(msg);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Trigger actual extraction
  const handleStartExtraction = async () => {
    setErrorMsg("");
    try {
      const res = await fetch("/api/fetch/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountIds: selectedAccountIds,
          startDate,
          endDate,
          timezone,
          forceRefresh,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setActiveBatch(data.batch);
      setPolling(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to launch extraction";
      setErrorMsg(msg);
    }
  };

  // Poll batch status until completed or failed
  useEffect(() => {
    if (!polling || !activeBatch) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/fetch/${activeBatch.id}`);
        const data = await res.json();
        if (data.success && data.batch) {
          setActiveBatch(data.batch);
          if (["completed", "partially_completed", "failed", "cancelled"].includes(data.batch.status)) {
            setPolling(false);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [polling, activeBatch]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Fetch Comments & Posts
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-0.5">
          Select accounts and date range. Smart caching prevents unnecessary repeat Apify runs.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Selection & Date Range */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Select Accounts */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Step 1: Select Social Accounts
                </h2>
                <p className="text-xs text-slate-400">Choose one or more active accounts to extract</p>
              </div>
              <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold">
                {selectedAccountIds.length} Selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
              {accounts.map((acc) => {
                const isSelected = selectedAccountIds.includes(acc.id);
                return (
                  <div
                    key={acc.id}
                    onClick={() => acc.isActive && toggleAccount(acc.id)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                      !acc.isActive
                        ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200"
                        : isSelected
                        ? "border-blue-500 bg-blue-50/50 shadow-2xs ring-1 ring-blue-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                          isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {acc.displayName}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">{acc.handle}</p>
                      </div>
                    </div>
                    <PlatformBadge platform={acc.platform} showIcon={false} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Date Range */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              Step 2: Select Date Range & Timezone
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Extract posts published between these dates and their associated comments.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Workspace Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                </select>
              </div>
            </div>

            {/* Force Refresh Warning Checkbox */}
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="forceRefreshCheck"
                checked={forceRefresh}
                onChange={(e) => setForceRefresh(e.target.checked)}
                className="mt-0.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="forceRefreshCheck" className="text-xs text-amber-900 leading-relaxed cursor-pointer">
                <span className="font-semibold">Force fresh extraction (Bypass cache):</span> Re-scrapes all selected accounts regardless of existing coverage. May incur extra Apify Actor usage.
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleGeneratePreview}
                disabled={previewLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors flex items-center gap-2"
              >
                {previewLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Evaluating Cache Coverage...
                  </>
                ) : (
                  <>
                    Preview Fetch Plan <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Plan Preview & Execution Guard */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <h2 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Extraction Plan & Cache Coverage
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Estimated runs and deduplication overview
            </p>

            {preview ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Date Range:</span>
                    <span className="font-semibold text-slate-800">{preview.startDate} → {preview.endDate}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Complete Cached Coverage:</span>
                    <span className="font-semibold text-emerald-700">{preview.cachedAccountsCount} accounts (Free)</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>New Extraction Required:</span>
                    <span className="font-semibold text-blue-700">{preview.extractionNeededCount} accounts</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Estimated Apify Actor Runs:</span>
                    <span className="font-mono font-bold text-slate-900">{preview.estimatedActorRuns}</span>
                  </div>
                </div>

                {/* Per account status */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {preview.accounts.map((accItem) => (
                    <div
                      key={accItem.socialAccount.id}
                      className="p-2.5 rounded-lg border border-slate-100 bg-white text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800 truncate">
                          {accItem.socialAccount.displayName}
                        </span>
                        {accItem.needsExtraction ? (
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            Run Required
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Reusing Cache
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {accItem.reason}
                      </p>
                    </div>
                  ))}
                </div>

                {preview.warnings.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                    {preview.warnings.map((w, i) => (
                      <div key={i}>⚠️ {w}</div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleStartExtraction}
                  disabled={polling}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5" />
                  {polling ? "Extraction Running..." : "Execute Fetch Plan"}
                </button>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                Click "Preview Fetch Plan" to inspect cache coverage and estimated Apify Actor runs before executing.
              </div>
            )}
          </div>

          {/* Active Job Tracker */}
          {activeBatch && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Extraction Monitor
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    activeBatch.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : activeBatch.status === "failed"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse"
                  }`}
                >
                  {activeBatch.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Posts Extracted:</span>
                  <span className="font-bold text-slate-900">{activeBatch.postsFetched || 0}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Comments Analyzed:</span>
                  <span className="font-bold text-slate-900">{activeBatch.commentsFetched || 0}</span>
                </div>

                {activeBatch.status === "completed" && (
                  <div className="pt-2">
                    <Link
                      href="/comments"
                      className="w-full py-2 text-xs font-semibold text-center block rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                    >
                      View Extracted Comments →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
