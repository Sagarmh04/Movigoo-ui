// app/api/payments/cashfree/route.ts
// POST /api/payments/cashfree
// Creates a Cashfree payment session (server-side only)

import { NextRequest, NextResponse } from "next/server";

// CRITICAL: Force Node.js runtime (not Edge) for Vercel deployment
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // STEP 2: Harden env var access (Vercel-safe)
    if (
      !process.env.CASHFREE_APP_ID ||
      !process.env.CASHFREE_SECRET_KEY ||
      !process.env.CASHFREE_BASE_URL
    ) {
      console.error("❌ Missing Cashfree env vars on Vercel");
      return NextResponse.json(
        { error: "Cashfree configuration missing" },
        { status: 500 }
      );
    }

    // Log env var presence (NO values for security)
    console.log("Cashfree env check:", {
      hasAppId: !!process.env.CASHFREE_APP_ID,
      hasSecret: !!process.env.CASHFREE_SECRET_KEY,
      baseUrl: process.env.CASHFREE_BASE_URL,
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    });

    const body = await req.json();
    const { bookingId, amount, email, phone } = body;

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    const orderId = `order_${Date.now()}`;

    const payload = {
      order_id: orderId,
      order_amount: Number(amount),
      order_currency: "INR",
      customer_details: {
        customer_id: bookingId || orderId,
        customer_email: email || "test@movigoo.in",
        customer_phone: phone || "9999999999",
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?order_id=${orderId}`,
      },
    };

    const baseUrl = process.env.CASHFREE_BASE_URL || "https://sandbox.cashfree.com/pg";
    const response = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_APP_ID!,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Cashfree error:", data);
      return NextResponse.json(
        { error: data.message || "Cashfree order failed" },
        { status: 400 }
      );
    }

    // CRITICAL: Extract payment_session_id exactly as returned by Cashfree
    // Use data.payment_session_id (snake_case) - NOT data.paymentSessionId
    const paymentSessionId = data.payment_session_id;

    if (!paymentSessionId) {
      console.error("Cashfree response missing payment_session_id:", data);
      return NextResponse.json(
        { error: "Cashfree did not return payment_session_id" },
        { status: 500 }
      );
    }

    // Log raw value for debugging
    console.log("Cashfree payment_session_id (raw):", paymentSessionId);
    console.log("Type:", typeof paymentSessionId);
    console.log("Length:", paymentSessionId.length);

    // CRITICAL: Return EXACT payment_session_id without any modification
    // No concatenation, no template literals, no mutation
    return NextResponse.json({
      paymentSessionId: paymentSessionId,
    });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
