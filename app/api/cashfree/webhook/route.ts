// app/api/cashfree/webhook/route.ts
// POST /api/cashfree/webhook
// Delegates to the secure, signature-verified handler

import { NextRequest } from "next/server";
import { handleCashfreeWebhook } from "@/lib/cashfreeWebhookHandler";

// 🔒 MANDATORY: Force Node.js runtime
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handleCashfreeWebhook(req);
}

