# Hosted Events Setup Guide

This guide explains how the hosted events system works and how to set up Firestore for it.

## Overview

The Movigoo frontend now **only displays hosted events** from Firestore. Static/mock events have been removed. The system supports two patterns for marking events as hosted:

1. `status: "hosted"` (recommended canonical field)
2. `isHosted: true` (boolean field)

Both patterns are queried simultaneously, results are merged and deduplicated by document ID.

## Firestore Collection Structure

### Collection: `events`

Each document should contain:

#### Required Fields:
- `title` (string) - Event title
- One of the following to mark as hosted:
  - `status` (string) - Set to `"hosted"` for hosted events
  - `isHosted` (boolean) - Set to `true` for hosted events

#### Optional Fields:
- `description` (string) - Event description
- `startAt` (Timestamp) - Event start date/time (used for sorting)
- `endAt` (Timestamp) - Event end date/time
- `image` (string) - Image URL
- `host` (string) - Organizer/host name
- `createdAt` (Timestamp) - Creation date (used for sorting if startAt is missing)
- `updatedAt` (Timestamp) - Last update date (used for conflict resolution)
- `city` (string) - Event city
- `venue` (string) - Venue name
- `categories` (array) - Array of category strings
- `priceFrom` (number) - Starting price
- `organizerId` (string) - Organizer ID
- `slug` (string) - URL-friendly slug (auto-generated from title if not provided)
- `coverWide` (string) - Wide cover image URL
- `coverPortrait` (array) - Array of portrait image URLs
- `rating` (number) - Event rating
- `hosted` (boolean) - Additional hosted flag

### Example Documents

**Pattern 1: Using `status` field**
```json
{
  "title": "Summer Music Festival",
  "status": "hosted",
  "description": "A weekend of amazing music",
  "startAt": "2024-07-15T18:00:00Z",
  "endAt": "2024-07-17T22:00:00Z",
  "image": "https://example.com/festival.jpg",
  "host": "Music Events Co",
  "city": "Mumbai",
  "venue": "Central Park",
  "categories": ["Music", "Festival"],
  "priceFrom": 500,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Pattern 2: Using `isHosted` field**
```json
{
  "title": "Art Exhibition",
  "isHosted": true,
  "description": "Contemporary art showcase",
  "startAt": "2024-08-01T10:00:00Z",
  "image": "https://example.com/art.jpg",
  "host": "Gallery XYZ",
  "city": "Delhi",
  "venue": "Modern Art Gallery",
  "categories": ["Art", "Exhibition"],
  "priceFrom": 300,
  "createdAt": "2024-01-15T00:00:00Z"
}
```

**Note:** If a document has both `status: "hosted"` AND `isHosted: true`, it will only appear once (deduplicated by document ID). The system prefers the latest `updatedAt` timestamp if there's a conflict.

## Firestore Indexes

The queries used are:
- `status == "hosted"` (no orderBy - sorting done client-side)
- `isHosted == true` (no orderBy - sorting done client-side)

**No composite indexes are required** since we're not using `orderBy` in the queries. Sorting is performed client-side after merging results.

## How It Works

1. **Two Realtime Listeners**: The `useHostedEvents()` hook sets up two `onSnapshot` listeners:
   - One for `status == "hosted"`
   - One for `isHosted == true`

2. **Merge & Deduplicate**: Results from both queries are merged into a single Map keyed by document ID. If a document appears in both queries, the latest data (based on `updatedAt`) is kept.

3. **Client-Side Sorting**: Events are sorted:
   - First by `startAt` (ascending) if available
   - Then by `createdAt` (ascending) for events without `startAt`
   - Events with dates come before events without dates

4. **Realtime Updates**: When an event's `status` changes to `"hosted"` or `isHosted` changes to `true`, it appears in the UI within 1-2 seconds. When it's changed away from hosted, it disappears.

## Testing

### Test Plan

1. **Create test events in Firestore:**
   - Event A: `status: "hosted"`, `title: "Hosted Event 1"`
   - Event B: `isHosted: true`, `title: "Hosted Event 2"`
   - Event C: `status: "draft"`, `title: "Draft Event"` (should NOT appear)

2. **Open `/events` page:**
   - Only Event A and Event B should appear
   - Event C should NOT appear

3. **Realtime update test:**
   - Change Event C's `status` to `"hosted"` in Firestore Console
   - Event C should appear in the UI within 1-2 seconds

4. **Remove hosted status:**
   - Change Event A's `status` to `"draft"` in Firestore Console
   - Event A should disappear from the UI within 1-2 seconds

5. **Toggle isHosted:**
   - Change Event B's `isHosted` to `false` in Firestore Console
   - Event B should disappear from the UI within 1-2 seconds

## Security Notes

⚠️ **Important Security Considerations:**

1. **Client-Side Reads Only**: The frontend only reads hosted events. It does NOT write to Firestore.

2. **Firestore Security Rules**: Set up rules to prevent unauthorized writes:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /events/{eventId} {
         // Anyone can read hosted events
         allow read: if resource.data.status == "hosted" || 
                       resource.data.isHosted == true;
         
         // Only authenticated admins can write
         allow write: if request.auth != null && 
                       request.auth.token.admin == true;
       }
     }
   }
   ```

3. **Admin Operations**: To mark events as hosted, use Firebase Admin SDK on your backend/server. Never allow client-side writes to `status` or `isHosted` in production.

4. **Migration Recommendation**: If you have both `status` and `isHosted` fields, prefer using `status: "hosted"` as the canonical field. The code includes logic to prefer `status` when both are present.

## Files Modified

- `hooks/useHostedEvents.ts` - New hook for fetching hosted events
- `components/HostedEventListClient.tsx` - Client component that displays hosted events
- `app/events/page.tsx` - Updated to use `HostedEventListClient`
- `app/page.tsx` - Updated to remove static events
- `components/home/HomeLanding.tsx` - Updated to use `useHostedEvents` hook
- `hooks/useEvents.ts` - Static seed data commented out

## Environment Variables

Ensure these are set in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=1:xxxx:web:xxxxxxxx
```

## Troubleshooting

### Events not appearing
- Verify `status == "hosted"` (exact string, case-sensitive) OR `isHosted == true` (boolean)
- Check browser console for errors
- Verify Firebase environment variables are set
- Check Firestore security rules allow reading

### Realtime updates not working
- Ensure Firestore is enabled and in the correct mode
- Check network connectivity
- Verify `onSnapshot` listeners are active (check browser console)

### Both patterns showing duplicate
- The system deduplicates by document ID, so this shouldn't happen
- If it does, check that document IDs are unique

