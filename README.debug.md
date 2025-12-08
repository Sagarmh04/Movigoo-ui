# Hosted Events Debug & Test Guide

## Quick test
1) In Firestore, create an `events` document with either:
   - `status: "hosted"` (recommended) **or**
   - `isHosted: true` (also supported)
   - Optionally: `hosted: true`, `published: true`, or `visibility: "hosted"`
2) Add `title` and (optionally) `startAt` / `createdAt`.
3) Open `/events` in dev mode. You should see the event within ~1–2 seconds (realtime).

## Debug output
- Open the browser console (dev mode) to see snapshot logs and any Firestore errors/index hints.
- On the `/events` page, toggle the **Debug (dev only)** panel to see:
  - Counts per query
  - Fallback hits
  - Last seen document IDs
  - Notes about failed queries (permissions/index)
- If no hosted events appear, click **“Show raw Firestore scan”** (dev only) to view doc IDs from the fallback scan.

## Firestore rules (example for public reads of hosted events)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      allow read: if resource.data.status == "hosted"
                || resource.data.status == "published"
                || resource.data.isHosted == true
                || resource.data.hosted == true
                || resource.data.published == true
                || resource.data.visibility == "hosted";
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## Common blockers
- Security rules denying read access (see console error).
- Missing Firestore index for `where("status", "in", ["hosted","published","live"])`.
- Events stored in subcollections (fallback `collectionGroup("events")` listener will try to pick these up).
- Field name mismatch (covered by multiple hosted flags).

## Environment
Ensure `.env.local` has all `NEXT_PUBLIC_FIREBASE_*` variables set (keys are not secret but required for the client SDK).

