# Email Trigger Setup Guide

## Overview

This guide explains how to set up automatic email sending when bookings are confirmed. There are two approaches:

1. **Firebase Cloud Function** (Recommended - True Firestore Trigger)
2. **API Endpoint** (Simpler - Can be called manually or via cron)

---

## Option 1: Firebase Cloud Function (Recommended)

### Why Cloud Functions?

- ✅ True Firestore trigger (runs automatically on document update)
- ✅ Guaranteed execution (even if webhook retries)
- ✅ Fully decoupled from webhook
- ✅ Retryable and scalable

### Setup Steps

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Functions** (if not already done)
   ```bash
   firebase init functions
   ```
   - Select TypeScript
   - Install dependencies

4. **Copy the Function**
   - Copy `functions/onBookingConfirmed.ts` to your `functions/src/index.ts`
   - Or add it as a separate export

5. **Deploy**
   ```bash
   firebase deploy --only functions:onBookingConfirmed
   ```

6. **Verify**
   - Go to Firebase Console → Functions
   - Confirm `onBookingConfirmed` is deployed
   - Test by confirming a booking

### Function Code

See `functions/onBookingConfirmed.ts` for the complete implementation.

---

## Option 2: API Endpoint (Simpler Alternative)

### When to Use

- ✅ Quick setup (no Cloud Functions needed)
- ✅ Can be called manually
- ✅ Works with cron jobs
- ✅ Can be triggered from frontend

### Setup Steps

1. **Endpoint is Already Created**
   - Path: `/api/bookings/send-confirmation-email`
   - Method: POST
   - Body: `{ "bookingId": "..." }`

2. **Call from Webhook** (Optional)
   - Add to webhook handler after booking confirmation
   - Non-blocking (fire and forget)

3. **Call from Frontend** (Optional)
   - After payment success page loads
   - Poll until booking confirmed, then call email endpoint

4. **Set up Cron Job** (Optional)
   - Use Vercel Cron or external service
   - Periodically check for confirmed bookings without emails
   - Call email endpoint for each

### Example: Call from Webhook

```typescript
// In lib/cashfreeWebhookHandler.ts after booking confirmation
// Non-blocking email send
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://movigoo.in";
fetch(`${appUrl}/api/bookings/send-confirmation-email`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ bookingId }),
}).catch((error) => {
  console.error("[Webhook] Email send failed (non-blocking):", error);
});
```

---

## Testing

### Test Email Endpoint Directly

```bash
curl -X POST https://movigoo.in/api/bookings/send-confirmation-email \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "your-booking-id"}'
```

### Verify Email Sent

Check booking document:
```javascript
{
  confirmationEmailSentAt: Timestamp,
  confirmationEmailLastError: null
}
```

---

## Troubleshooting

### Email Not Sending

1. **Check Booking Status**
   - Must be `bookingStatus: "CONFIRMED"`
   - Must be `paymentStatus: "SUCCESS"`

2. **Check Email Already Sent**
   - If `confirmationEmailSentAt` exists, email won't send again

3. **Check User Email**
   - Booking must have `userEmail` or `email` field

4. **Check Logs**
   - Look for `[Email]` entries in Vercel logs
   - Check for error messages

### Cloud Function Not Triggering

1. **Verify Deployment**
   ```bash
   firebase functions:list
   ```

2. **Check Function Logs**
   ```bash
   firebase functions:log
   ```

3. **Verify Trigger**
   - Function should trigger on `bookings/{bookingId}` updates
   - Check Firebase Console → Functions → Logs

---

## Architecture Benefits

✅ **Decoupled**: Email sending doesn't block booking confirmation
✅ **Resilient**: Email failures don't affect booking status
✅ **Retryable**: Can retry email without re-confirming booking
✅ **Scalable**: Handles high volume independently
✅ **Maintainable**: Easy to update email logic without touching webhook

---

## Next Steps

1. Choose your approach (Cloud Function or API)
2. Deploy/setup
3. Test with a real booking
4. Monitor logs for first few days
5. Set up alerts for email failures (optional)

