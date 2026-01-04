# 🚀 Production Deployment Checklist

## ✅ Architecture Status: COMPLETE

All code changes are **production-ready**:
- ✅ Cashfree payment route uses Admin SDK
- ✅ Webhook handler uses Admin SDK
- ✅ Manual confirm route uses Admin SDK
- ✅ Email endpoint created and decoupled
- ✅ Webhook signature verification improved
- ✅ All TypeScript errors fixed
- ✅ Build completes successfully

---

## 🔴 CRITICAL: Action Required (Not Code)

### Step 1: Configure Cashfree Webhook Secret ⚠️ MOST IMPORTANT

**Problem:** Webhook returns 401 because signature verification fails.

**Root Cause:** Using wrong secret (API secret instead of webhook secret).

**Fix:**

1. **Get Webhook Secret from Cashfree Dashboard**
   - Login: https://dashboard.cashfree.com
   - Go to: **Developers** → **Webhooks**
   - Find: **"Webhook Secret"** or **"Webhook Signing Secret"**
   - ⚠️ This is **DIFFERENT** from your API secret
   - Copy it exactly (no spaces)

2. **Add to Vercel Environment Variables**
   ```
   Name:  CASHFREE_WEBHOOK_SECRET
   Value: [paste webhook secret from Cashfree Dashboard]
   Environment: Production
   ```

3. **Verify Webhook URL in Cashfree Dashboard**
   - Must be exactly: `https://www.movigoo.in/api/cashfree/webhook`
   - No trailing slash
   - Must match production domain

4. **Redeploy**
   - After adding environment variable, **redeploy** your app
   - Environment variables don't hot-reload

**Expected Result:**
- Webhook returns **200 OK** (not 401)
- Booking confirms automatically
- No manual intervention needed

**See:** `docs/WEBHOOK_SECRET_SETUP.md` for detailed guide

---

### Step 2: Verify Webhook Success

**After setting webhook secret, test:**

1. **Make a Test Payment**
   - Complete full payment flow
   - Check Cashfree Dashboard → **Webhook Attempts**

2. **Check Vercel Logs**
   Look for:
   ```
   [Webhook] Using secret for verification: { type: "CASHFREE_WEBHOOK_SECRET" }
   [Webhook] Signature verification: { ... }
   [Webhook] Booking confirmed successfully: [bookingId]
   ```

3. **Verify Booking Status**
   - Check Firestore: `/bookings/{bookingId}`
   - Should show:
     - `bookingStatus: "CONFIRMED"`
     - `paymentStatus: "SUCCESS"`
     - `confirmedAt: [timestamp]`

**If webhook works:**
- ✅ Manual confirm becomes unnecessary
- ✅ Email trigger can work automatically
- ✅ System is fully automated

---

### Step 3: Enable Email Sending (Optional)

**Option A: Firestore Cloud Function (Recommended)**
- Deploy: `docs/firebase-function-example.ts`
- Auto-sends email when booking becomes CONFIRMED
- Fully decoupled and scalable

**Option B: API Endpoint (Simpler)**
- Endpoint: `/api/bookings/send-confirmation-email`
- Can be called manually or via cron
- Already created and ready

**See:** `docs/EMAIL_TRIGGER_SETUP.md` for setup instructions

---

## 📋 Environment Variables Checklist

### Required in Vercel (Production):

```bash
# Cashfree API (for creating orders)
CASHFREE_APP_ID=LIVE_****
CASHFREE_SECRET_KEY=LIVE_****
CASHFREE_BASE_URL=https://api.cashfree.com/pg

# Cashfree Webhook (for signature verification) ⚠️ CRITICAL
CASHFREE_WEBHOOK_SECRET=cf_wh_****  # Different from API secret!

# App Configuration
NEXT_PUBLIC_APP_URL=https://www.movigoo.in

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY={...}  # JSON string

# Firebase Client (if needed)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# ... other Firebase config
```

---

## 🎯 Expected Production Flow

```
1. User completes payment
   ↓
2. Cashfree processes payment
   ↓
3. Cashfree sends webhook → /api/cashfree/webhook
   ↓
4. Webhook verifies signature (using CASHFREE_WEBHOOK_SECRET)
   ↓
5. Webhook updates booking: CONFIRMED + SUCCESS
   ↓
6. Firestore trigger (or API) sends confirmation email
   ↓
7. User receives email automatically
```

**All automatic - no manual steps required!**

---

## ✅ Verification Steps

After deploying:

- [ ] Webhook secret configured in Vercel
- [ ] Webhook URL correct in Cashfree Dashboard
- [ ] Test payment completes successfully
- [ ] Webhook returns 200 (check Cashfree Dashboard)
- [ ] Booking confirms automatically (check Firestore)
- [ ] Email sent (if trigger configured)
- [ ] No manual intervention needed

---

## 🚨 If Webhook Still Fails

1. **Check Logs**
   - Vercel logs: Look for `[Webhook]` entries
   - Cashfree Dashboard: Check webhook attempts

2. **Verify Secret**
   - Logs show: `type: "CASHFREE_WEBHOOK_SECRET"`
   - If shows `CASHFREE_SECRET_KEY` → Add webhook secret

3. **Check Headers**
   - Logs show all signature-related headers
   - Verify `x-webhook-signature` exists

4. **Environment Match**
   - Production webhook secret (not sandbox)
   - Production API keys (not sandbox)

---

## 📚 Documentation

- **Webhook Secret Setup:** `docs/WEBHOOK_SECRET_SETUP.md`
- **Email Trigger Setup:** `docs/EMAIL_TRIGGER_SETUP.md`
- **Firebase Function Example:** `docs/firebase-function-example.ts`

---

## 🎉 Final Status

**Code:** ✅ **PRODUCTION-READY**
- All routes use Admin SDK
- All security rules enforced
- All TypeScript errors fixed
- Build completes successfully

**Configuration:** ⚠️ **ACTION REQUIRED**
- Set `CASHFREE_WEBHOOK_SECRET` in Vercel
- Verify webhook URL in Cashfree Dashboard
- Redeploy after adding environment variable

**Once webhook secret is correct, the system is fully automated!** 🚀

