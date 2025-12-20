// app/api/payments/cashfree/route.ts
// POST /api/payments/cashfree
// Creates a Cashfree payment session (server-side only)

import { NextRequest, NextResponse } from "next/server";

// ✅ STEP 1 — FORCE NODE RUNTIME (CRITICAL)
// Vercel may run this route in Edge runtime
// Cashfree order creation fails silently on Edge
// Localhost always uses Node → that's why it works
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // ✅ STEP 2 — HARD VERIFY ENV VARS (PRODUCTION SAFE)
    // Log BEFORE using env vars (⚠️ Do NOT log actual secrets)
    console.log("Cashfree ENV check (prod):", {
      hasAppId: !!process.env.CASHFREE_APP_ID,
      hasSecret: !!process.env.CASHFREE_SECRET_KEY,
      baseUrl: process.env.CASHFREE_BASE_URL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    });

    // Validate environment variables
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

    const body = await req.json();
    const { bookingId, amount, email, phone } = body;

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    const orderId = `order_${Date.now()}`;

    // ✅ STEP 3 — ENSURE CORRECT BASE URL
    // Confirm this line exists exactly (no trailing slash, no spaces, no quotes)
    const CASHFREE_BASE = process.env.CASHFREE_BASE_URL;
    if (!CASHFREE_BASE) {
      return NextResponse.json(
        { error: "CASHFREE_BASE_URL not configured" },
        { status: 500 }
      );
    }

    // ✅ STEP 4 — DOMAIN MUST MATCH RETURN URL
    // Ensure order payload uses movigoo.in (not vercel.app, localhost, or preview URLs)
    // Cashfree validates this against whitelisted domains
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://movigoo.in";
    const returnUrl = `${appUrl}/payment/success?order_id=${orderId}`;

    console.log("Creating Cashfree payment session...");
    console.log("Return URL:", returnUrl);

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
        return_url: returnUrl,
      },
    };
    const response = await fetch(`${CASHFREE_BASE}/orders`, {
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
    console.log("RAW paymentSessionId:", paymentSessionId);
    console.log("Opening Cashfree checkout");

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
