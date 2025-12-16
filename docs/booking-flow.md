# Complete 5-Step Booking Flow Documentation

## Overview

A complete, premium booking flow with 5 steps: Event Details → Ticket Selection → Review → Login → Payment → Confirmation with QR Code.

## File Structure

### Pages (App Router)

1. **`app/event/[eventId]/page.tsx`** - Step 1: Event Details
2. **`app/event/[eventId]/tickets/page.tsx`** - Step 2: Ticket Selection
3. **`app/event/[eventId]/review/page.tsx`** - Step 3: Review Before Payment
4. **`app/event/[eventId]/payment/page.tsx`** - Step 4: Payment Screen
5. **`app/event/[eventId]/confirmation/page.tsx`** - Step 5: Booking Confirmation

### Components

1. **`components/booking/StepIndicator.tsx`** - 3-step progress indicator
2. **`components/booking/EventDetailsSection.tsx`** - Event information display
3. **`components/booking/TicketSelectionCard.tsx`** - Individual ticket card with quantity selector
4. **`components/booking/ReviewSummary.tsx`** - Booking summary before payment
5. **`components/booking/LoginModal.tsx`** - Premium login modal with 3 options
6. **`components/booking/PaymentSimulator.tsx`** - PayU-themed payment simulator
7. **`components/booking/BookingConfirmationCard.tsx`** - Final confirmation card with QR code

### Utilities

1. **`lib/bookingState.ts`** - State management using localStorage
2. **`hooks/useEventById.ts`** - Hook to fetch event by ID from Firestore

## Step-by-Step Flow

### Step 1: Event Details (`/event/[eventId]`)

**Features:**
- Step indicator showing "1) Event Details → 2) Tickets → 3) Review & Pay"
- Event cover image
- Event title and description
- Date & time with duration calculation
- Venue with location icon
- Categories/genre tags
- Sticky "Book Now" button (mobile) or inline button (desktop)

**Navigation:**
- Clicking "Book Now" saves initial booking state and navigates to `/event/[eventId]/tickets`

### Step 2: Ticket Selection (`/event/[eventId]/tickets`)

**Features:**
- Step indicator showing step 2
- Fetches tickets from Firestore: `event.tickets.venueConfigs[].ticketTypes[]`
- Each ticket displayed as a card with:
  - Ticket name (typeName)
  - Price
  - Available quantity
  - Max per order
  - Quantity selector (+/- buttons)
- Sticky bottom bar (mobile) showing:
  - Total amount
  - "Proceed to Review" button

**Navigation:**
- Selecting tickets updates booking state
- Clicking "Proceed" navigates to `/event/[eventId]/review`

### Step 3: Review (`/event/[eventId]/review`)

**Features:**
- Step indicator showing step 3
- Event summary card with:
  - Event cover image
  - Event name
  - Date & time
  - Venue
- Ticket summary showing:
  - Selected ticket types
  - Quantities
  - Individual prices
- Price breakdown:
  - Subtotal
  - Booking fee (₹7 per ticket)
  - Total amount
- "Login to Proceed" button triggers login modal

**Login Modal:**
- Premium modal with 3 options:
  - Continue with Google
  - Continue with Email
  - Continue with Mobile Number
- Simulated login (1.5s delay)
- On success, navigates to payment page

**Navigation:**
- After login → `/event/[eventId]/payment`

### Step 4: Payment (`/event/[eventId]/payment`)

**Features:**
- Step indicator showing step 3 (final step)
- PayU-themed payment simulator:
  - Secure payment branding
  - Card number placeholder
  - Expiry & CVV placeholders
  - "Simulate Successful Payment" button
- Processing animation
- Success state

**Payment Logic:**
```typescript
async function simulatePayUSuccess() {
  // 1. Generate QR token
  const qrToken = `MOV-${Date.now()}-${randomString}`;
  
  // 2. Create booking in Firestore
  // Path: /users/{uid}/bookings/{bookingId}
  
  // 3. Clear booking state
  
  // 4. Navigate to confirmation
}
```

**Navigation:**
- After payment success → `/event/[eventId]/confirmation?bookingId=...&qrToken=...`

### Step 5: Confirmation (`/event/[eventId]/confirmation`)

**Features:**
- Premium booking confirmation card with:
  - Success checkmark animation
  - Event cover image
  - Event details (name, date, venue)
  - Ticket type and quantity
  - Total paid amount
  - **Auto-generated QR code** (using `qrcode.react`)
  - Booking ID
  - Download & Share buttons

