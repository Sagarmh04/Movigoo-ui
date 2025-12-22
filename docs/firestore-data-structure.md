# Firestore Data Structure Documentation

Complete documentation of all Firestore collections, subcollections, and their fields with optional/required indicators.

---

## 1. Events Collection

**Path:** `/events/{eventId}`

### Main Document Structure

```typescript
{
  // Required Fields
  id: string; // Document ID (auto-generated)
  
  // Optional Top-Level Fields
  slug?: string; // URL-friendly slug (auto-generated from title if not provided)
  hostUid?: string; // Host/Organizer Firebase UID
  organizerId?: string; // Organizer ID (alternative to hostUid)
  
  // Status Fields (at least one required for hosted events)
  status?: "hosted" | "published" | "draft"; // Recommended: "hosted"
  isHosted?: boolean; // Alternative: true for hosted events
  hosted?: boolean; // Additional hosted flag
  published?: boolean; // Additional published flag
  visibility?: string; // Additional visibility flag
  
  // Timestamps (Optional)
  createdAt?: Timestamp; // Creation date (used for sorting if startAt is missing)
  updatedAt?: Timestamp; // Last update date
  startAt?: Timestamp; // Event start date/time (used for sorting)
  endAt?: Timestamp; // Event end date/time
  
  // Basic Details (Nested Object - Optional)
  basicDetails?: {
    title?: string; // Event title (required for display)
    description?: string; // Event description
    coverWideUrl?: string; // Wide cover image URL
    coverPortraitUrl?: string; // Portrait cover image URL (single)
    coverPortrait?: string[]; // Array of portrait image URLs
    ageLimit?: string | number; // Age restriction (e.g., "13", "18", "All Ages")
    genres?: string[]; // Array of genre/category strings
    // Additional optional fields
    [key: string]: any;
  };
  
  // Schedule Structure (Nested Object - Optional)
  schedule?: {
    locations?: Array<{
      id?: string; // Location ID (optional, auto-generated if missing)
      name: string; // Location name (e.g., "Mumbai", "Delhi")
      venues?: Array<{
        id?: string; // Venue ID (optional, auto-generated if missing)
        name: string; // Venue name
        address?: string; // Venue address (optional)
        dates?: Array<{
          id?: string; // Date ID (optional, auto-generated if missing)
          date: string; // Date in ISO format (YYYY-MM-DD)
          shows?: Array<{
            id?: string; // Show ID (optional, auto-generated if missing)
            name?: string; // Show name (optional, defaults to "Show 1", "Show 2", etc.)
            startTime: string; // Start time in HH:mm format (e.g., "18:30")
            endTime?: string; // End time in HH:mm format (optional, e.g., "21:00")
          }>;
        }>;
      }>;
    }>;
  };
  
  // Tickets Configuration (Nested Object - Optional)
  tickets?: {
    venueConfigs?: Array<{
      venueId: string; // Must match venue.id from schedule
      ticketTypes?: Array<{
        id: string; // Ticket type ID (required)
        typeName: string; // Ticket type name (e.g., "VIP", "Gold", "Silver")
        price: number; // Price per ticket (required)
        totalQuantity?: number; // Total available tickets (optional, defaults to 0)
        description?: string; // Ticket description (optional)
        perks?: string; // Ticket perks/benefits (optional)
        maxPerOrder?: number; // Maximum tickets per order (optional, defaults to 10)
      }>;
    }>;
  };
  
  // Statistics (Nested Object - Auto-generated, Optional)
  statistics?: {
    shows?: {
      [showId: string]: {
        bookingsCount?: number; // Total bookings for this show (incremented on booking)
        lastUpdated?: Timestamp; // Last update timestamp
      };
    };
    // Additional statistics fields can be added here
  };
  
  // Legacy/Alternative Fields (Optional - for backward compatibility)
  title?: string; // Alternative to basicDetails.title
  description?: string; // Alternative to basicDetails.description
  city?: string; // Alternative location field
  venue?: string; // Alternative venue field
  categories?: string[]; // Alternative to basicDetails.genres
  priceFrom?: number; // Starting price (calculated from tickets if not provided)
  coverWide?: string; // Alternative to basicDetails.coverWideUrl
  coverPortrait?: string[]; // Alternative to basicDetails.coverPortraitUrl
  rating?: number; // Event rating (0-5)
  image?: string; // Alternative image field
  host?: string; // Host/organizer name
}
```

