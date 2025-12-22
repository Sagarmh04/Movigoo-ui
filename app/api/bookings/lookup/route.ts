// app/api/bookings/lookup/route.ts
// POST /api/bookings/lookup
// Get user's bookings securely

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth";
import { db } from "@/lib/firebaseServer";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyAuthToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    
    const { limit: limitCount = 50 } = body;

    // Fetch bookings from Firestore - simple structure: /users/{userId}/bookings
    const { collection, query, getDocs, orderBy, limit: limitQuery } = await import("firebase/firestore");
    const bookingsRef = collection(db!, "users", user.uid, "bookings");
    const q = query(
      bookingsRef,
      orderBy("createdAt", "desc"),
      limitQuery(limitCount)
    );

    const snapshot = await getDocs(q);
    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json({
      success: true,
      bookings,
    });
  } catch (error: any) {
    console.error("Bookings lookup error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

