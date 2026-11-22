import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Platform, SentimentLabel } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "24", 10)));
    const offset = (page - 1) * limit;

    const platform = (searchParams.get("platform") as Platform | "all") || "all";
    const socialAccountId = searchParams.get("socialAccountId") || "all";
    const sentiment = (searchParams.get("sentiment") as SentimentLabel | "all") || "all";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const searchQuery = searchParams.get("searchQuery") || undefined;

    const { posts, total } = await db.getPostsWithStats({
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
      posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load posts";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
