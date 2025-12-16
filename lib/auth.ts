// lib/auth.ts
// Server-side authentication verification
// TODO: Upgrade to firebase-admin for production token verification

export type AuthUser = {
  uid: string;
  email?: string;
  name?: string;
  phone?: string;
};

/**
 * Verify Firebase ID token
 * For now, accepts user info from authenticated client
 * TODO: Implement proper JWT verification using firebase-admin or Firebase REST API
 */
export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  try {
    if (!token || typeof token !== "string") {
      return null;
    }

    // For now, decode JWT token to extract user info
    // TODO: In production, use firebase-admin verifyIdToken() for proper verification
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) {
      return null;
    }

    // Decode payload (base64url) - works in Node.js
    let payload: any;
    try {
      if (typeof window === "undefined") {
        // Server-side: use Buffer
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const decoded = Buffer.from(base64, "base64").toString("utf-8");
        payload = JSON.parse(decoded);
      } else {
        // Client-side: use atob (shouldn't happen, but fallback)
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const decoded = atob(base64);
        payload = JSON.parse(decoded);
      }
    } catch (parseError) {
      console.error("JWT decode error:", parseError);
      return null;
    }

    // Basic validation
    if (!payload || typeof payload !== "object" || !payload.sub) {
      return null;
    }

    // Check audience matches Firebase project
    const expectedAud = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (expectedAud && payload.aud && payload.aud !== expectedAud) {
      return null;
    }

    // Check expiration
    if (payload.exp && typeof payload.exp === "number" && payload.exp < Date.now() / 1000) {
      return null;
    }

    return {
      uid: payload.sub,
      email: payload.email || undefined,
      name: payload.name || undefined,
      phone: payload.phone_number || undefined,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