### Subcollection: Event Bookings

**Path:** `/events/{eventId}/bookings/{bookingId}`

```typescript
{
  // Required Fields
  bookingId: string; // Unique booking ID (UUID)
  userId: string; // Firebase Auth UID of the customer
  eventId: string; // Event ID (matches parent document ID)
  eventTitle: string; // Event title
  totalAmount: number; // Total amount paid
  paymentStatus: "PENDING" | "confirmed" | "failed" | "cancelled"; // Payment status
  bookingStatus: "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED"; // Booking status
  createdAt: Timestamp; // Creation timestamp
  
  // Booking Details (Required)
  venueName: string; // Venue name
  date: string; // Event date (YYYY-MM-DD format)
  time: string; // Event time (HH:mm format)
  ticketType: string; // Comma-separated ticket types (e.g., "VIP (2), Gold (1)")
  quantity: number; // Total number of tickets
  price: number; // Subtotal (before booking fee)
  bookingFee: number; // Booking fee (₹7 per ticket)
  
  // Items Array (Required)
  items: Array<{
    ticketTypeId: string; // Ticket type ID
    quantity: number; // Quantity of this ticket type
    price: number; // Price per ticket
  }>;
  
  // User Information (Optional)
  userName?: string | null; // User's display name
  userEmail?: string | null; // User's email address
  
  // Show Selection Metadata (Optional - for multi-location events)
  locationId?: string | null; // Location ID
  locationName?: string | null; // Location name
  venueId?: string | null; // Venue ID
  dateId?: string | null; // Date ID
  showId?: string | null; // Show ID
  showTime?: string | null; // Show start time (HH:mm)
  showEndTime?: string | null; // Show end time (HH:mm)
  venueAddress?: string | null; // Venue address
  
  // Composite Keys for Querying (Optional - auto-generated)
  locationVenueKey?: string | null; // Format: "{locationId}_{venueId}"
  venueShowKey?: string | null; // Format: "{venueId}_{showId}"
  dateTimeKey?: string | null; // Format: "{date}_{showTime}"
  
  // Payment Information (Optional)
  paymentGateway?: string; // Payment gateway used (e.g., "cashfree")
  qrCodeData?: string; // QR code data (usually same as bookingId)
  coverUrl?: string; // Event cover image URL
  
  // Additional Fields (Optional)
  promoCode?: string; // Promo code used (if any)
  discount?: number; // Discount amount (if any)
}
```

---

## 2. Bookings Collection (Global)

**Path:** `/bookings/{bookingId}`

**Note:** This is the main collection for customer bookings. Host users have their own subcollection under `/users/{uid}/bookings/`.

```typescript
{
  // Required Fields
  bookingId: string; // Unique booking ID (UUID)
  userId: string; // Firebase Auth UID of the customer
  eventId: string; // Event ID
  eventTitle: string; // Event title
  totalAmount: number; // Total amount paid
  paymentStatus: "PENDING" | "confirmed" | "failed" | "cancelled";
  createdAt: Timestamp; // Creation timestamp
  
  // Booking Details (Required)
  venueName: string; // Venue name
  date: string; // Event date (YYYY-MM-DD)
  time: string; // Event time (HH:mm)
  ticketType: string; // Ticket types string
  quantity: number; // Total tickets
  price: number; // Subtotal
  bookingFee: number; // Booking fee
  
  // Items Array (Required)
  items: Array<{
    ticketTypeId: string;
    quantity: number;
    price: number;
  }>;
  
  // Optional Fields
  userName?: string | null; // User display name
  userEmail?: string | null; // User email
  qrCodeData?: string; // QR code data (usually bookingId)
  coverUrl?: string; // Event cover image
  paymentGateway?: string; // Payment gateway name
  bookingStatus?: string; // Booking status
}
```

---

## 3. Users Collection

**Path:** `/users/{uid}`

**Note:** `{uid}` is the Firebase Auth UID.

```typescript
{
  // Required Fields
  id: string; // Firebase Auth UID (same as document ID)
  
  // User Profile (Optional)
  name?: string; // User's full name
  displayName?: string; // Display name (alternative to name)
  email?: string; // Email address
  emailAddress?: string; // Alternative email field
  phoneNumber?: string; // Phone number
  photoURL?: string; // Profile photo URL
  
  // User Role (Optional)
  role?: "user" | "organizer" | "admin"; // User role
  
  // Timestamps (Optional)
  createdAt?: Timestamp; // Account creation date
  updatedAt?: Timestamp; // Last update date
  
  // Additional Profile Fields (Optional)
  [key: string]: any; // Additional custom fields
}
```

