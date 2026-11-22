import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Platform, SentimentLabel } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const platform = (searchParams.get("platform") as Platform) || undefined;
    const socialAccountId = searchParams.get("socialAccountId") || undefined;
    const sentiment = (searchParams.get("sentiment") as SentimentLabel) || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const searchQuery = searchParams.get("searchQuery") || undefined;

    const { comments } = await db.getComments({
      platform,
      socialAccountId,
      sentiment,
      startDate,
      endDate,
      searchQuery,
      limit: 10000,
    });

    const headers = [
      "Comment ID",
      "Platform",
      "Account Handle",
      "Author",
      "Comment Text",
      "Sentiment",
      "Confidence",
      "Sentiment Reason",
      "Published At",
      "Likes",
      "Replies",
      "Post URL",
      "Comment URL",
    ];

    const escapeCsv = (val?: string | number | null) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = comments.map((c) => {
      const activeSentiment = c.sentiment?.manualLabel || c.sentiment?.automatedLabel || "neutral";
      return [
        escapeCsv(c.externalCommentId),
        escapeCsv(c.platform),
        escapeCsv(c.account?.handle || ""),
        escapeCsv(c.authorName || ""),
        escapeCsv(c.commentText),
        escapeCsv(activeSentiment),
        escapeCsv(c.sentiment?.confidence ? `${(c.sentiment.confidence * 100).toFixed(0)}%` : ""),
        escapeCsv(c.sentiment?.reason || ""),
        escapeCsv(c.publishedAt || ""),
        escapeCsv(c.likeCount || 0),
        escapeCsv(c.replyCount || 0),
        escapeCsv(c.post?.postUrl || ""),
        escapeCsv(c.commentUrl || ""),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="comments_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to export comments";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
