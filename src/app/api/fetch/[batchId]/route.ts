import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await context.params;
    const batch = await db.getBatchById(batchId);

    if (!batch) {
      return NextResponse.json({ success: false, error: "Batch not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, batch });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch batch progress";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
