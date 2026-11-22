import type { FetchCoverage, CoverageStatus, SocialAccount } from "@/types";
import { isWithinInterval, parseISO, isBefore, isAfter, isEqual } from "date-fns";

export interface CoverageEvaluation {
  status: CoverageStatus;
  needsExtraction: boolean;
  reason: string;
  cachedCoverage?: FetchCoverage | null;
  adjustedDateRange?: {
    startDate: string;
    endDate: string;
  };
}

export function evaluateAccountCoverage(
  account: SocialAccount,
  requestedStartDate: string,
  requestedEndDate: string,
  existingCoverages: FetchCoverage[],
  forceRefresh: boolean = false
): CoverageEvaluation {
  if (forceRefresh) {
    return {
      status: "missing",
      needsExtraction: true,
      reason: "Manual refresh requested. Existing cache will be updated with fresh extraction.",
    };
  }

  // Find coverage for this account
  const accountCoverages = existingCoverages.filter(
    (c) => c.socialAccountId === account.id && c.coverageStatus === "complete"
  );

  const reqStart = parseISO(requestedStartDate);
  const reqEnd = parseISO(requestedEndDate);

  // Check 1: Exact match or full containment
  for (const cov of accountCoverages) {
    const covStart = parseISO(cov.startDate);
    const covEnd = parseISO(cov.endDate);

    // Exact match
    if (isEqual(covStart, reqStart) && isEqual(covEnd, reqEnd)) {
      return {
        status: "complete",
        needsExtraction: false,
        reason: `Complete data already fetched on ${cov.completedAt ? new Date(cov.completedAt).toLocaleDateString() : 'earlier run'}. Showing saved results.`,
        cachedCoverage: cov,
      };
    }

    // Full containment: existing coverage covers the entire requested range (covStart <= reqStart && covEnd >= reqEnd)
    if ((isBefore(covStart, reqStart) || isEqual(covStart, reqStart)) && (isAfter(covEnd, reqEnd) || isEqual(covEnd, reqEnd))) {
      return {
        status: "complete",
        needsExtraction: false,
        reason: `Requested date range is fully covered by existing dataset (${cov.startDate} to ${cov.endDate}). Reusing cached posts and comments.`,
        cachedCoverage: cov,
      };
    }
  }

  // Check 2: Partial overlap
  for (const cov of accountCoverages) {
    const covStart = parseISO(cov.startDate);
    const covEnd = parseISO(cov.endDate);

    // Overlap where existing coverage ends during requested range: covStart <= reqStart <= covEnd < reqEnd
    if ((isBefore(covStart, reqStart) || isEqual(covStart, reqStart)) && isBefore(covEnd, reqEnd) && (isAfter(covEnd, reqStart) || isEqual(covEnd, reqStart))) {
      return {
        status: "partial",
        needsExtraction: true,
        reason: `Partial coverage exists (${cov.startDate} to ${cov.endDate}). Missing data from ${cov.endDate} to ${requestedEndDate}.`,
        cachedCoverage: cov,
      };
    }

    // Overlap where existing coverage starts during requested range: reqStart < covStart <= reqEnd
    if (isBefore(reqStart, covStart) && (isBefore(covStart, reqEnd) || isEqual(covStart, reqEnd))) {
      return {
        status: "partial",
        needsExtraction: true,
        reason: `Partial coverage exists (${cov.startDate} to ${cov.endDate}). Missing data before ${cov.startDate}.`,
        cachedCoverage: cov,
      };
    }
  }

  return {
    status: "missing",
    needsExtraction: true,
    reason: "No previous extraction coverage found for this account and date range.",
  };
}
