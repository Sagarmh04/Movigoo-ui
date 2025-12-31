// app/api/support-tickets/auto-close/route.ts
// API route to auto-close inactive support tickets
// Can be called manually or via scheduled job (e.g., Vercel Cron)

import { NextRequest, NextResponse } from "next/server";
import { autoCloseInactiveTickets } from "@/lib/server/autoCloseInactiveTickets";

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization here
    // For example, check for a secret token in headers
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🔄 Manual trigger: Auto-closing inactive tickets");
    const result = await autoCloseInactiveTickets();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Auto-close completed successfully",
        closedCount: result.closedCount,
        skippedCount: result.skippedCount,
        totalProcessed: result.totalProcessed,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Auto-close API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to auto-close tickets" },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing (remove in production if not needed)
export async function GET(request: NextRequest) {
  return POST(request);
}
