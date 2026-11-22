import { NextRequest, NextResponse } from "next/server";
import { startFetchBatch } from "@/lib/fetch/batch-runner";
import { z } from "zod";

const StartFetchSchema = z.object({
  accountIds: z.array(z.string()).min(1, "Select at least one account"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD"),
  timezone: z.string().default("Asia/Kolkata"),
  forceRefresh: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = StartFetchSchema.parse(body);

    if (validated.endDate < validated.startDate) {
      return NextResponse.json(
        { success: false, error: "End date cannot be earlier than start date." },
        { status: 400 }
      );
    }

    const batch = await startFetchBatch(
      validated.accountIds,
      validated.startDate,
      validated.endDate,
      validated.timezone,
      validated.forceRefresh
    );

    return NextResponse.json({ success: true, batch }, { status: 202 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to start extraction";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