**QR Code:**
- Uses `QRCodeSVG` from `qrcode.react`
- Contains booking token for entry verification
- Styled with neon blue accent (#0B62FF)
- White background for contrast

## State Management

### Booking State (`lib/bookingState.ts`)

Uses localStorage to persist booking state across steps:

```typescript
type BookingState = {
  eventId: string;
  eventName: string;
  eventImage: string;
  dateStart: string;
  dateEnd?: string;
  venue: string;
  city?: string;
  tickets: {
    ticketId: string;
    typeName: string;
    quantity: number;
    price: number;
  }[];
  bookingFee: number;
  totalAmount: number;
};
```

**Functions:**
- `saveBookingState(state)` - Save/update booking state
- `getBookingState()` - Retrieve booking state
- `clearBookingState()` - Clear booking state
- `calculateTotals(tickets)` - Calculate subtotal, booking fee, total

## Firestore Structure

### Event Document
```
/events/{eventId}
  - basicDetails: { title, description, coverWideUrl, ... }
  - schedule: { locations: [...] }
  - tickets: {
      venueConfigs: [{
        venueId: string,
        ticketTypes: [{
          id: string,
          typeName: string,
          price: number,
          totalQuantity: number,
          maxPerOrder?: number
        }]
      }]
    }
  - status: "published" | "hosted" | ...
```

### Booking Document
```
/users/{uid}/bookings/{bookingId}
  - eventId: string
  - eventName: string
  - userId: string
  - tickets: Array<{ ticketId, typeName, quantity, price }>
  - bookingFee: number
  - totalPaid: number
  - qrToken: string
  - status: "confirmed" | "pending" | "cancelled"
  - createdAt: Timestamp
  - updatedAt: Timestamp
```

## Responsive Design

### Mobile (< 640px)
- Full-width containers with padding
- Sticky bottom bars for CTAs
- Stacked layouts
- Compact spacing (`p-4`, `space-y-4`)
- Smaller text sizes

### Desktop (≥ 1024px)
- Max-width containers (`max-w-3xl`)
- Inline buttons (not sticky)
- Larger spacing (`p-6`, `space-y-6`)
- Larger text sizes

### Breakpoints
- `sm:` - 640px+ (tablets)
- `lg:` - 1024px+ (desktop)

## Styling

### Color Scheme
- Primary: `#0B62FF` (neon blue)
- Background: Dark gradient (`from-[#050016] via-[#0b0220] to-[#05010a]`)
- Cards: `bg-white/5` with `backdrop-blur-xl`
- Borders: `border-white/10`
- Success: Emerald green

### Animations
- Framer Motion for page transitions
- Smooth hover effects
- Loading spinners
- Success checkmark animation

## Testing Checklist

### Step 1: Event Details
- [ ] Event loads from Firestore
- [ ] All event information displays correctly
- [ ] "Book Now" button is visible and clickable
- [ ] Mobile: Sticky bottom bar works
- [ ] Desktop: Button is inline

### Step 2: Ticket Selection
- [ ] Tickets load from Firestore
- [ ] Quantity selectors work (+/-)
- [ ] Max per order is enforced
- [ ] Total updates in real-time
- [ ] "Proceed" button only enabled when tickets selected

### Step 3: Review
- [ ] Booking summary displays correctly
- [ ] Price breakdown is accurate
- [ ] Login modal opens on button click
- [ ] All 3 login options work
- [ ] Navigation to payment after login

### Step 4: Payment
- [ ] PayU branding displays
- [ ] Payment simulation works
- [ ] Success animation shows
- [ ] Booking created in Firestore
- [ ] Navigation to confirmation

### Step 5: Confirmation
- [ ] QR code generates correctly
- [ ] All booking details display
- [ ] Download/Share buttons present
- [ ] Card is visually impressive
- [ ] Mobile layout is perfect

## Security Notes

1. **Client-Side State**: Booking state in localStorage is temporary and cleared after confirmation
2. **Firestore Rules**: Ensure proper security rules for:
   - Reading events (public for published events)
   - Writing bookings (authenticated users only)
3. **QR Token**: Generated server-side in production (currently client-side for demo)
4. **Payment**: Replace simulator with real PayU integration in production

## Future Enhancements

- [ ] Real PayU payment gateway integration
- [ ] PDF ticket generation
- [ ] Email confirmation sending
- [ ] Push notifications for booking updates
- [ ] Booking history page
- [ ] Cancel/refund functionality
- [ ] Multiple payment methods
- [ ] Promo code validation
- [ ] Seat selection (if applicable)

## Usage

1. Navigate to `/event/[eventId]` where `eventId` is a Firestore document ID
2. Follow the 5-step flow
3. Booking state persists across steps using localStorage
4. Final booking is saved to Firestore at `/users/{uid}/bookings/{bookingId}`

## Dependencies

- `qrcode.react` - QR code generation (already installed)
- `framer-motion` - Animations (already installed)
- `firebase` - Firestore integration (already installed)
- `lucide-react` - Icons (already installed)

All dependencies are already in `package.json` - no additional installation needed!

