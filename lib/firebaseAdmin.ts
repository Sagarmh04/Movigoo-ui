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
    if (getApps().length === 0) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (!serviceAccountKey) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required");
      }
      
      let serviceAccount: any;
      try {
        serviceAccount = JSON.parse(serviceAccountKey);
      } catch (parseError) {
        throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      
      if (!serviceAccount.project_id) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY missing project_id");
      }
      
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      
      console.log("✅ Firebase Admin SDK initialized with service account");
    } else {
      adminApp = getApps()[0];
    }
    
    if (adminApp) {
      adminDb = getFirestore(adminApp);
      console.log("✅ Firebase Admin Firestore initialized (bypasses security rules)");
    } else {
      throw new Error("Failed to initialize Firebase Admin App");
    }
  } catch (error) {
    console.error("❌ Firebase Admin SDK initialization failed:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export { adminDb, adminApp };
export default adminDb;

