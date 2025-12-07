# Firebase Firestore Setup Guide

This guide explains how to set up Firebase Firestore for realtime event updates in the Movigoo frontend.

## Prerequisites

1. A Firebase account ([console.firebase.google.com](https://console.firebase.google.com))
2. A Firebase project created
3. Firestore Database enabled

## Step 1: Get Firebase Configuration

1. Go to Firebase Console > Your Project
2. Click the gear icon ⚙️ > Project Settings
3. Scroll down to "Your apps" section
4. If you don't have a web app, click "Add app" > Web (</>) icon
5. Copy the configuration values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

## Step 2: Configure Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=1:xxxx:web:xxxxxxxx
```

## Step 3: Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Start in **test mode** for development (or production mode with security rules)
4. Choose a location (e.g., `us-central1`)

## Step 4: Create the Events Collection

1. Click **Start collection**
2. Collection ID: `events`
3. Add your first document with these fields:

### Required Fields:
- `title` (string) - Event title
- `status` (string) - Must be `"published"` for events to appear
- `startAt` (timestamp) - Event start date/time

### Optional Fields:
- `description` (string) - Event description
- `endAt` (timestamp) - Event end date/time
- `image` (string) - Image URL
- `host` (string) - Organizer/host name
- `createdAt` (timestamp) - Creation date
- `city` (string) - Event city
- `venue` (string) - Venue name
- `categories` (array) - Array of category strings
- `priceFrom` (number) - Starting price
- `organizerId` (string) - Organizer ID
- `slug` (string) - URL-friendly slug (auto-generated if not provided)
- `coverWide` (string) - Wide cover image URL
- `coverPortrait` (array) - Array of portrait image URLs
- `rating` (number) - Event rating
- `hosted` (boolean) - Whether event is hosted by current user

### Example Document:

```json
{
  "title": "Summer Music Festival",
  "description": "A weekend of amazing music and fun",
  "startAt": "2024-07-15T18:00:00Z",
  "endAt": "2024-07-17T22:00:00Z",
  "image": "https://example.com/festival.jpg",
  "host": "Music Events Co",
  "status": "published",
  "city": "Mumbai",
  "venue": "Central Park",
  "categories": ["Music", "Festival"],
  "priceFrom": 500,
  "organizerId": "org-123",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## Step 5: Create Firestore Index

The app queries events with:
- `status == "published"`
- Ordered by `startAt` ascending

Firebase will prompt you to create this index when you first run the query. Click the link in the error message, or manually create it:

1. Go to Firestore Database > Indexes
2. Click **Create Index**
3. Collection ID: `events`
4. Add fields:
   - `status` (Ascending)
   - `startAt` (Ascending)
5. Click **Create**

## Step 6: Security Rules (Production)

For production, update your Firestore security rules to restrict writes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Events collection - read published events, write only by authenticated admins
    match /events/{eventId} {
      // Anyone can read published events
      allow read: if resource.data.status == "published";
      
      // Only authenticated admins can write
      allow write: if request.auth != null && 
                     request.auth.token.admin == true;
    }
  }
}
```

For development, you can use test mode, but **never deploy to production with test mode enabled**.

## Step 7: Restart Dev Server

After adding environment variables, restart your Next.js dev server:

```bash
npm run dev
```

## Testing

1. Create a test event in Firestore with `status: "published"`
2. Open `/events` in your app
3. The event should appear automatically
4. Edit the event title in Firestore Console
5. The change should appear in the app within 1-2 seconds (realtime update)
6. Change `status` to `"draft"` - the event should disappear from the frontend

## Troubleshooting

### Events not appearing
- Check that `status` is set to `"published"` (exact string, case-sensitive)
- Verify environment variables are set correctly
- Check browser console for errors
- Ensure Firestore index is created

### "Missing or insufficient permissions" error
- Check Firestore security rules
- For development, ensure test mode is enabled
- For production, ensure rules allow reading published events

### "The query requires an index" error
- Click the link in the error message to create the index
- Or manually create index: `status` (ascending) + `startAt` (ascending)

### Realtime updates not working
- Ensure you're using the `useEvents()` hook (which uses Firebase when configured)
- Check that Firestore is in the correct mode (not disabled)
- Verify network connectivity

## Security Notes

⚠️ **Important**: Firebase client keys (`NEXT_PUBLIC_FIREBASE_*`) are **not secret** - they identify your project but don't grant admin access. However:

1. **Protect writes** with Firestore security rules
2. **Use Firebase Admin SDK** on your backend for admin operations
3. **Never expose** Firebase Admin credentials in client code
4. **Validate data** on both client and server
5. **Use authentication** to restrict who can create/modify events

For admin panel operations (creating/editing events), use Firebase Admin SDK on a server or serverless function.

