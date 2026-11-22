"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users2,
  DownloadCloud,
  MessageSquareText,
  BarChart3,
  History,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  onCloseMobile?: () => void;
}

const NAV_ITEMS = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Social Accounts", href: "/accounts", icon: Users2 },
  { label: "Fetch Comments", href: "/fetch", icon: DownloadCloud },
  { label: "All Comments", href: "/comments", icon: MessageSquareText },
  { label: "Sentiment Reports", href: "/reports", icon: BarChart3 },
  { label: "Fetch History", href: "/history", icon: History },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full select-none">
      {/* Brand & Workspace */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900 leading-tight text-sm">
              Social Monitor
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Digital Agency Workspace</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Main Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info / Cache & Cost Shield */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 m-3 rounded-xl border">
        <div className="flex items-center gap-2 mb-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-slate-800">
            Cost & Cache Guard
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Smart deduplication skips previously scraped ranges to prevent duplicate Apify Actor fees.
        </p>
      </div>

      {/* User profile */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
            AG
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-800 truncate">Agency Admin</p>
            <p className="text-[11px] text-slate-400 truncate">admin@agency.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
