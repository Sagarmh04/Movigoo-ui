// app/api/payments/cashfree/webhook/route.ts
// ⚠️ LEGACY ENDPOINT - DISABLED
// This endpoint is deprecated. Use /api/cashfree/webhook instead.
//
// PRODUCTION SETUP:
// - Active webhook: /api/cashfree/webhook
// - Disable this endpoint in Cashfree Dashboard
// - All webhooks should point to: https://www.movigoo.in/api/cashfree/webhook

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Return 410 Gone to indicate this endpoint is deprecated
  console.warn("[Webhook] Legacy endpoint /api/payments/cashfree/webhook called - use /api/cashfree/webhook instead");
  return NextResponse.json(
    { 
      error: "This webhook endpoint is deprecated. Please use /api/cashfree/webhook",
      migration: "Update Cashfree Dashboard webhook URL to: https://www.movigoo.in/api/cashfree/webhook"
    },
    { status: 410 }
  );
}
