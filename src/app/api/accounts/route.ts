import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { Platform } from "@/types";

const AccountCreateSchema = z.object({
  platform: z.enum(["instagram", "facebook", "youtube", "linkedin"]),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  handle: z.string().min(1, "Handle or URL is required"),
  profileUrl: z.string().url("Must be a valid profile or page URL"),
  externalAccountId: z.string().optional().nullable(),
  actorId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const accounts = await db.getAccounts();
    return NextResponse.json({ success: true, accounts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch accounts";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = AccountCreateSchema.parse(body);

    const newAccount = await db.addAccount({
      workspaceId: db.getDefaultWorkspaceId(),
      platform: validated.platform as Platform,
      displayName: validated.displayName,
      handle: validated.handle,
      profileUrl: validated.profileUrl,
      externalAccountId: validated.externalAccountId,
      actorId: validated.actorId,
      isActive: validated.isActive,
    });

    return NextResponse.json({ success: true, account: newAccount }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to create account";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
