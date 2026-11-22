"use client";

import React, { useState, useEffect } from "react";
import {
  Users2,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";
import { SocialAccount, Platform } from "@/types";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import { formatDate } from "@/lib/utils";
import { PLATFORM_ACTORS } from "@/lib/apify/actors";

export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SocialAccount | null>(null);

  // Form states
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [externalAccountId, setExternalAccountId] = useState("");
  const [actorId, setActorId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openAddModal = () => {
    setEditingAccount(null);
    setPlatform("instagram");
    setDisplayName("");
    setHandle("");
    setProfileUrl("");
    setExternalAccountId("");
    setActorId(PLATFORM_ACTORS.instagram.actorId);
    setIsActive(true);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (acc: SocialAccount) => {
    setEditingAccount(acc);
    setPlatform(acc.platform);
    setDisplayName(acc.displayName);
    setHandle(acc.handle);
    setProfileUrl(acc.profileUrl);
    setExternalAccountId(acc.externalAccountId || "");
    setActorId(acc.actorId || PLATFORM_ACTORS[acc.platform].actorId);
    setIsActive(acc.isActive);
    setFormError("");
    setModalOpen(true);
  };

  const handlePlatformChange = (p: Platform) => {
    setPlatform(p);
    setActorId(PLATFORM_ACTORS[p].actorId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!displayName.trim() || !handle.trim() || !profileUrl.trim()) {
      setFormError("Display name, handle, and valid URL are required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingAccount) {
        const res = await fetch(`/api/accounts/${editingAccount.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName,
            handle,
            profileUrl,
            externalAccountId: externalAccountId || null,
            actorId: actorId || null,
            isActive,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      } else {
        const res = await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform,
            displayName,
            handle,
            profileUrl,
            externalAccountId: externalAccountId || null,
            actorId: actorId || null,
            isActive,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      }

      setModalOpen(false);
      fetchAccounts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save account";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? All associated posts and comments will also be removed.`)) {
      return;
    }
    try {
      await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      fetchAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Social Media Accounts
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Configure target profiles, pages, and channels for comment monitoring.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Social Account
        </button>
      </div>

      {/* Account Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">Configured Actor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Fetched</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.length > 0 ? (
                accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 text-sm">{acc.displayName}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-slate-500 font-mono text-[11px]">{acc.handle}</span>
                        <a
                          href={acc.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-blue-600 inline-block"
                          title="Open public profile"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <PlatformBadge platform={acc.platform} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {acc.actorId || PLATFORM_ACTORS[acc.platform]?.actorId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {acc.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium border border-slate-200">
                          <XCircle className="w-3 h-3" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {acc.lastFetchedAt ? formatDate(acc.lastFetchedAt) : "Never"}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(acc)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100"
                        title="Edit account"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(acc.id, acc.displayName)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100"
                        title="Delete account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No social accounts configured yet. Click "Add Social Account" above to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              {editingAccount ? "Edit Social Account" : "Add New Social Account"}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter public profile details. We never request social passwords.
            </p>

            {formError && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Platform */}
              {!editingAccount && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => handlePlatformChange(e.target.value as Platform)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="facebook">Facebook</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                </div>
              )}

              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Display / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nike Global"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>

              {/* Handle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Social Handle *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. @nikestore"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>

              {/* Profile URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Public Profile / Page URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.instagram.com/nikestore"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>

              {/* Actor ID (Configured platform default) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apify Actor ID
                </label>
                <input
                  type="text"
                  value={actorId}
                  onChange={(e) => setActorId(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Defaults to verified actor: {PLATFORM_ACTORS[platform]?.actorId}
                </span>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="accountActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="accountActive" className="text-xs font-medium text-slate-700">
                  Account is active for extraction runs
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
                >
                  {submitting ? "Saving..." : editingAccount ? "Save Changes" : "Add Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
