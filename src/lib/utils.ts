import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | null, formatStr: string = "MMM d, yyyy"): string {
  if (!dateString) return "—";
  try {
    const date = typeof dateString === "string" ? parseISO(dateString) : new Date(dateString);
    return format(date, formatStr);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string | null): string {
  return formatDate(dateString, "MMM d, yyyy h:mm a");
}

export function formatNumber(num?: number | null): string {
  if (num === null || num === undefined) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toLocaleString();
}
