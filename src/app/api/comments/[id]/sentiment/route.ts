import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { SentimentLabel } from "@/types";

const UpdateSentimentSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const validated = UpdateSentimentSchema.parse(body);

    const updated = await db.updateCommentSentiment(id, validated.sentiment as SentimentLabel);

    if (!updated) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, comment: updated });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to update sentiment";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
