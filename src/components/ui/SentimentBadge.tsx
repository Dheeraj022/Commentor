import React from "react";
import { SentimentLabel } from "@/types";
import { Smile, Frown, Minus } from "lucide-react";

interface SentimentBadgeProps {
  sentiment?: SentimentLabel | string | null;
  confidence?: number | null;
  isManual?: boolean;
  className?: string;
}

export function SentimentBadge({
  sentiment = "neutral",
  confidence,
  isManual = false,
  className = "",
}: SentimentBadgeProps) {
  const s = (sentiment || "neutral").toLowerCase();

  const getStyle = () => {
    switch (s) {
      case "positive":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: Smile,
          label: "Positive",
        };
      case "negative":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          icon: Frown,
          label: "Negative",
        };
      case "neutral":
      default:
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          icon: Minus,
          label: "Neutral",
        };
    }
  };

  const style = getStyle();
  const IconComponent = style.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${className}`}
    >
      <IconComponent className="w-3.5 h-3.5" />
      <span>{style.label}</span>
      {confidence !== undefined && confidence !== null && (
        <span className="opacity-75 text-[10px]">
          ({(confidence * 100).toFixed(0)}%)
        </span>
      )}
      {isManual && (
        <span className="ml-0.5 text-[10px] bg-white/80 px-1 rounded text-slate-600 font-semibold" title="Manually reviewed">
          Manual
        </span>
      )}
    </span>
  );
}
