import { NextRequest } from "next/server";
import { handleCashfreeWebhook } from "@/lib/cashfreeWebhookHandler";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handleCashfreeWebhook(req);
}