### Subcollection: User Bookings (Host Users Only)

**Path:** `/users/{uid}/bookings/{bookingId}`

**Note:** This subcollection is **ONLY for host users**. Customer bookings are stored in the global `/bookings` collection.

```typescript
{
  // Same structure as /bookings/{bookingId}
  // Used by host users to manage their event bookings
  // Contains the same fields as the global bookings collection
}
```

---

## 4. Payment Sessions Collection

**Path:** `/paymentSessions/{sessionId}`

**Note:** Internal collection for payment processing. No client access.

```typescript
{
  // Required Fields
  sessionId: string; // Unique session ID
  userId: string; // User ID
  eventId: string; // Event ID
  amount: number; // Payment amount
  status: "PENDING" | "COMPLETED" | "FAILED" | "EXPIRED"; // Session status
  
  // Payment Details (Optional)
  ticketSelections?: Array<{
    ticketTypeId: string;
    quantity: number;
    price: number;
  }>;
  
  // Idempotency (Optional)
  idempotencyKey?: string; // Idempotency key
  
  // Timestamps (Optional)
  createdAt?: Timestamp; // Session creation
  expiresAt?: Timestamp; // Session expiration
  completedAt?: Timestamp; // Completion timestamp
  
  // Payment Gateway Data (Optional)
  paymentGateway?: string; // Gateway name
  gatewayTransactionId?: string; // Gateway transaction ID
  gatewayResponse?: any; // Gateway response data
}
```

---

## 5. Idempotency Collection

**Path:** `/idempotency/{key}`

**Note:** Internal collection for preventing duplicate operations. No client access.

```typescript
{
  // Required Fields
  key: string; // Idempotency key (document ID)
  result?: any; // Cached result of the operation
  createdAt: Timestamp; // Creation timestamp
  
  // Optional Fields
  expiresAt?: Timestamp; // Expiration timestamp
  operationType?: string; // Type of operation
}
```

---

## QR Code Generation and Ticket Identification

### QR Code ID Used

**Primary ID:** `bookingId` (UUID format)

The QR code contains the **`bookingId`** which is:
- Generated as a UUID using `uuidv4()` (e.g., `"550e8400-e29b-41d4-a716-446655440000"`)
- Stored in the `qrCodeData` field in the booking document
- **Critical:** `qrCodeData` is set to the same value as `bookingId` to ensure consistency

### Storage Location

The `qrCodeData` (which equals `bookingId`) is stored in:

1. **Global Bookings Collection:**
   - Path: `/bookings/{bookingId}`
   - Field: `qrCodeData: string` (contains the bookingId)
   - Field: `bookingId: string` (document ID, same value)

2. **Event Bookings Subcollection:**
   - Path: `/events/{eventId}/bookings/{bookingId}`
   - Field: `qrCodeData: string` (contains the bookingId)
   - Field: `bookingId: string` (document ID, same value)

### QR Code Generation Flow

```typescript
// 1. Generate bookingId (UUID)
const bookingId = uuidv4(); // e.g., "550e8400-e29b-41d4-a716-446655440000"

// 2. Set qrCodeData to bookingId (for consistency)
const qrCodeData = bookingId; // CRITICAL: Same value as bookingId

// 3. Store in booking document
{
  bookingId: "550e8400-e29b-41d4-a716-446655440000",
  qrCodeData: "550e8400-e29b-41d4-a716-446655440000", // Same as bookingId
  // ... other fields
}
```

### QR Code Display

When displaying the QR code:
```typescript
<QRCodeSVG value={booking.qrCodeData || booking.bookingId} />
```
- Uses `qrCodeData` if available
- Falls back to `bookingId` if `qrCodeData` is missing

### Ticket Identification (QR Code Scanning)

When a QR code is scanned at the venue:

1. **Extract the ID:** The scanned value is the `bookingId` (UUID)

2. **Lookup Booking:** Query Firestore:
   ```typescript
   // Primary lookup: Global bookings collection
   const bookingRef = doc(db, "bookings", scannedBookingId);
   const bookingDoc = await getDoc(bookingRef);
   
   // Alternative: Event bookings subcollection (if needed)
   const eventBookingRef = doc(db, "events", eventId, "bookings", scannedBookingId);
   ```

