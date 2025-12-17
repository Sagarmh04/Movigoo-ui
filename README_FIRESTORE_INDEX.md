# Firestore Composite Index Setup

## Overview
This project requires a Firestore composite index for efficient querying of bookings by `userId` and `createdAt`.

## Index Configuration
The index configuration is defined in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Automatic Index Creation
Firebase will automatically create this index when:
1. The query is first executed
2. You deploy the `firestore.indexes.json` file

## Deploying the Index

### Option 1: Automatic (Recommended)
Firebase will automatically create the index when you first run the query. You'll see a link in the console error message that takes you directly to the Firebase Console to create the index.

### Option 2: Manual Deployment
If you have Firebase CLI installed:

```bash
firebase deploy --only firestore:indexes
```

### Option 3: Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Firestore Database → Indexes
4. Click "Create Index"
5. Use the configuration from `firestore.indexes.json`

## Fallback Behavior
The application includes a fallback mechanism:
- If the index is not ready, it will fetch bookings without `orderBy`
- Results will be sorted in memory
- This ensures the app works even while the index is being built

## Index Build Time
- Usually takes 1-2 minutes
- Can take up to 5 minutes for large datasets
- You'll see a user-friendly message during this time

## Verification
Once the index is built, the query will work efficiently and support:
- Fast queries even with thousands of bookings
- Scalable performance
- No more "requires index" errors

