// app/api/payments/initiate/route.ts
// POST /api/payments/initiate
// Server-side payment session creation with price validation

import { NextRequest, NextResponse } from "next/server";
import { calculateBookingPrice } from "@/lib/priceCalculator";
import { createPaymentSession } from "@/lib/payments";
import { generateIdempotencyKey, checkIdempotency, saveIdempotencyResult } from "@/lib/idempotency";
import { verifyAuthToken } from "@/lib/auth";

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
    
    const { eventId, ticketSelections } = body;

    // Validate input
    if (!eventId || !Array.isArray(ticketSelections) || ticketSelections.length === 0) {
      return NextResponse.json(
        { error: "Missing eventId or ticketSelections" },
        { status: 400 }
      );
    }

    // Validate ticket selections
    for (const selection of ticketSelections) {
      if (!selection.ticketTypeId || typeof selection.quantity !== "number" || selection.quantity < 1) {
        return NextResponse.json(
          { error: "Invalid ticket selection" },
          { status: 400 }
        );
      }
    }

    // Generate idempotency key
    const idempotencyKey = generateIdempotencyKey(
      user.uid,
      eventId,
      ticketSelections.map((t: any) => t.ticketTypeId).join("-"),
      ticketSelections.reduce((sum: number, t: any) => sum + t.quantity, 0)
    );

    // Check for duplicate request
    const existing = await checkIdempotency(idempotencyKey);
    if (existing.exists) {
      return NextResponse.json(existing.result, { status: 200 });
    }

    // Calculate price on server (NEVER trust client)
    const priceCalculation = await calculateBookingPrice(eventId, ticketSelections);

    // Create payment session
    const paymentSession = await createPaymentSession(
      user.uid,
      eventId,
      ticketSelections,
      priceCalculation,
      idempotencyKey
    );

    // Save idempotency result
    const result = {
      sessionId: paymentSession.id,
      amount: paymentSession.amount,
      priceCalculation,
    };
    await saveIdempotencyResult(idempotencyKey, result);

    // Return PayU request payload (mock for now)
    return NextResponse.json({
      success: true,
      sessionId: paymentSession.id,
      amount: paymentSession.amount,
      priceCalculation: {
        subtotal: priceCalculation.subtotal,
        bookingFee: priceCalculation.bookingFee,
        total: priceCalculation.total,
        tickets: priceCalculation.tickets.map((t) => ({
          ticketTypeId: t.ticketTypeId,
          ticketName: t.ticketName,
          price: t.price,
          quantity: t.quantity,
        })),
      },
      // Mock PayU payload
      payuPayload: {
        key: process.env.PAYU_MERCHANT_KEY || "mock_key",
        amount: paymentSession.amount,
        productinfo: `Event Booking - ${eventId}`,
        firstname: "User",
        email: user.email || "",
        phone: "",
        txnid: paymentSession.id,
        surl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment/success`,
        furl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment/failure`,
      },
    });
  } catch (error: any) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate payment" },
      { status: 500 }
    );
  }
}

