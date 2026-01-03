# 🔧 WEBHOOK TROUBLESHOOTING GUIDE
## Payment Confirmation Not Working - Diagnostic Steps

**Issue:** Payment successful but booking not confirming, no email sent

---

## ✅ STEP 1: Verify Webhook URL Configuration

### In Your Code (app/api/payments/cashfree/route.ts):
```typescript
notify_url: `${appUrl}/api/cashfree/webhook`
```

Where `appUrl` = `process.env.NEXT_PUBLIC_APP_URL` or `"https://movigoo.in"`

**Expected URL:** `https://www.movigoo.in/api/cashfree/webhook`

### In Cashfree Dashboard:
1. Go to: **Developers → Webhooks**
2. Check the **NOTIFY_URL** field
3. **It MUST match:** `https://www.movigoo.in/api/cashfree/webhook`

**If it doesn't match:**
- Update Cashfree Dashboard webhook URL to match
- OR update code to match Cashfree Dashboard URL

---

## ✅ STEP 2: Check Webhook Events

In Cashfree Dashboard, verify:
- ✅ **Event:** `success payment` (or `PAYMENT_SUCCESS`)
- ✅ **Policy:** DEFAULT
- ✅ **API Version:** 2023-08-01

**If missing:**
- Add the webhook event in Cashfree Dashboard
- Ensure it's enabled

---

## ✅ STEP 3: Check Webhook Delivery

### In Cashfree Dashboard:
1. Go to: **Payments → Transactions**
2. Find your payment transaction
3. Click **"Webhook Attempts"**
4. Check:
   - ✅ Status code (should be 200)
   - ✅ Response time
   - ✅ Any error messages

**If webhook not being sent:**
- Check if payment is actually successful
- Verify webhook URL is whitelisted
- Check Cashfree account status

**If webhook returning error:**
- Check Vercel logs for the error
- Verify signature verification
- Check database connection

---

## ✅ STEP 4: Check Vercel Logs

### Look for these log entries:

1. **Webhook Received:**
   ```
   [Webhook] Received webhook request
   ```

2. **Payload Details:**
   ```
   [Webhook] Payload received { order_id: "...", payment_status: "..." }
   ```

3. **Booking Found:**
   ```
   [Webhook] Found booking { bookingId: "...", currentBookingStatus: "..." }
   ```

4. **Confirmation:**
   ```
   [Webhook] Confirming booking: ...
   [Webhook] Booking confirmed successfully: ...
   ```

**If logs show errors:**
- Check the specific error message
- Verify environment variables
- Check database connection

---

## ✅ STEP 5: Verify Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

**Required:**
- ✅ `CASHFREE_SECRET_KEY` (for signature verification)
- ✅ `CASHFREE_APP_ID`
- ✅ `CASHFREE_BASE_URL` = `https://api.cashfree.com/pg`
- ✅ `NEXT_PUBLIC_APP_URL` = `https://www.movigoo.in`

**Test:**
```bash
# Check if webhook can verify signatures
# If CASHFREE_SECRET_KEY is wrong, webhook will reject all requests
```

---

## ✅ STEP 6: Test Webhook Manually

### Option 1: Use Cashfree Test Webhook
1. Go to Cashfree Dashboard → Developers → Webhooks
2. Click **"Test"** button
3. Check if webhook receives test event
4. Check Vercel logs for `[Webhook]` entries

### Option 2: Check Recent Payments
1. Make a test payment
2. Immediately check:
   - Cashfree Dashboard → Webhook Attempts
   - Vercel logs
   - Firestore booking status

---

## ✅ STEP 7: Verify Booking Has orderId

**Check Firestore:**
1. Go to Firebase Console → Firestore
2. Find booking document
3. Verify it has `orderId` field
4. Verify `orderId` matches Cashfree order ID

**If orderId missing:**
- Booking was created before payment session
- Check `/api/payments/cashfree` route logs
- Verify `orderId` is being saved

---

## ✅ STEP 8: Check Payment Status Detection

The webhook checks for these success statuses:
- `SUCCESS`
- `PAID`
- `PAYMENT_SUCCESS`
- `COMPLETED`
- `SUCCESSFUL`

**If Cashfree sends different status:**
- Check webhook logs for actual `payment_status` value
- Update `isPaymentSuccess()` function if needed

---

## 🚨 COMMON ISSUES & FIXES

### Issue 1: Webhook URL Mismatch
**Symptom:** Webhook never received  
**Fix:** Update Cashfree Dashboard webhook URL to match code

### Issue 2: Signature Verification Failing
**Symptom:** Webhook returns 401  
**Fix:** Verify `CASHFREE_SECRET_KEY` is correct in Vercel

### Issue 3: Booking Not Found
**Symptom:** Webhook logs "No booking found for orderId"  
**Fix:** Verify `orderId` is saved in booking document

### Issue 4: Payment Status Not Recognized
**Symptom:** Payment successful but webhook doesn't confirm  
**Fix:** Check actual `payment_status` value in logs, update detection logic

### Issue 5: Webhook Not Being Called
**Symptom:** No webhook attempts in Cashfree Dashboard  
**Fix:** 
- Verify webhook is enabled in Cashfree Dashboard
- Check if payment is actually successful
- Verify webhook URL is whitelisted

---

## 🔍 DEBUGGING CHECKLIST

- [ ] Webhook URL in Cashfree Dashboard matches code
- [ ] Webhook event "success payment" is enabled
- [ ] `CASHFREE_SECRET_KEY` is set correctly in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` is set to production URL
- [ ] Booking has `orderId` field in Firestore
- [ ] Webhook attempts show in Cashfree Dashboard
- [ ] Vercel logs show `[Webhook]` entries
- [ ] Payment status is one of the recognized success values
- [ ] Database connection is working
- [ ] Email service is configured

---

## 📞 NEXT STEPS

1. **Check Cashfree Dashboard → Webhook Attempts**
   - See if webhooks are being sent
   - Check response codes
   - Look for error messages

2. **Check Vercel Logs**
   - Look for `[Webhook]` log entries
   - Check for any errors
   - Verify webhook is being received

3. **Test Payment Again**
   - Make a new test payment
   - Monitor both Cashfree Dashboard and Vercel logs
   - Check if webhook is called

4. **If Still Not Working:**
   - Share Cashfree webhook attempt details
   - Share Vercel log entries
   - We can debug further

---

**The polling mechanism I added will help - the success page now waits up to 30 seconds for webhook confirmation!**

