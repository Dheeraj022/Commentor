import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Platform } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const platform = (searchParams.get("platform") as Platform) || undefined;
    const socialAccountId = searchParams.get("socialAccountId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const metrics = await db.getOverviewMetrics({
      platform,
      socialAccountId,
      startDate,
      endDate,
    });

    const accounts = await db.getAccounts();
    const { comments } = await db.getComments({
      platform,
      socialAccountId,
      startDate,
      endDate,
      limit: 1000,
    });

    // Account-wise sentiment distribution
    const accountSentiment = accounts.map((acc) => {
      const accComments = comments.filter((c) => c.socialAccountId === acc.id);
      const positive = accComments.filter((c) => (c.sentiment?.manualLabel || c.sentiment?.automatedLabel) === "positive").length;
      const negative = accComments.filter((c) => (c.sentiment?.manualLabel || c.sentiment?.automatedLabel) === "negative").length;
      const neutral = accComments.filter((c) => (c.sentiment?.manualLabel || c.sentiment?.automatedLabel) === "neutral").length;
      return {
        accountId: acc.id,
        displayName: acc.displayName,
        handle: acc.handle,
        platform: acc.platform,
        total: accComments.length,
        positive,
        negative,
        neutral,
        positiveRate: accComments.length > 0 ? Math.round((positive / accComments.length) * 100) : 0,
      };
    }).filter((a) => a.total > 0 || !socialAccountId);

    return NextResponse.json({
      success: true,
      report: {
        totalComments: metrics.totalComments,
        positiveComments: metrics.positiveComments,
        negativeComments: metrics.negativeComments,
        neutralComments: metrics.neutralComments,
        positivePercentage: metrics.positivePercentage,
        negativePercentage: metrics.negativePercentage,
        neutralPercentage: metrics.neutralPercentage,
        commentsByPlatform: metrics.commentsByPlatform,
        accountSentiment,
        sentimentTrend: metrics.sentimentTrend,
        aiSummary: metrics.aiSummary,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load sentiment report";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
