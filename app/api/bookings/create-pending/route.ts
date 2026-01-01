// app/api/bookings/create-pending/route.ts
// POST /api/bookings/create-pending
// Creates a pending booking before payment sure

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseServer";
import { doc, setDoc, serverTimestamp, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { verifyAuthToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return NextResponse.json({ error: "Unauthorized: Missing or invalid Authorization header" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log("Token extracted:", token ? `${token.substring(0, 20)}...` : "NULL");
    
    const user = await verifyAuthToken(token);
    if (!user) {
      console.error("Token verification failed");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    console.log("User authenticated:", user.uid);

    const body = await req.json();
    const {
      eventId,
      eventTitle,
      coverUrl,
      venueName,
      date,
      time,
      ticketType,
      quantity,
      price,
      bookingFee,
      totalAmount,
      items, // Array of { ticketTypeId, quantity, price }
      userEmail, // User email for sending confirmation
      userName, // User name for email
      locationId, // Location ID for event bookings metadata
      locationName, // Location name
      venueId, // Venue ID for event bookings metadata
      showId, // Show ID for event bookings metadata
      showTime, // Show time
      orderId, // Cashfree order ID (if already created)
    } = body;

    // Use authenticated user ID - ignore userId from body
    const userId = user.uid;

    if (!eventId || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields: eventId, totalAmount" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    // Server-side inventory check: prevent overselling
    try {
      // Fetch event to get maxTickets
      const eventRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }

      const eventData = eventDoc.data();
      const maxTickets = typeof eventData.maxTickets === "number" ? eventData.maxTickets : null;

      // Only check inventory if maxTickets is set
      if (maxTickets !== null && maxTickets > 0) {
        // Query confirmed bookings for this event
        const eventBookingsRef = collection(db, "events", eventId, "bookings");
        const confirmedBookingsQuery = query(
          eventBookingsRef,
          where("bookingStatus", "==", "CONFIRMED"),
          where("paymentStatus", "==", "SUCCESS")
        );
        
        const confirmedBookingsSnapshot = await getDocs(confirmedBookingsQuery);
        
        // Sum up quantities from all confirmed bookings
        let totalConfirmedTickets = 0;
        confirmedBookingsSnapshot.docs.forEach((doc) => {
          const bookingData = doc.data();
          const bookingQuantity = typeof bookingData.quantity === "number" ? bookingData.quantity : 0;
          totalConfirmedTickets += bookingQuantity;
        });

        // Calculate requested quantity
        const requestedQuantity = quantity || (items ? items.reduce((sum: number, i: any) => sum + i.quantity, 0) : 0);

        // Check if adding this booking would exceed maxTickets
        if (totalConfirmedTickets + requestedQuantity > maxTickets) {
          return NextResponse.json(
            { error: "Event is sold out" },
            { status: 409 }
          );
        }
      }
    } catch (inventoryError: any) {
      // Log error but don't block booking if inventory check fails
      // This is a safety measure - we want bookings to work even if inventory check has issues
      console.error("Inventory check error:", inventoryError);
      // Continue with booking creation
    }

    console.log("Creating pending booking for userId:", userId, "eventId:", eventId);

    // Generate booking ID
    const bookingId = uuidv4();

    // Prepare booking data
    // CRITICAL: userId comes from authenticated token, not request body
    const bookingData = {
      bookingId,
      userId: user.uid, // Use authenticated user ID
      eventId,
      eventTitle: eventTitle || "Event",
      coverUrl: coverUrl || "",
      venueName: venueName || "TBA",
      date: date || new Date().toISOString().split("T")[0],
      time: time || "00:00",
      ticketType: ticketType || (items ? items.map((i: any) => `${i.ticketTypeId} (${i.quantity})`).join(", ") : ""),
      quantity: quantity || (items ? items.reduce((sum: number, i: any) => sum + i.quantity, 0) : 0),
      price: price || (items ? items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0) : 0),
      bookingFee: bookingFee || 0,
      totalAmount,
      items: items || [],
      orderId: orderId || null, // Store Cashfree order ID for webhook lookup
      paymentGateway: "cashfree",
      paymentStatus: "INITIATED",
      bookingStatus: "PENDING",
      userEmail: userEmail || null, // Store user email for email sending
      userName: userName || null, // Store user name for email
      createdAt: serverTimestamp(),
    };

    // Prepare event booking data with metadata for host queries
    const eventBookingData = {
      ...bookingData,
      // Metadata fields for querying by location/venue/show
      locationId: locationId || null,
      locationName: locationName || null,
      venueId: venueId || null,
      dateId: body.dateId || null,
      showId: showId || null,
      showTime: showTime || time || "00:00",
      showEndTime: body.showEndTime || null,
      venueAddress: body.venueAddress || null,
      // Composite fields for easy querying
      locationVenueKey: locationId && venueId ? `${locationId}_${venueId}` : null,
      venueShowKey: venueId && showId ? `${venueId}_${showId}` : null,
      dateTimeKey: date && (showTime || time) ? `${date}_${showTime || time}` : null,
    };

    // Save to Firestore in multiple locations
    // NOTE: We do NOT save to /users/{userId}/bookings because that's reserved for host users only
    const bookingRef = doc(db, "bookings", bookingId);
    // Save to /events/{eventId}/bookings/{bookingId} (with metadata for hosts)
    const eventBookingRef = doc(db, "events", eventId, "bookings", bookingId);

    await Promise.all([
      setDoc(bookingRef, bookingData),
      setDoc(eventBookingRef, eventBookingData),
    ]);

    console.log("Created pending booking:", bookingId);

    return NextResponse.json({
      success: true,
      bookingId,
      message: "Pending booking created",
    });
  } catch (err: any) {
    console.error("Error creating pending booking:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

