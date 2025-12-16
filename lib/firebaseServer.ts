// lib/firebaseServer.ts
// Server-side Firebase initialization (for API routes)
// Uses client SDK for now - upgrade to firebase-admin in production

import { initializeApp, getApps } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

let db: Firestore | null = null;

if (typeof window === "undefined") {
  // Server-side only
  try {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    if (!firebaseConfig.projectId) {
      console.warn("Firebase not configured for server-side");
    } else {
      if (getApps().length === 0) {
        initializeApp(firebaseConfig);
      }
      db = getFirestore();
    }
  } catch (error) {
    console.error("Firebase server initialization error:", error);
  }
}

export { db };

