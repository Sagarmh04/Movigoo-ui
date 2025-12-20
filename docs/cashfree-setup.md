# Cashfree Payment Gateway Setup

This document describes how to configure Cashfree Redirect Checkout for Movigoo.

## Environment Variables

Add these variables to your `.env.local` file (or production environment):

```bash
# Cashfree Configuration (Sandbox)
CASHFREE_APP_ID=your_sandbox_app_id
CASHFREE_SECRET_KEY=your_sandbox_secret_key
CASHFREE_BASE_URL=https://sandbox.cashfree.com/pg

# App URL (for return URLs)
NEXT_PUBLIC_APP_URL=https://movigoo.in
```

⚠️ **IMPORTANT**: 
- Do NOT prefix Cashfree keys with `NEXT_PUBLIC_`
- These are server-side only secrets
- Never expose these to client-side code

## Production Configuration

When switching to production, update these environment variables:

```bash
# Cashfree Configuration (Production)
CASHFREE_APP_ID=your_production_app_id
CASHFREE_SECRET_KEY=your_production_secret_key
CASHFREE_BASE_URL=https://api.cashfree.com/pg
```

## How It Works

1. **Payment Initiation**: User clicks "Pay" and is redirected to `/payment?bookingId=...&amount=...&email=...&name=...`

2. **Backend Creates Session**: The `/api/payments/cashfree` route creates a Cashfree order and returns a `paymentSessionId`

3. **Redirect to Cashfree**: Client submits a form to Cashfree's hosted checkout with the `paymentSessionId`

4. **Payment Processing**: User completes payment on Cashfree's secure checkout page

5. **Redirect Back**: Cashfree redirects user to:
   - Success: `/payment/success?order_id=...&order_token=...`
   - Failure: `/payment/failed?order_id=...&error=...`

## Payment Flow

```
User → /payment → API creates session → Cashfree Checkout → Success/Failure Page
```

## Security

- ✅ All Cashfree API calls are server-side only
- ✅ No secrets exposed to client
- ✅ Payment session ID is the only client-visible data
- ✅ Order verification will be done via webhooks (future implementation)

## Testing in Sandbox

1. Use test card numbers provided by Cashfree
2. Use test UPI IDs for UPI payments
3. No real money is charged
4. All transactions are simulated

## Webhook Integration (Future)

For production, you'll need to:

1. Set up a webhook endpoint at `/api/payments/cashfree/webhook`
2. Verify webhook signatures
3. Update booking status based on webhook events
4. Send confirmation emails only after webhook confirmation

## API Reference

- [Cashfree Documentation](https://docs.cashfree.com/)
- [Redirect Checkout Guide](https://docs.cashfree.com/payments/web-integration/redirect-checkout)

