// lib/firebaseAdmin.ts
// Firebase Admin SDK initialization (bypasses Firestore security rules)
// CRITICAL: Use this ONLY in API routes (/app/api/**)
// NEVER import this in components, hooks, or client-side code

// @ts-ignore - firebase-admin is server-only, Next.js may try to bundle it
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
// @ts-ignore - firebase-admin is server-only, Next.js may try to bundle it
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

if (typeof window === "undefined") {
  // Server-side only
  try {
    // Initialize Admin SDK
    if (getApps().length === 0) {
      // Option 1: Use service account (if available)
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
          adminApp = initializeApp({
            credential: cert(serviceAccount),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount.project_id,
          });
          console.log("✅ Firebase Admin SDK initialized with service account");
        } catch (parseError) {
          console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", parseError);
          // Fall through to default credentials
        }
      }
      
      // Option 2: Use Application Default Credentials (for Vercel/Cloud Run/GCP)
      // This works if FIREBASE_SERVICE_ACCOUNT_KEY is not set
      if (!adminApp) {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        if (!projectId) {
          console.error("❌ NEXT_PUBLIC_FIREBASE_PROJECT_ID not set");
        } else {
          adminApp = initializeApp({
            projectId: projectId,
          });
          console.log("✅ Firebase Admin SDK initialized with default credentials");
        }
      }
    } else {
      adminApp = getApps()[0];
    }
    
    if (adminApp) {
      adminDb = getFirestore(adminApp);
      console.log("✅ Firebase Admin Firestore initialized (bypasses security rules)");
    } else {
      console.error("❌ Firebase Admin App not initialized");
    }
  } catch (error) {
    console.error("❌ Firebase Admin SDK initialization error:", error);
    // adminDb remains null if initialization fails
  }
}

export { adminDb, adminApp };
export default adminDb;

