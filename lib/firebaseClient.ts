// lib/firebaseClient.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

function initFirebase(): FirebaseApp {
  // Avoid re-initializing in hot reload / SSR
  try {
    if (!getApps().length) {
      return initializeApp(firebaseConfig);
    }
    return getApp();
  } catch (err) {
    // In case of any race, still return the default app
    return getApp();
  }
}

/**
 * Dev-only masked logging of Firebase config so we can verify env wiring
 * without exposing secrets. Safe to call from anywhere.
 */
export function logFirebaseConfig() {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "production") return;
  const mask = (val?: string) => (val ? `${val.slice(0, 4)}…${val.slice(-4)}` : "unset");
  // eslint-disable-next-line no-console
  console.debug("[firebase] config", {
    apiKey: mask(firebaseConfig.apiKey),
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket
  });
}

// Only initialize on client side
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (typeof window !== "undefined") {
  app = initFirebase();
  db = getFirestore(app);
  logFirebaseConfig();
}

export { db };
export default app;
