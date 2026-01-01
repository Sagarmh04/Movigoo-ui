// app/api/bookings/route.ts
// POST /api/bookings
// Legacy endpoint disabled — payment confirmation handled by webhook only

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Legacy endpoint disabled — payment confirmation handled by webhook only
  // This endpoint previously allowed payment bypass and has been disabled for security
  return NextResponse.json(
    { 
      error: "This endpoint has been disabled. Payment confirmation is handled by webhook only.",
      message: "Use /api/bookings/create-pending to create pending bookings, then complete payment via Cashfree."
    },
    { status: 410 }
  );
}
