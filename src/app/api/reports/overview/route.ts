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

    return NextResponse.json({ success: true, metrics });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load overview reports";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
