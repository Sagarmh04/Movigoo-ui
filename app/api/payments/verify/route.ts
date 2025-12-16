// app/api/payments/verify/route.ts
// POST /api/payments/verify
// Verify payment and create booking securely

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth";
import { getPaymentSession, markPaymentSessionCompleted } from "@/lib/payments";
import { createBooking } from "@/lib/createBooking";
import { checkIdempotency, saveIdempotencyResult } from "@/lib/idempotency";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyAuthToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    
    const { paymentSessionId, paymentResponse } = body;

    if (!paymentSessionId) {
      return NextResponse.json(
        { error: "Missing paymentSessionId" },
        { status: 400 }
      );
    }

    // Get payment session
    const session = await getPaymentSession(paymentSessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Payment session not found or expired" },
        { status: 404 }
      );
    }

    // Verify session belongs to user
    if (session.userId !== user.uid) {
      return NextResponse.json(
        { error: "Unauthorized access to payment session" },
        { status: 403 }
      );
    }

    // Check if already processed (idempotency)
    const bookingCheck = await checkIdempotency(`booking-${paymentSessionId}`);
    if (bookingCheck.exists) {
      return NextResponse.json(bookingCheck.result, { status: 200 });
    }

    // Verify payment (mock for now - replace with actual PayU verification)
    const paymentVerified = await verifyPaymentWithPayU(paymentSessionId, paymentResponse);
    if (!paymentVerified) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Create booking
    const { bookingId, qrToken } = await createBooking(
      user.uid,
      session.eventId,
      session.priceCalculation,
      paymentSessionId
    );

    // Mark payment session as completed
    await markPaymentSessionCompleted(paymentSessionId);

    // Save idempotency result
    const result = {
      bookingId,
      qrToken,
      eventId: session.eventId,
    };
    await saveIdempotencyResult(`booking-${paymentSessionId}`, result);

    return NextResponse.json({
      success: true,
      bookingId,
      qrToken,
      eventId: session.eventId,
    });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}

// Mock PayU verification (replace with actual PayU API call)
async function verifyPaymentWithPayU(
  sessionId: string,
  paymentResponse: any
): Promise<boolean> {
  // In production, this would:
  // 1. Call PayU verification API
  // 2. Verify hash/signature
  // 3. Check payment status
  // 4. Validate amount matches session amount
  
  // For now, simulate successful payment
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 500);
  });
}

