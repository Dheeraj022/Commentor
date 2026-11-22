"use client";

import React from "react";
import { Menu, Bell, Search, ExternalLink } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  title?: string;
}

export function Header({ onToggleMobileSidebar, title }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h2 className="text-sm md:text-base font-semibold text-slate-900">
            {title}
          </h2>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/fetch"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors"
        >
          Fetch New Comments
        </Link>
        <span className="hidden sm:inline-block h-4 w-px bg-slate-200" />
        <span className="text-xs px-2.5 py-1 bg-slate-100 rounded-md text-slate-600 font-mono">
          TZ: Asia/Kolkata
        </span>
      </div>
    </header>
  );
}
