// app/api/bookings/create-pending/route.ts
// POST /api/bookings/create-pending
// Creates a pending booking before payment sure

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseServer";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
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

    if (!userId || !eventId || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields: userId, eventId, totalAmount" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    console.log("Creating pending booking for userId:", userId, "eventId:", eventId);

    // Generate booking ID
    const bookingId = uuidv4();

    // Prepare booking data
    const bookingData = {
      bookingId,
      userId,
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
      paymentStatus: "PENDING",
      bookingStatus: "PENDING_PAYMENT",
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

