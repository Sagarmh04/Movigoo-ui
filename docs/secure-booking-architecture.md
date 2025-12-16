# Secure Booking Architecture Documentation

## Overview

This document describes the secure server-side booking architecture implemented for Movigoo, following BookMyShow-style security practices.

## Architecture Principles

1. **Client = UI Only**: All business logic, price calculations, and data writes happen on the server
2. **Server = Truth Source**: Server validates all inputs, calculates prices from Firestore, and creates bookings
3. **No Client-Side Trust**: Client cannot modify prices, quantities, or create bookings directly
4. **Idempotency**: Duplicate requests are prevented using idempotency keys
5. **Secure Token Generation**: QR tokens and booking IDs are generated server-side only

## API Endpoints

### 1. POST /api/payments/initiate

**Purpose**: Create a payment session with server-validated prices

**Request**:
```json
{
  "eventId": "event123",
  "ticketSelections": [
    {
      "ticketTypeId": "ticket1",
      "quantity": 2
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "sessionId": "payment-session-uuid",
  "amount": 500,
  "priceCalculation": {
    "subtotal": 400,
    "bookingFee": 100,
    "total": 500,
    "tickets": [...]
  },
  "payuPayload": {...}
}
```

**Security**:
- Requires Firebase Auth token
- Fetches ticket prices from Firestore (never trusts client)
- Validates ticket availability
- Creates idempotency key to prevent duplicates
- Generates payment session with TTL (15 minutes)

### 2. POST /api/payments/verify

**Purpose**: Verify payment and create booking securely

**Request**:
```json
{
  "paymentSessionId": "payment-session-uuid",
  "paymentResponse": {...}
}
```

**Response**:
```json
{
  "success": true,
  "bookingId": "booking-uuid",
  "qrToken": "MOV-XXXXXXXX",
  "eventId": "event123"
}
```

**Security**:
- Requires Firebase Auth token
- Verifies payment session exists and belongs to user
- Checks idempotency to prevent duplicate bookings
- Verifies payment with PayU (mock for now)
- Creates booking in Firestore at `/users/{uid}/bookings/{bookingId}`
- Generates secure QR token server-side

### 3. POST /api/bookings/lookup

**Purpose**: Get user's bookings securely

**Request**:
```json
{
  "limit": 50
}
```

**Response**:
```json
{
  "success": true,
  "bookings": [...]
}
```

**Security**:
- Requires Firebase Auth token
- Only returns bookings for authenticated user
- No client-side filtering needed

## Server Utilities

### lib/priceCalculator.ts

- `calculateBookingPrice()`: Fetches event from Firestore, validates ticket types, calculates prices server-side
- Never trusts client-provided prices
- Validates ticket availability
- Calculates booking fee (₹7 per ticket)

### lib/payments.ts

- `createPaymentSession()`: Creates payment session with idempotency
- `getPaymentSession()`: Retrieves payment session (validates expiration)
- `markPaymentSessionCompleted()`: Marks session as completed

### lib/createBooking.ts

- `createBooking()`: Creates booking document in Firestore
- Generates secure QR token using UUID
- Fetches event details from Firestore
- Saves to `/users/{uid}/bookings/{bookingId}`

### lib/idempotency.ts

- `checkIdempotency()`: Checks if request was already processed
- `saveIdempotencyResult()`: Saves idempotency result
- `generateIdempotencyKey()`: Generates unique key per request
- TTL: 5 minutes

### lib/auth.ts

- `verifyAuthToken()`: Verifies Firebase ID token
- Currently uses JWT decoding (TODO: upgrade to firebase-admin)
- Validates token expiration and audience

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Events - public read, no client writes
    match /events/{eventId} {
      allow read: if true;
      allow write: if false; // Only server API
    }
    
    // Bookings - read own, no client writes
    match /users/{uid}/bookings/{bookingId} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false; // Only server API
    }
    
    // Payment sessions - no client access
    match /paymentSessions/{sessionId} {
      allow read: if false;
      allow write: if false; // Only server API
    }
    
    // Idempotency - no client access
    match /idempotency/{key} {
      allow read: if false;
      allow write: if false; // Only server API
    }
  }
}
```

## Client Flow

### Step 1: Event Details
- Display event information
- "Book Now" button

### Step 2: Ticket Selection
- User selects tickets (client-side UI only)
- On "Proceed", calls `/api/payments/initiate`
- Server validates prices and creates payment session
- Client stores server-validated prices in localStorage

### Step 3: Review
- Display server-validated price summary
- "Login to Proceed" button
- After login, navigate to payment

### Step 4: Payment
- Show PayU payment UI (mock)
- "Simulate Successful Payment" button
- Calls `/api/payments/verify`
- Server verifies payment and creates booking
- Navigate to confirmation

### Step 5: Confirmation
- Display booking confirmation with QR code
- QR token from server (never client-generated)
- All data from Firestore

## Security Features

✅ **Price Validation**: All prices fetched from Firestore, never trusted from client
✅ **Idempotency**: Duplicate bookings prevented
✅ **Token Verification**: Firebase Auth tokens verified on server
✅ **Secure QR Generation**: QR tokens generated server-side using UUID
✅ **Firestore Rules**: Client writes blocked for bookings
✅ **Payment Verification**: Payment status verified before booking creation
✅ **Session Management**: Payment sessions with TTL and expiration

## Firestore Collections

### `/events/{eventId}`
- Event details
- Ticket types and prices
- Public read, server write only

### `/users/{uid}/bookings/{bookingId}`
- User bookings
- Contains: eventId, ticketType, quantity, price, bookingFee, totalAmount, qrToken, etc.
- User read own, server write only

### `/paymentSessions/{sessionId}`
- Payment session data
- Contains: userId, eventId, ticketSelections, amount, status, idempotencyKey
- No client access

### `/idempotency/{key}`
- Idempotency results
- Prevents duplicate processing
- No client access

## Migration Notes

### Removed Client-Side Logic:
- ❌ Direct Firestore writes for bookings
- ❌ Client-side price calculations
- ❌ Client-generated QR tokens
- ❌ Client-generated booking IDs

### Added Server-Side Logic:
- ✅ API endpoints for payment initiation
- ✅ API endpoints for payment verification
- ✅ Server-side price validation
- ✅ Server-side booking creation
- ✅ Idempotency system
- ✅ Secure token generation

## Production Checklist

- [ ] Upgrade `lib/auth.ts` to use firebase-admin `verifyIdToken()`
- [ ] Implement real PayU payment verification in `verifyPaymentWithPayU()`
- [ ] Add rate limiting to API endpoints
- [ ] Add request logging and monitoring
- [ ] Set up Firebase Admin SDK with service account
- [ ] Deploy Firestore security rules
- [ ] Add error handling and retry logic
- [ ] Add unit tests for server utilities
- [ ] Add integration tests for API endpoints

## Environment Variables

Required for server-side:
```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
# ... other Firebase config

# Optional: For firebase-admin
FIREBASE_SERVICE_ACCOUNT_KEY={...} # JSON string
```

## Testing

1. **Test Price Validation**: Try to modify prices in client - should be rejected
2. **Test Idempotency**: Submit same request twice - should return same result
3. **Test Auth**: Try without token - should be rejected
4. **Test Firestore Rules**: Try to write booking from client - should be blocked
5. **Test Payment Flow**: Complete full booking flow end-to-end

