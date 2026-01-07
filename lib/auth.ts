// lib/auth.ts
// Server-side authentication verification

import { adminAuth } from "@/lib/firebaseAdmin";

export type AuthUser = {
  uid: string;
  email?: string;
  name?: string;
  phone?: string;
};

/**
 * Securely verifies Firebase ID Token using Admin SDK.
 * This prevents token forgery, expired tokens, and fake users.
 * 
 * Checks performed:
 * 1. Signature verification (cryptographically validates token is from Google)
 * 2. Expiration check (ensures token is still valid)
 * 3. Audience check (ensures token is for YOUR Firebase project)
 * 4. Issuer check (ensures token came from Firebase Auth)
 */
export async function verifyAuthToken(token: string): Promise<{ uid: string; email?: string | null } | null> {
  if (!token) {
    return null;
  }

  try {
    // CRITICAL: Use Admin SDK for cryptographic verification
    // This is the ONLY secure way to verify Firebase ID tokens
    if (!adminAuth) {
      console.error("❌ CRITICAL: Firebase Admin Auth not initialized");
      return null;
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      // You can also expose custom claims here if needed:
      // role: decodedToken.role,
      // isAdmin: decodedToken.admin,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

