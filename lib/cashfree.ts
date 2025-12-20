// lib/cashfree.ts
// Cashfree Payment Gateway Integration
// Server-side only - never expose secrets to client

/**
 * Cashfree Payment Session Request
 */
export type CashfreeOrderRequest = {
  order_id: string;
  order_amount: number;
  order_currency: string;
  customer_details: {
    customer_id: string;
    customer_email: string;
    customer_name: string;
    customer_phone: string;
  };
  order_meta: {
    return_url: string;
    notify_url?: string;
  };
};

/**
 * Cashfree API Response
 */
export type CashfreeOrderResponse = {
  status: string;
  message: string;
  payment_session_id?: string;
  order_token?: string;
  order_id?: string;
};

/**
 * Create a Cashfree payment session
 * This function creates an order in Cashfree and returns the payment session ID
 * 
 * @param orderRequest - Order details including amount, customer info, and return URLs
 * @returns Payment session ID for redirect checkout
 */
export async function createCashfreePaymentSession(
  orderRequest: CashfreeOrderRequest
): Promise<{ paymentSessionId: string; orderId: string }> {
  const baseUrl = process.env.CASHFREE_BASE_URL || "https://sandbox.cashfree.com/pg";
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  // Validate environment variables
  if (!appId || !secretKey) {
    throw new Error("Cashfree credentials not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY");
  }

  const url = `${baseUrl}/orders`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01", // Use latest stable API version
        "x-client-id": appId,
        "x-client-secret": secretKey,
      },
      body: JSON.stringify(orderRequest),
    });

    const data = await response.json();

    // Log response for debugging (sandbox only)
    if (process.env.NODE_ENV !== "production" || baseUrl.includes("sandbox")) {
      console.log("Cashfree API Response:", {
        status: response.status,
        orderId: orderRequest.order_id,
        response: data,
      });
    }

    if (!response.ok) {
      throw new Error(
        data.message || `Cashfree API error: ${response.status} ${response.statusText}`
      );
    }

    if (!data.payment_session_id) {
      throw new Error("Cashfree did not return payment_session_id");
    }

    return {
      paymentSessionId: data.payment_session_id,
      orderId: data.order_id || orderRequest.order_id,
    };
  } catch (error: any) {
    console.error("Cashfree payment session creation failed:", {
      orderId: orderRequest.order_id,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get Cashfree checkout URL for redirect
 * 
 * @param paymentSessionId - Payment session ID from createCashfreePaymentSession
 * @returns Checkout URL for redirect
 */
export function getCashfreeCheckoutUrl(paymentSessionId: string): string {
  const baseUrl = process.env.CASHFREE_BASE_URL || "https://sandbox.cashfree.com/pg";
  return `${baseUrl}/checkout/post/submit`;
}

/**
 * Generate unique order ID for Cashfree
 * Format: MOV-{timestamp}-{random}
 */
export function generateOrderId(prefix: string = "MOV"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

