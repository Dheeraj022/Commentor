import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const AccountUpdateSchema = z.object({
  displayName: z.string().min(2).optional(),
  handle: z.string().min(1).optional(),
  profileUrl: z.string().url().optional(),
  externalAccountId: z.string().optional().nullable(),
  actorId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const validated = AccountUpdateSchema.parse(body);

    const updated = await db.updateAccount(id, validated);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, account: updated });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to update account";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const deleted = await db.deleteAccount(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete account";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
