// app/api/verify-payment/route.ts
// POST /api/verify-payment
// Verifies Cashfree payment and creates/updates booking

import { NextRequest } from "next/server";

// Force Node.js runtime
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  void req;
  return new Response(
    "Deprecated endpoint. Payment verification is handled via webhook.",
    { status: 410 }
  );
}

