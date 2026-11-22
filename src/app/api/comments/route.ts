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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const { comments, total } = await db.getComments({
      platform,
      socialAccountId,
      sentiment,
      startDate,
      endDate,
      searchQuery,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load comments";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
