// app/api/payments/cashfree/route.ts
// POST /api/payments/cashfree
// Creates a Cashfree payment session (server-side only)

import { NextRequest, NextResponse } from "next/server";
import { createCashfreePaymentSession, generateOrderId } from "@/lib/cashfree";

/**
 * Request body for creating a payment session
 */
type CreatePaymentRequest = {
  bookingId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  customerId?: string; // Optional: Firebase user ID
};

/**
 * Response containing only the payment session ID (no secrets)
 */
type CreatePaymentResponse = {
  paymentSessionId: string;
  orderId: string;
  checkoutUrl: string;
};

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: CreatePaymentRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate required fields
    const { bookingId, amount, customerEmail, customerName, customerPhone, customerId } = body;

    if (!bookingId || !amount || !customerEmail || !customerName || !customerPhone) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["bookingId", "amount", "customerEmail", "customerName", "customerPhone"],
        },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0 || amount > 10000000) {
      return NextResponse.json(
        { error: "Invalid amount. Must be between 1 and 10,000,000" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Get app URL for return URLs
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://movigoo.in";
    const orderId = generateOrderId();

    // Create Cashfree payment session
    const { paymentSessionId, orderId: cashfreeOrderId } = await createCashfreePaymentSession({
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: customerId || `customer-${Date.now()}`,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `${appUrl}/payment/success?order_id={order_id}&order_token={order_token}`,
        // Webhook URL will be added later for production
        // notify_url: `${appUrl}/api/payments/cashfree/webhook`,
      },
    });

    // Construct checkout URL for Cashfree Redirect Checkout
    const baseUrl = process.env.CASHFREE_BASE_URL || "https://sandbox.cashfree.com/pg";
    const checkoutUrl = `${baseUrl}/checkout/post/submit`;

    // Return only safe data (no secrets)
    const response: CreatePaymentResponse = {
      paymentSessionId,
      orderId: cashfreeOrderId,
      checkoutUrl,
    };

    console.log("Payment session created:", {
      orderId: cashfreeOrderId,
      bookingId,
      amount,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("Error creating payment session:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to create payment session",
      },
      { status: 500 }
    );
  }
}

