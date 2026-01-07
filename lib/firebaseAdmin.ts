// lib/firebaseAdmin.ts
// Firebase Admin SDK initialization (bypasses Firestore security rules)
// CRITICAL: Use this ONLY in API routes (/app/api/**)
// NEVER import this in components, hooks, or client-side code

// @ts-ignore - firebase-admin is server-only, Next.js may try to bundle it
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
// @ts-ignore - firebase-admin is server-only, Next.js may try to bundle it
import { getFirestore, Firestore } from "firebase-admin/firestore";
// @ts-ignore - firebase-admin is server-only, Next.js may try to bundle it
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;

if (typeof window === "undefined") {
  // Server-side only
  try {
    if (getApps().length === 0) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      // During build, env vars may not be available - initialize lazily at runtime
      if (!serviceAccountKey) {
        console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not set - Admin SDK will initialize at runtime");
        // Don't throw during build - will be initialized when actually needed
        if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
          // Only warn in production builds, not during Next.js build
          console.warn("Admin SDK not initialized - will be available at runtime");
        }
      } else {
      
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
      }
    } else {
      adminApp = getApps()[0];
    }
    
    if (adminApp) {
      adminDb = getFirestore(adminApp);
      adminAuth = getAuth(adminApp);
      console.log("✅ Firebase Admin Firestore initialized (bypasses security rules)");
      console.log("✅ Firebase Admin Auth initialized (secure JWT verification)");
    }
  } catch (error) {
    // During build, don't throw - will initialize at runtime
    if (process.env.NODE_ENV !== "production" || process.env.VERCEL) {
      console.error("❌ Firebase Admin SDK initialization failed:", error instanceof Error ? error.message : String(error));
      // Only throw in development or if explicitly in Vercel (runtime)
      if (process.env.NODE_ENV === "development") {
        throw error;
      }
    } else {
      console.warn("⚠️ Firebase Admin SDK not initialized during build - will initialize at runtime");
    }
  }
}

export { adminDb, adminApp, adminAuth };
export default adminDb;

