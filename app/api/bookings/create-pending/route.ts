// app/api/bookings/create-pending/route.ts
// POST /api/bookings/create-pending
// Creates a pending booking before payment sure

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseServer";
import { doc, setDoc, serverTimestamp, getDoc, collection, query, where, getDocs, runTransaction } from "firebase/firestore";
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

    const firestore = db; // TypeScript inference helper

    // Calculate requested quantity
    const requestedQuantity = quantity || (items ? items.reduce((sum: number, i: any) => sum + i.quantity, 0) : 0);

    // Generate booking ID
    const bookingId = uuidv4();

    // CRITICAL: Use Firestore transaction for atomic inventory check + booking creation
    try {
      // First, query confirmed bookings OUTSIDE transaction to get document IDs
      // Then read each document INSIDE transaction for atomic consistency
      let confirmedBookingIds: string[] = [];
      const eventRef = doc(firestore, "events", eventId);
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
        const eventBookingsRef = collection(firestore, "events", eventId, "bookings");
        const confirmedBookingsQuery = query(
          eventBookingsRef,
          where("bookingStatus", "==", "CONFIRMED"),
          where("paymentStatus", "==", "SUCCESS")
        );
        
        // Query outside transaction to get document IDs
        const confirmedBookingsSnapshot = await getDocs(confirmedBookingsQuery);
        confirmedBookingIds = confirmedBookingsSnapshot.docs.map(d => d.id);
      }

      // Now run transaction: read each confirmed booking + create new booking atomically
      await runTransaction(firestore, async (transaction) => {
        // 1. Re-read event document inside transaction (for consistency)
        const eventDocInTx = await transaction.get(eventRef);
        if (!eventDocInTx.exists()) {
          throw new Error("Event not found");
        }

        const eventDataInTx = eventDocInTx.data();
        const maxTicketsInTx = typeof eventDataInTx.maxTickets === "number" ? eventDataInTx.maxTickets : null;

        // 2. Only check inventory if maxTickets is set
        if (maxTicketsInTx !== null && maxTicketsInTx > 0) {
          // 3. Read each confirmed booking INSIDE transaction (atomic reads)
          let totalConfirmedTickets = 0;
          for (const bookingId of confirmedBookingIds) {
            const bookingRef = doc(firestore, "events", eventId, "bookings", bookingId);
            const bookingSnap = await transaction.get(bookingRef);
            if (bookingSnap.exists()) {
              const bookingData = bookingSnap.data() as any;
              const bookingQuantity = typeof bookingData.quantity === "number" ? bookingData.quantity : 0;
              // Double-check status in case it changed
              if (bookingData.bookingStatus === "CONFIRMED" && bookingData.paymentStatus === "SUCCESS") {
                totalConfirmedTickets += bookingQuantity;
              }
            }
          }

          // 4. Check if adding this booking would exceed maxTickets
          if (totalConfirmedTickets + requestedQuantity > maxTicketsInTx) {
            throw new Error("Event is sold out");
          }
        }

        // 6. Create booking INSIDE same transaction (atomic)
        const bookingRef = doc(firestore, "bookings", bookingId);
        const eventBookingRef = doc(firestore, "events", eventId, "bookings", bookingId);

        // Prepare booking data
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
          quantity: requestedQuantity,
          price: price || (items ? items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0) : 0),
          bookingFee: bookingFee || 0,
          totalAmount,
          items: items || [],
          orderId: orderId || null,
          paymentGateway: "cashfree",
          paymentStatus: "INITIATED",
          bookingStatus: "PENDING",
          userEmail: userEmail || null,
          userName: userName || null,
          createdAt: serverTimestamp(),
        };

        // Prepare event booking data with metadata
        const eventBookingData = {
          ...bookingData,
          locationId: locationId || null,
          locationName: locationName || null,
          venueId: venueId || null,
          dateId: body.dateId || null,
          showId: showId || null,
          showTime: showTime || time || "00:00",
          showEndTime: body.showEndTime || null,
          venueAddress: body.venueAddress || null,
          locationVenueKey: locationId && venueId ? `${locationId}_${venueId}` : null,
          venueShowKey: venueId && showId ? `${venueId}_${showId}` : null,
          dateTimeKey: date && (showTime || time) ? `${date}_${showTime || time}` : null,
        };

        // Write both documents atomically
        transaction.set(bookingRef, bookingData);
        transaction.set(eventBookingRef, eventBookingData);
      });

      console.log("Created pending booking (with transaction):", bookingId);
    } catch (transactionError: any) {
      console.error("Transaction error:", transactionError);
      
      // Handle specific errors
      if (transactionError.message === "Event not found") {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }
      
      if (transactionError.message === "Event is sold out") {
        return NextResponse.json(
          { error: "Event is sold out" },
          { status: 409 }
        );
      }
      
      // Other transaction errors (conflicts, etc.)
      return NextResponse.json(
        { error: "Failed to create booking. Please try again." },
        { status: 503 }
      );
    }

    // Booking creation is now done inside transaction above

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

