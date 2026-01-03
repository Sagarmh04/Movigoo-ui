# 🚨 CRITICAL BUGS FOUND - PRE-LAUNCH AUDIT

## EXECUTIVE SUMMARY
**Status:** ⚠️ **2 CRITICAL BUGS FOUND** - Must fix before launch

---

## 🚨 BUG #1: INVENTORY RACE CONDITION (CRITICAL)

**File:** `app/api/bookings/create-pending/route.ts`  
**Lines:** 76-128  
**Severity:** 🔴 **CRITICAL** - Can cause overselling

### Problem:
1. **NOT using Firestore transactions** - Inventory check and booking creation are NOT atomic
2. **Continues on error** - If inventory check fails, booking still proceeds (line 127)
3. **Race condition** - Multiple users can pass inventory check simultaneously

### Current Code:
```typescript
// Lines 76-128
try {
  // Query confirmed bookings (NOT in transaction)
  const confirmedBookingsSnapshot = await getDocs(confirmedBookingsQuery);
  // ... check inventory ...
} catch (inventoryError: any) {
  console.error("Inventory check error:", inventoryError);
  // Continue with booking creation ❌ DANGEROUS
}
```

### Impact:
- **Overselling possible** - Multiple concurrent requests can all pass inventory check
- **Data integrity issue** - Bookings created even when inventory check fails
- **Business risk** - Can sell more tickets than available

### Fix Required:
- Use Firestore `runTransaction` to make inventory check + booking creation atomic
- Abort booking if inventory check fails (remove try-catch that continues)
- Return 409 Conflict if sold out

---

## 🚨 BUG #2: PAYMENT ENDPOINT MISSING EXPLICIT AUTH (MEDIUM)

**File:** `app/api/payments/cashfree/route.ts`  
**Lines:** 15-50  
**Severity:** 🟡 **MEDIUM** - Best practice violation

### Problem:
- No explicit authentication check
- Relies on `bookingId` requiring auth (indirect security)
- Should verify user owns the booking

### Current Code:
```typescript
export async function POST(req: NextRequest) {
  // ❌ No auth check here
  const { bookingId, amount, email, phone } = body;
  // ...
}
```

### Impact:
- **Security risk** - Anyone with a bookingId can create payment sessions
- **Best practice violation** - Should verify user owns booking

### Fix Required:
- Add `verifyAuthToken` check
- Verify `booking.userId === user.uid` before creating payment

---

## ✅ GOOD NEWS - ALREADY FIXED

1. ✅ **Amount validation** - Payment endpoint validates amount against booking (lines 66-76)
2. ✅ **Webhook security** - Signature verification, amount validation, idempotency all working
3. ✅ **Booking creation auth** - Properly requires authentication
4. ✅ **User ID spoofing** - User ID from token, not request body
5. ✅ **Payment confirmation** - Only webhook can confirm (secure)

---

## RECOMMENDATIONS

### IMMEDIATE (Before Launch):
1. **Fix BUG #1** - Implement Firestore transactions for inventory check
2. **Fix BUG #2** - Add explicit auth to payment endpoint

### OPTIONAL (Post-Launch):
- Add monitoring/alerting for inventory mismatches
- Add rate limiting to prevent abuse
- Add logging for security events

---

## CONCLUSION

**Can users bypass payment?** ❌ NO - Webhook protects this  
**Can users oversell tickets?** ⚠️ YES - BUG #1 allows this  
**Ready for launch?** ⚠️ NO - Fix BUG #1 first

**Priority:** Fix BUG #1 immediately, then launch.

