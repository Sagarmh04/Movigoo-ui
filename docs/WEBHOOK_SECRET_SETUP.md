# Cashfree Webhook Secret Setup Guide

## 🔴 CRITICAL: Webhook Secret Configuration

Cashfree uses **TWO different secrets**:

1. **API Secret** (`CASHFREE_SECRET_KEY`) - Used for API calls (creating orders)
2. **Webhook Secret** (`CASHFREE_WEBHOOK_SECRET`) - Used for webhook signature verification

### ⚠️ Common Mistake

Using the **API secret** for webhook verification will **ALWAYS fail** with 401 errors.

---

## ✅ Step 1: Get Webhook Secret from Cashfree Dashboard

1. **Login to Cashfree Dashboard**
   - Go to: https://dashboard.cashfree.com
   - Select your **PRODUCTION** account (not sandbox)

2. **Navigate to Webhooks**
   - Go to: **Developers** → **Webhooks**
   - Or: **Settings** → **Webhooks**

3. **Find Webhook Secret**
   - Look for: **"Webhook Secret"** or **"Webhook Signing Secret"**
   - This is **DIFFERENT** from your API secret
   - Copy it exactly (no spaces, no quotes)

4. **Verify Webhook URL**
   - Ensure webhook URL is: `https://www.movigoo.in/api/cashfree/webhook`
   - Must match exactly (no trailing slash)

---

## ✅ Step 2: Set Environment Variable in Vercel

1. **Go to Vercel Dashboard**
   - Your project → **Settings** → **Environment Variables**

2. **Add Webhook Secret**
   ```
   Name:  CASHFREE_WEBHOOK_SECRET
   Value: [paste webhook secret from Cashfree Dashboard]
   Environment: Production (and Preview if needed)
   ```

3. **Keep API Secret Separate**
   ```
   Name:  CASHFREE_SECRET_KEY
   Value: [your API secret - different from webhook secret]
   ```

4. **Redeploy**
   - After adding environment variable, **redeploy** your app
   - Environment variables don't hot-reload

---

## ✅ Step 3: Verify Configuration

### Check Logs After Webhook Call

Look for this log entry:
```
[Webhook] Using secret for verification: {
  type: "CASHFREE_WEBHOOK_SECRET",  ← Should show this
  secretLength: 64,                  ← Length may vary
  secretPrefix: "cf_wh..."           ← First few chars
}
```

### If You See:
```
type: "CASHFREE_SECRET_KEY"  ← Wrong! Using API secret
```

**Fix:** Add `CASHFREE_WEBHOOK_SECRET` environment variable.

---

## ✅ Step 4: Test Webhook

1. **Make a Test Payment**
   - Complete a payment flow
   - Check Cashfree Dashboard → **Webhook Attempts**

2. **Check Vercel Logs**
   - Look for: `[Webhook] Signature verification:`
   - Should show: `signatureReceived` and `signatureExpected` match

3. **Expected Result**
   - Status: **200 OK** (not 401)
   - Booking status: **CONFIRMED**
   - Payment status: **SUCCESS**

---

## 🚨 Troubleshooting

### Issue: Still Getting 401 After Setting Webhook Secret

**Check:**
1. ✅ Webhook secret copied correctly (no extra spaces)
2. ✅ Environment variable name is exactly `CASHFREE_WEBHOOK_SECRET`
3. ✅ Redeployed after adding environment variable
4. ✅ Using PRODUCTION webhook secret (not sandbox)
5. ✅ Webhook URL in Cashfree Dashboard matches exactly

**Debug:**
- Check logs for `[Webhook] Using secret for verification`
- Verify `type` shows `CASHFREE_WEBHOOK_SECRET`
- Compare `signatureReceived` vs `signatureExpected` (first 20 chars)

### Issue: Can't Find Webhook Secret in Dashboard

**Possible Locations:**
- Developers → Webhooks → Webhook Settings
- Settings → Webhooks → Webhook Secret
- API Keys section (separate from API secret)

**If Still Not Found:**
- Contact Cashfree support
- Ask for "Webhook Signing Secret" or "Webhook Secret Key"

---

## 📋 Quick Checklist

- [ ] Logged into Cashfree Dashboard (PRODUCTION)
- [ ] Found Webhook Secret (different from API secret)
- [ ] Copied webhook secret exactly (no spaces)
- [ ] Added `CASHFREE_WEBHOOK_SECRET` to Vercel
- [ ] Redeployed application
- [ ] Verified webhook URL: `https://www.movigoo.in/api/cashfree/webhook`
- [ ] Tested payment and checked logs
- [ ] Webhook returns 200 (not 401)
- [ ] Booking confirms automatically

---

## 🎯 Expected Flow After Fix

```
1. Payment Success
   ↓
2. Cashfree sends webhook
   ↓
3. Webhook verifies signature (using CASHFREE_WEBHOOK_SECRET)
   ↓
4. Returns 200 OK
   ↓
5. Booking status → CONFIRMED
   ↓
6. Email sent automatically (if trigger configured)
```

---

**Once webhook secret is correct, everything else works automatically!** ✅

