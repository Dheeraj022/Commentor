import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const batches = await db.getBatches();
    const accounts = await db.getAccounts();

    const enrichedBatches = batches.map((batch) => ({
      ...batch,
      accounts: batch.accounts?.map((acc) => ({
        ...acc,
        socialAccount: accounts.find((a) => a.id === acc.socialAccountId),
      })),
    }));

    return NextResponse.json({ success: true, batches: enrichedBatches });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load fetch history";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
