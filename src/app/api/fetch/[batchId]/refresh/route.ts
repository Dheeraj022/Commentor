import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startFetchBatch } from "@/lib/fetch/batch-runner";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await context.params;
    const existing = await db.getBatchById(batchId);

    if (!existing) {
      return NextResponse.json({ success: false, error: "Batch not found" }, { status: 404 });
    }

    const accountIds = existing.accounts?.map((a) => a.socialAccountId) || [];
    if (accountIds.length === 0) {
      return NextResponse.json({ success: false, error: "No accounts found in batch" }, { status: 400 });
    }

    // Trigger re-run with forceRefresh = true
    const newBatch = await startFetchBatch(
      accountIds,
      existing.startDate,
      existing.endDate,
      existing.timezone,
      true // forceRefresh
    );

    return NextResponse.json({ success: true, batch: newBatch });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to force refresh batch";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
