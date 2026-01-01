// app/api/payments/verify/route.ts
// POST /api/payments/verify
// Disabled for production: mock payment verification. Cashfree webhook is the only source of truth.

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Disabled for production: mock payment verification. Cashfree webhook is the only source of truth.
  return NextResponse.json(
    { 
      error: "This endpoint has been disabled for production launch.",
      message: "Payment confirmation is handled exclusively by Cashfree webhook."
    },
    { status: 410 }
  );
}

