# Cashfree LIVE Deployment Checklist

## ✅ CRITICAL: Environment Variables (Vercel)

Set these **EXACT** environment variables in Vercel Dashboard:

```bash
# Cashfree LIVE Credentials
CASHFREE_APP_ID=LIVE_****
CASHFREE_SECRET_KEY=LIVE_****
CASHFREE_BASE_URL=https://api.cashfree.com/pg

# App Configuration
NEXT_PUBLIC_APP_URL=https://www.movigoo.in

# Firebase (if not already set)
# Add your Firebase credentials here
```

### ⚠️ CRITICAL: DO NOT SET
```bash
# ❌ DO NOT ADD THIS VARIABLE
NEXT_PUBLIC_CASHFREE_MODE=production
```
**Why?** The frontend auto-detects mode from domain. Adding this variable causes conflicts.

---

## ✅ Code Verification Checklist

### 1. Backend Order Creation ✅
**File:** `app/api/payments/cashfree/route.ts`

✅ **Headers are correct:**
```typescript
headers: {
  "x-client-id": process.env.CASHFREE_APP_ID,
  "x-client-secret": process.env.CASHFREE_SECRET_KEY,
  "x-api-version": "2023-08-01",
}
```

✅ **Base URL is correct:**
```typescript
fetch(`${process.env.CASHFREE_BASE_URL}/orders`)
// Resolves to: https://api.cashfree.com/pg/orders
```

✅ **Response is correct:**
```typescript
return NextResponse.json({
  paymentSessionId: data.payment_session_id,
});
```

✅ **Webhook URL is configured:**
```typescript
order_meta: {
  return_url: returnUrl,
  notify_url: `${appUrl}/api/cashfree/webhook`,
}
```

### 2. Frontend SDK Configuration ✅
**File:** `app/payment/page.tsx`

✅ **Mode auto-detection:**
```typescript
const isProduction = typeof window !== "undefined" && 
                    (window.location.hostname === "www.movigoo.in" || 
                     window.location.hostname === "movigoo.in");
const cashfreeMode = isProduction ? "production" : "sandbox";
```

✅ **Checkout call is correct:**
```typescript
cashfree.checkout({
  paymentSessionId: paymentSessionId,
  redirectTarget: "_self",
});
```

### 3. Webhook Handler ✅
**File:** `app/api/cashfree/webhook/route.ts`

✅ Exists and handles:
- `PAYMENT_SUCCESS` → Updates booking to `CONFIRMED`
- `PAYMENT_FAILED` → Updates booking to `FAILED`
- Sends confirmation email on success
- Returns 200 status to prevent retries

---

## 🧪 Testing After Deployment

### Step 1: Verify Environment Variables
1. Deploy to Vercel
2. Check Vercel logs for: `"Cashfree ENV check (prod)"`
3. Confirm all values are `true` and URLs are correct

### Step 2: Make Test Payment
1. Go to `https://www.movigoo.in`
2. Select an event and proceed to payment
3. Use a **real payment method** (₹1 minimum)
4. Complete payment on Cashfree checkout

### Step 3: Verify Success
Check all of these:

✅ **Cashfree Dashboard:**
- Go to: Payments → Transactions
- Find your payment
- Status should be: `SUCCESS`
- Click "Webhook Attempts"
- Verify: Status = `200`

✅ **Firestore:**
- Open Firebase Console → Firestore
- Navigate to: `bookings/{bookingId}`
- Verify fields:
  - `bookingStatus` = `"CONFIRMED"`
  - `paymentStatus` = `"SUCCESS"`
  - `ticketId` exists
  - `confirmedAt` timestamp exists

✅ **Email:**
- Check user's email inbox
- Confirm ticket confirmation email received

---

## 🚨 Troubleshooting

### Error: `payment_session_id_invalid`

**Cause:** SDK mode mismatch between frontend and backend

**Solution:**
1. Verify `CASHFREE_BASE_URL=https://api.cashfree.com/pg` in Vercel
2. Verify frontend detects production mode (check console logs)
3. Clear browser cache and try again

### Error: `Cashfree configuration missing`

**Cause:** Environment variables not set in Vercel

**Solution:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all required variables
3. Redeploy

### Webhook not firing

**Cause:** Webhook URL not whitelisted in Cashfree Dashboard

**Solution:**
1. Go to Cashfree Dashboard → Developers → Webhooks
2. Add webhook URL: `https://www.movigoo.in/api/cashfree/webhook`
3. Save and retry payment

### Booking not updating

**Cause:** `orderId` not stored in booking

**Solution:**
1. Check Vercel logs for: `"Updated booking with orderId"`
2. Verify booking has `orderId` field in Firestore
3. If missing, redeploy latest code

---

## 📋 Pre-Deployment Checklist

Before deploying to production:

- [ ] All environment variables set in Vercel
- [ ] `CASHFREE_BASE_URL` is `https://api.cashfree.com/pg`
- [ ] `NEXT_PUBLIC_APP_URL` is `https://www.movigoo.in`
- [ ] Webhook URL whitelisted in Cashfree Dashboard
- [ ] Return URL whitelisted in Cashfree Dashboard
- [ ] Firebase credentials configured
- [ ] Email service (Resend/SendGrid) configured
- [ ] Test payment completed successfully

---

## 🔒 Security Notes

✅ **Secure:**
- All Cashfree credentials are server-side only
- No secrets exposed to client
- Webhook validates payment server-side
- Frontend redirect is NOT trusted for confirmation

❌ **Never do this:**
- Don't add `NEXT_PUBLIC_` prefix to Cashfree credentials
- Don't trust frontend success callback
- Don't mark booking confirmed before webhook
- Don't hardcode credentials in code

---

## 📞 Support

If issues persist after following this checklist:

1. Check Vercel deployment logs
2. Check Cashfree Dashboard → Payments → Webhook Attempts
3. Check Firebase Console → Firestore for booking status
4. Contact Cashfree support with transaction ID
