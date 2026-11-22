import React from "react";
import { Platform } from "@/types";

export const SOCIAL_COLORS: Record<string, string> = {
  instagram: "#ec4899", // Pink
  youtube: "#dc2626",   // Red
  facebook: "#1e3a8a",  // Dark Blue
  linkedin: "#2563eb",  // Blue
};

export const SOCIAL_BG_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  instagram: {
    bg: "bg-pink-50",
    text: "text-pink-600",
    border: "border-pink-200",
  },
  youtube: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
  },
  facebook: {
    bg: "bg-blue-950/10",
    text: "text-blue-950",
    border: "border-blue-900/30",
  },
  linkedin: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
  },
};

interface PlatformBadgeProps {
  platform: Platform | string;
  showIcon?: boolean;
  className?: string;
}

export function InstagramIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

export function FacebookIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

export function YouTubeIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
      <polygon points="10 15 15 12 10 9 10 15" fill="currentColor"/>
    </svg>
  );
}

export function LinkedInIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect width="4" height="12" x="2" y="9"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}

export function PlatformIcon({ platform, className = "w-3.5 h-3.5" }: { platform: Platform | string; className?: string }) {
  const p = platform.toLowerCase();
  switch (p) {
    case "instagram":
      return <InstagramIcon className={className} />;
    case "facebook":
      return <FacebookIcon className={className} />;
    case "youtube":
      return <YouTubeIcon className={className} />;
    case "linkedin":
      return <LinkedInIcon className={className} />;
    default:
      return null;
  }
}

export function PlatformBadge({ platform, showIcon = true, className = "" }: PlatformBadgeProps) {
  const p = platform.toLowerCase();

  switch (p) {
    case "instagram":
      // IG: Pink
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-pink-50 text-pink-600 border-pink-200 ${className}`}>
          {showIcon && <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />}
          Instagram
        </span>
      );
    case "facebook":
      // FB: Dark Blue (#1E3A8A)
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-blue-950/10 text-blue-950 border-blue-900/30 ${className}`}>
          {showIcon && <FacebookIcon className="w-3.5 h-3.5 text-blue-950" />}
          Facebook
        </span>
      );
    case "youtube":
      // YouTube: Red (#DC2626)
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-red-50 text-red-600 border-red-200 ${className}`}>
          {showIcon && <YouTubeIcon className="w-3.5 h-3.5 text-red-600" />}
          YouTube
        </span>
      );
    case "linkedin":
      // LinkedIn: Blue (#2563EB)
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-blue-50 text-blue-600 border-blue-200 ${className}`}>
          {showIcon && <LinkedInIcon className="w-3.5 h-3.5 text-blue-600" />}
          LinkedIn
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-50 text-slate-700 border-slate-200 ${className}`}>
          {platform}
        </span>
      );
  }
}
