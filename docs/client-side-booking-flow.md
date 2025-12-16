# Client-Side Booking Flow Documentation

## Overview

The Movigoo booking system is now **fully client-side**, using only Firebase Firestore and Firebase Auth. No external APIs or backend routes are used.

## Architecture

- **Client-Side Only**: All booking logic runs in the browser
- **Firebase Firestore**: Direct writes to `bookings/{bookingId}` collection
- **Firebase Auth**: Google, Email, and Mobile authentication
- **No Backend APIs**: Removed all `/api/` routes and external API calls

## Booking Flow (3 Steps)

### Step 1: Event Details (`/event/[eventId]`)

**Features:**
- Event title, poster, date, time, duration
- Venue details with location icon
- Genres and description
- "Book Now" button (mobile responsive, not hidden behind navbar)

**Navigation:**
- Clicking "Book Now" saves initial state and navigates to `/event/[eventId]/tickets`

### Step 2: Select Tickets (`/event/[eventId]/tickets`)

**Features:**
- Fetches ticket types from `event.tickets.venueConfigs[].ticketTypes[]`
- Shows each ticket option (VIP, Gold, Solo, Group of 3, etc.)
- User selects quantity with +/- buttons
- Shows subtotal = price × quantity
- Adds Movigoo booking fee = ₹7 per ticket
- Shows total amount
- Sticky bottom bar on mobile with total and "Proceed to Review" button

**Navigation:**
- Clicking "Proceed to Review" navigates to `/event/[eventId]/review`

### Step 3: Review & Payment (`/event/[eventId]/review` → `/event/[eventId]/payment`)

**Review Page:**
- Complete review showing:
  - Event Name
  - Date & Time
  - Venue
  - Ticket Type + Quantity
  - Subtotal
  - Booking Fee (₹7 per ticket)
  - Total payable
- "Login to Continue" button
- Login modal with Firebase Auth options (Google, Email, Mobile)

**Payment Page:**
- After login, shows payment simulator
- "Simulate Successful Payment" button
- Payment instantly succeeds locally (no external API)
- Creates booking directly in Firestore

**Navigation:**
- After payment → `/event/[eventId]/confirmation?bookingId=...&qrCode=...`

## Booking Confirmation (`/event/[eventId]/confirmation`)

**Features:**
- Premium booking success card
- Event image
- Event title
- Date & time
- Venue
- Ticket type & quantity
- Total paid
- Big premium-looking QR code
- "Download Ticket" button
- "View My Bookings" button

## Firestore Structure

### Bookings Collection: `bookings/{bookingId}`

```typescript
{
  userId: string;
  eventId: string;
  eventTitle: string;
  coverUrl: string;
  venueName: string;
  date: string;
  time: string;
  ticketType: string;
  quantity: number;
  price: number;
  bookingFee: number;
  totalAmount: number;
  createdAt: Timestamp;
  qrCodeData: string; // Unique ID for QR code
}
```

## Key Files

### Client-Side Services

- **`lib/bookingService.ts`**: Client-side booking service
  - `calculateBookingTotals()`: Calculate subtotal, booking fee, total
  - `createBooking()`: Create booking in Firestore
  - `getBookingById()`: Fetch booking by ID
  - `getUserBookings()`: Get all user bookings

### Pages

- **`app/event/[eventId]/page.tsx`**: Step 1 - Event Details
- **`app/event/[eventId]/tickets/page.tsx`**: Step 2 - Ticket Selection
- **`app/event/[eventId]/review/page.tsx`**: Step 3 - Review & Login
- **`app/event/[eventId]/payment/page.tsx`**: Payment Simulation
- **`app/event/[eventId]/confirmation/page.tsx`**: Booking Confirmation

### Components

- **`components/booking/StepIndicator.tsx`**: 3-step progress indicator
- **`components/booking/EventDetailsSection.tsx`**: Event information display
- **`components/booking/TicketSelectionCard.tsx`**: Ticket card with quantity selector
- **`components/booking/ReviewSummary.tsx`**: Booking summary
- **`components/booking/LoginModal.tsx`**: Firebase Auth login modal
- **`components/booking/PaymentSimulator.tsx`**: Payment simulation UI
- **`components/booking/BookingConfirmationCard.tsx`**: Confirmation card with QR code

### Hooks

- **`hooks/useCurrentUser.ts`**: Firebase Auth user hook
- **`hooks/useEventById.ts`**: Fetch event by ID from Firestore

## Removed/Deprecated

- ❌ All `/api/` routes (payments, bookings)
- ❌ `lib/apiClient.ts` (no longer needed)
- ❌ External API calls (all removed - using local Next.js API routes only)
- ❌ Server-side booking logic
- ❌ Payment session management

## Mobile Layout Fixes

- ✅ Book Now button not hidden behind navbar (z-index: 50)
- ✅ Sticky bottom bars with proper padding
- ✅ Responsive spacing and typography
- ✅ Safe area padding for notched devices

## Security Notes

⚠️ **Important**: This is a client-side implementation. For production:

1. **Firestore Security Rules**: Ensure proper rules are set:
   ```javascript
   match /bookings/{bookingId} {
     allow read: if request.auth != null && request.auth.uid == resource.data.userId;
     allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
     allow update, delete: if false;
   }
   ```

2. **Price Validation**: Currently prices are calculated client-side. For production, consider:
   - Server-side validation via Cloud Functions
   - Or validate prices against Firestore before creating booking

3. **QR Code Security**: QR codes are generated client-side. For production:
   - Generate QR tokens server-side
   - Use secure random generation
   - Validate QR codes on entry

## Testing

1. **Test Booking Flow**:
   - Navigate to event → Select tickets → Review → Login → Payment → Confirmation
   - Verify booking appears in Firestore
   - Verify QR code displays correctly

2. **Test Mobile Layout**:
   - Check Book Now button visibility
   - Test sticky bottom bars
   - Verify no overflow issues

3. **Test Firebase Auth**:
   - Test Google login
   - Test email/password (if implemented)
   - Test mobile login (if implemented)

## Future Enhancements

- [ ] Server-side price validation via Cloud Functions
- [ ] Real payment gateway integration (PayU, Razorpay)
- [ ] Email confirmation sending
- [ ] PDF ticket generation
- [ ] Booking cancellation/refund
- [ ] Promo code support
- [ ] Seat selection (if applicable)