3. **Verify Booking:**
   - Check if booking exists
   - Verify `paymentStatus === "confirmed"` or `bookingStatus === "CONFIRMED"`
   - Verify `eventId` matches the event
   - Verify `showId` matches the show (if multi-show event)
   - Check if already scanned (optional: add `scannedAt` timestamp)

4. **Booking Document Structure for Verification:**
   ```typescript
   {
     bookingId: string;        // Document ID (matches QR code)
     qrCodeData: string;       // Same as bookingId
     eventId: string;          // Verify event matches
     showId?: string;          // Verify show matches (if multi-show)
     paymentStatus: "confirmed"; // Must be confirmed
     bookingStatus: "CONFIRMED"; // Must be confirmed
     quantity: number;         // Number of tickets
     // ... other fields
   }
   ```

### Important Notes

1. **Consistency:** `qrCodeData` is always set to `bookingId` to prevent mismatches
2. **Storage:** Stored in both `/bookings/{bookingId}` and `/events/{eventId}/bookings/{bookingId}`
3. **Lookup:** Always use the global `/bookings/{bookingId}` collection for QR code verification
4. **Format:** BookingId is a UUID (e.g., `"550e8400-e29b-41d4-a716-446655440000"`)
5. **Uniqueness:** Each booking has a unique UUID, ensuring no collisions

### Example QR Code Verification Flow

```typescript
async function verifyQRCode(scannedValue: string, eventId: string) {
  // 1. Get booking from global collection
  const bookingRef = doc(db, "bookings", scannedValue);
  const bookingDoc = await getDoc(bookingRef);
  
  if (!bookingDoc.exists()) {
    return { valid: false, error: "Booking not found" };
  }
  
  const booking = bookingDoc.data();
  
  // 2. Verify booking details
  if (booking.eventId !== eventId) {
    return { valid: false, error: "Booking not for this event" };
  }
  
  if (booking.paymentStatus !== "confirmed") {
    return { valid: false, error: "Payment not confirmed" };
  }
  
  if (booking.bookingStatus !== "CONFIRMED") {
    return { valid: false, error: "Booking not confirmed" };
  }
  
  // 3. Mark as scanned (optional)
  await updateDoc(bookingRef, {
    scannedAt: serverTimestamp(),
    scannedBy: currentUser.uid, // Scanner user ID
  });
  
  return {
    valid: true,
    booking: {
      bookingId: booking.bookingId,
      quantity: booking.quantity,
      ticketType: booking.ticketType,
      userName: booking.userName,
    }
  };
}
```

---

## Field Type Reference

### Timestamp
- Firestore `Timestamp` type
- Format: `{ seconds: number, nanoseconds: number }`
- Can be created with `serverTimestamp()` or `new Timestamp()`

### String Formats
- **Date:** `YYYY-MM-DD` (e.g., "2024-12-25")
- **Time:** `HH:mm` (e.g., "18:30") or `HH:mm:ss` (e.g., "18:30:00")
- **DateTime:** ISO 8601 format (e.g., "2024-12-25T18:30:00Z")

### Number
- All prices in **Indian Rupees (₹)**
- Booking fee: ₹7 per ticket
- All amounts stored as numbers (not strings)

### Arrays
- All arrays are optional and default to empty arrays `[]` if not provided
- Use `Array.isArray()` checks before accessing

---

## Collection Access Patterns

### Customer Bookings
- **Read:** `/bookings/{bookingId}` where `userId == currentUser.uid`
- **Write:** Server API only (via `/api/bookings`)

### Host Event Bookings
- **Read:** `/events/{eventId}/bookings/{bookingId}` where user is event organizer
- **Write:** Server API only

### User Profile
- **Read:** `/users/{uid}` where `uid == currentUser.uid`
- **Write:** User can write own profile, server can write any

### Events
- **Read:** Public read for all events
- **Write:** Server API only

---

## Important Notes

1. **Customer vs Host Bookings:**
   - Customer bookings: `/bookings/{bookingId}` (global collection)
   - Host bookings: `/users/{uid}/bookings/{bookingId}` (subcollection, host users only)
   - Event bookings: `/events/{eventId}/bookings/{bookingId}` (for host queries with metadata)

2. **Booking ID Consistency:**
   - Same `bookingId` is used across all collections
   - `qrCodeData` is set to `bookingId` for consistency

