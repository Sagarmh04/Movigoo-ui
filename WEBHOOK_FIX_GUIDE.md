# 🔧 WEBHOOK FIX - Step by Step Guide

## 🚨 CRITICAL: Verify Webhook URL Match

### **In Your Code:**
The code sends: `https://www.movigoo.in/api/cashfree/webhook`

### **In Cashfree Dashboard:**
Your NOTIFY_URL **MUST match exactly**: `https://www.movigoo.in/api/cashfree/webhook`

**Action Required:**
1. Go to Cashfree Dashboard → Developers → Webhooks
2. Check the NOTIFY_URL field
3. **If it's different, update it to:** `https://www.movigoo.in/api/cashfree/webhook`
4. Save and test again

---

## ✅ What I Fixed

### 1. **Webhook URL Fixed**
- Changed from `/api/payments/cashfree/webhook` to `/api/cashfree/webhook`
- Now matches the actual webhook handler route

### 2. **Added Comprehensive Logging**
- Webhook now logs every step
- Check Vercel logs for `[Webhook]` entries
- Will show exactly what's happening

### 3. **Added Polling + Manual Reconciliation**
- Payment success page polls for 30 seconds
- If webhook doesn't confirm, automatically tries manual reconciliation
- Checks Cashfree API directly and confirms booking

---

## 🔍 How to Debug

### Step 1: Check Cashfree Dashboard
1. Go to: **Payments → Transactions**
2. Find your payment
3. Click **"Webhook Attempts"**
4. Check:
   - ✅ Is webhook being sent? (should see attempts)
   - ✅ What's the response code? (should be 200)
   - ✅ Any error messages?

### Step 2: Check Vercel Logs
Look for these log entries:
```
[Webhook] Received webhook request
[Webhook] Payload received { order_id: "...", payment_status: "..." }
[Webhook] Found booking { bookingId: "..." }
[Webhook] Confirming booking: ...
[Webhook] Booking confirmed successfully: ...
```

**If you don't see `[Webhook] Received webhook request`:**
- Webhook is not being called
- Check Cashfree Dashboard webhook URL
- Verify webhook is enabled

**If you see errors:**
- Check the specific error message
- Verify `CASHFREE_SECRET_KEY` is correct
- Check database connection

### Step 3: Test Payment Flow
1. Make a test payment
2. On success page, it will:
   - Poll for webhook confirmation (up to 30 seconds)
   - If webhook doesn't arrive, try manual reconciliation
   - Should confirm automatically

---

## 🎯 Most Likely Issues

### Issue 1: Webhook URL Mismatch
**Symptom:** No webhook attempts in Cashfree Dashboard  
**Fix:** Update Cashfree Dashboard webhook URL to: `https://www.movigoo.in/api/cashfree/webhook`

### Issue 2: Webhook Not Enabled
**Symptom:** No webhook attempts  
**Fix:** Enable webhook in Cashfree Dashboard → Developers → Webhooks

### Issue 3: Signature Verification Failing
**Symptom:** Webhook returns 401  
**Fix:** Verify `CASHFREE_SECRET_KEY` in Vercel matches Cashfree Dashboard

### Issue 4: orderId Not Saved
**Symptom:** Webhook logs "No booking found for orderId"  
**Fix:** Check Firestore - booking should have `orderId` field

---

## ✅ Quick Checklist

- [ ] Cashfree Dashboard webhook URL = `https://www.movigoo.in/api/cashfree/webhook`
- [ ] Webhook event "success payment" is enabled
- [ ] `CASHFREE_SECRET_KEY` is correct in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` = `https://www.movigoo.in` in Vercel
- [ ] Booking has `orderId` field in Firestore
- [ ] Webhook attempts show in Cashfree Dashboard
- [ ] Vercel logs show `[Webhook]` entries

---

## 🚀 What Happens Now

**With the fixes:**
1. Payment completes → User redirected to success page
2. Success page polls booking status every 2 seconds
3. If webhook confirms → Shows success immediately
4. If webhook delayed → Waits up to 30 seconds
5. If webhook fails → Tries manual reconciliation automatically
6. Manual reconciliation checks Cashfree API directly
7. If payment successful → Confirms booking automatically

**Result:** Bookings should confirm even if webhook is delayed or fails!

---

## 📞 Next Steps

1. **Deploy the fixes** (webhook URL + polling + reconciliation)
2. **Verify webhook URL** in Cashfree Dashboard matches
3. **Test a payment** and watch:
   - Cashfree Dashboard → Webhook Attempts
   - Vercel logs for `[Webhook]` entries
   - Payment success page behavior

The automatic reconciliation should handle webhook delays/failures!

