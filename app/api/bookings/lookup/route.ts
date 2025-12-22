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

    // Fetch bookings from Firestore - new structure: /users/{userId}/events/{eventId}/bookings
    const { collection, query, getDocs, orderBy, limit: limitQuery } = await import("firebase/firestore");
    
    // Get all events for this user
    const userEventsRef = collection(db!, "users", user.uid, "events");
    const eventsSnapshot = await getDocs(userEventsRef);
    
    // Collect all bookings from all events
    const allBookings: any[] = [];
    
    for (const eventDoc of eventsSnapshot.docs) {
      const eventId = eventDoc.id;
      const eventBookingsRef = collection(db!, "users", user.uid, "events", eventId, "bookings");
      const eventBookingsQuery = query(
        eventBookingsRef,
        orderBy("createdAt", "desc")
      );
      const eventBookingsSnapshot = await getDocs(eventBookingsQuery);
      
      const eventBookings = eventBookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        eventId: eventId,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
      }));
      
      allBookings.push(...eventBookings);
    }
    
    // Sort all bookings by createdAt desc and limit
    allBookings.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    const bookings = allBookings.slice(0, limitCount);

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

