"use client";

import React, { useState } from "react";
import {
  Settings,
  Key,
  Database,
  ShieldCheck,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { PLATFORM_ACTORS } from "@/lib/apify/actors";
import { PlatformBadge } from "@/components/ui/PlatformBadge";

export default function SettingsPage() {
  const [workspaceName, setWorkspaceName] = useState("Digital Marketing Agency");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          System & Integration Settings
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-0.5">
          Manage workspace preferences, Apify Actor platform mappings, and API security.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Workspace settings updated successfully!</span>
        </div>
      )}

      {/* Workspace Preferences Form */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">
          Workspace Information
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Default organization parameters and reporting timezone
        </p>

        <form onSubmit={handleSaveWorkspace} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Workspace / Agency Name
            </label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reporting Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">America/New_York (EST / EDT)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST / PDT)</option>
              <option value="Europe/London">Europe/London (GMT / BST)</option>
            </select>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> Save Preferences
          </button>
        </form>
      </div>

      {/* Apify Actor Integration Matrix */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Configured Apify Platform Actors
            </h2>
            <p className="text-xs text-slate-400">
              Actor IDs and extraction contracts mapped per social media platform (Section 7)
            </p>
          </div>
          <span className="text-[11px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
            Server-Side Execution Only
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-2.5 px-3">Platform</th>
                <th className="py-2.5 px-3">Actor ID</th>
                <th className="py-2.5 px-3">Extracts</th>
                <th className="py-2.5 px-3">Date Filtering</th>
                <th className="py-2.5 px-3">Notes & Constraints</th>
                <th className="py-2.5 px-3 text-right">Docs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.values(PLATFORM_ACTORS).map((cfg) => (
                <tr key={cfg.platform} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3">
                    <PlatformBadge platform={cfg.platform} />
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-800">
                    {cfg.actorId}
                  </td>
                  <td className="py-3 px-3 capitalize text-slate-600">
                    {cfg.extracts}
                  </td>
                  <td className="py-3 px-3">
                    {cfg.supportsDateFiltering ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-medium">
                        Supported
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-medium">
                        Post-filter
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px] max-w-xs">
                    {cfg.notes}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <a
                      href={cfg.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-blue-600 hover:text-blue-800 rounded inline-block"
                      title="View Apify Documentation"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security & Credentials Overview */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Environment Variables & Secret Isolation
            </h2>
            <p className="text-xs text-slate-400">
              All Apify tokens, Supabase service roles, and AI keys are strictly kept on the server.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-mono text-slate-800 font-bold block mb-1">APIFY_API_TOKEN</span>
            <p className="text-[11px] text-slate-500">
              Required for running live scrapers on Apify cloud infrastructure.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-mono text-slate-800 font-bold block mb-1">SUPABASE_URL</span>
            <p className="text-[11px] text-slate-500">
              Target PostgreSQL database instance for persistent storage.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-mono text-slate-800 font-bold block mb-1">SUPABASE_SERVICE_ROLE_KEY</span>
            <p className="text-[11px] text-slate-500">
              Server-only key for performing background batch syncs and RLS bypass for workers.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-mono text-slate-800 font-bold block mb-1">SENTIMENT_API_KEY</span>
            <p className="text-[11px] text-slate-500">
              Optional AI model API key (includes automatic offline NLP fallback).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