3. **Statistics Updates:**
   - Event statistics are auto-incremented on booking confirmation
   - Path: `events/{eventId}.statistics.shows.{showId}.bookingsCount`

4. **Optional Fields:**
   - Most fields are optional to support flexible event structures
   - Always use null checks and default values in code
   - Use `?.` optional chaining when accessing nested fields

5. **Multi-Location Events:**
   - Events can have multiple locations, venues, dates, and shows
   - Booking metadata includes `locationId`, `venueId`, `dateId`, `showId` for filtering

---

## Example Documents

### Example Event Document

```json
{
  "slug": "summer-music-festival-2024",
  "hostUid": "user123",
  "organizerId": "user123",
  "status": "hosted",
  "createdAt": { "seconds": 1704067200, "nanoseconds": 0 },
  "basicDetails": {
    "title": "Summer Music Festival 2024",
    "description": "A weekend of amazing music and fun",
    "coverWideUrl": "https://example.com/festival-wide.jpg",
    "coverPortraitUrl": "https://example.com/festival-portrait.jpg",
    "ageLimit": "13",
    "genres": ["Music", "Festival", "Entertainment"]
  },
  "schedule": {
    "locations": [
      {
        "id": "loc_mumbai",
        "name": "Mumbai",
        "venues": [
          {
            "id": "venue_central_park",
            "name": "Central Park",
            "address": "123 Main Street, Mumbai",
            "dates": [
              {
                "id": "date_2024-07-15",
                "date": "2024-07-15",
                "shows": [
                  {
                    "id": "show_evening",
                    "name": "Evening Show",
                    "startTime": "18:00",
                    "endTime": "21:00"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "tickets": {
    "venueConfigs": [
      {
        "venueId": "venue_central_park",
        "ticketTypes": [
          {
            "id": "ticket_vip",
            "typeName": "VIP",
            "price": 2000,
            "totalQuantity": 100,
            "description": "VIP access with front row seats"
          },
          {
            "id": "ticket_gold",
            "typeName": "Gold",
            "price": 1500,
            "totalQuantity": 200
          }
        ]
      }
    ]
  },
  "statistics": {
    "shows": {
      "show_evening": {
        "bookingsCount": 45,
        "lastUpdated": { "seconds": 1704067200, "nanoseconds": 0 }
      }
    }
  }
}
```

### Example Booking Document

```json
{
  "bookingId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "customer123",
  "eventId": "event123",
  "eventTitle": "Summer Music Festival 2024",
  "venueName": "Central Park",
  "date": "2024-07-15",
  "time": "18:00",
  "ticketType": "VIP (2), Gold (1)",
  "quantity": 3,
  "price": 5500,
  "bookingFee": 21,
  "totalAmount": 5521,
  "items": [
    {
      "ticketTypeId": "ticket_vip",
      "quantity": 2,
      "price": 2000
    },
    {
      "ticketTypeId": "ticket_gold",
      "quantity": 1,
      "price": 1500
    }
  ],
  "paymentStatus": "confirmed",
  "bookingStatus": "CONFIRMED",
  "userName": "John Doe",
  "userEmail": "john@example.com",
  "qrCodeData": "550e8400-e29b-41d4-a716-446655440000",
  "locationId": "loc_mumbai",
  "locationName": "Mumbai",
  "venueId": "venue_central_park",
  "dateId": "date_2024-07-15",
  "showId": "show_evening",
  "showTime": "18:00",
  "showEndTime": "21:00",
  "venueAddress": "123 Main Street, Mumbai",
  "locationVenueKey": "loc_mumbai_venue_central_park",
  "venueShowKey": "venue_central_park_show_evening",
  "dateTimeKey": "2024-07-15_18:00",
  "paymentGateway": "cashfree",
  "coverUrl": "https://example.com/festival-wide.jpg",
  "createdAt": { "seconds": 1704067200, "nanoseconds": 0 }
}
```

---

## Security Rules Summary

- **Events:** Public read, server write only
- **Bookings (Global):** User can read own, host can read their event bookings, server write only
- **Event Bookings:** User can read own, host can read their event bookings, server write only
- **User Bookings (Subcollection):** User can read own, server write only
- **Users:** User can read/write own profile
- **Payment Sessions:** No client access
- **Idempotency:** No client access

---

*Last Updated: Based on current codebase analysis*

