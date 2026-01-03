// app/api/bookings/create-pending/route.ts
// POST /api/bookings/create-pending
// Creates a pending booking before payment sure

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseServer";
import { doc, setDoc, serverTimestamp, getDoc, runTransaction, increment, collection, query, where, getDocs } from "firebase/firestore";
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
    // Query global bookings collection (not subcollection) for better transaction support
    const eventRef = doc(firestore, "events", eventId);
    
    // Pre-check: verify event exists before transaction
    const eventDoc = await getDoc(eventRef);
    if (!eventDoc.exists()) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const eventData = eventDoc.data();
    const maxTickets = typeof eventData.maxTickets === "number" ? eventData.maxTickets : null;

    // CRITICAL: Validate requested quantity
    if (requestedQuantity <= 0) {
      return NextResponse.json(
        { error: "Invalid quantity: must be greater than 0" },
        { status: 400 }
      );
    }

    // Helper function to prepare booking data
    const prepareBookingData = () => ({
      bookingId,
      userId: user.uid,
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
    });

    const prepareEventBookingData = (bookingData: any) => ({
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
    });

    // CRITICAL: Use Firestore transaction for atomic inventory check + booking creation
    // PERMANENT FIX: Use ticketsSold counter field on event document
    // This prevents ALL race conditions by using atomic counter operations
    try {
      if (maxTickets !== null && maxTickets > 0) {
        // ATOMIC TRANSACTION: Check counter + increment + create booking in ONE transaction
        await runTransaction(firestore, async (transaction) => {
          // 1. Read event document inside transaction (atomic read)
          const eventDocInTx = await transaction.get(eventRef);
          if (!eventDocInTx.exists()) {
            throw new Error("Event not found");
          }

          const eventDataInTx = eventDocInTx.data();
          const maxTicketsInTx = typeof eventDataInTx.maxTickets === "number" ? eventDataInTx.maxTickets : null;

          if (maxTicketsInTx === null || maxTicketsInTx <= 0) {
            // No inventory limit - proceed without counter check
            const bookingRef = doc(firestore, "bookings", bookingId);
            const eventBookingRef = doc(firestore, "events", eventId, "bookings", bookingId);

            const bookingData = prepareBookingData();
            const eventBookingData = prepareEventBookingData(bookingData);

            transaction.set(bookingRef, bookingData);
            transaction.set(eventBookingRef, eventBookingData);
            return; // Exit transaction early
          }

          // 2. Get current ticketsSold counter (defaults to 0 if not set)
          // CRITICAL: If field doesn't exist, Firestore increment() will create it starting from 0
          // But we need to check the current value for validation
          const currentTicketsSold = typeof eventDataInTx.ticketsSold === "number" ? eventDataInTx.ticketsSold : 0;

          // 3. CRITICAL: Check if adding this booking would exceed maxTickets
          // This check happens INSIDE the transaction, so it's atomic
          // Block if: already sold out OR adding this booking would exceed max
          console.log("[Create-Pending] Inventory check:", { 
            currentTicketsSold, 
            requestedQuantity, 
            maxTicketsInTx, 
            wouldExceed: currentTicketsSold + requestedQuantity > maxTicketsInTx 
          });
          
          if (currentTicketsSold >= maxTicketsInTx) {
            console.log("[Create-Pending] Event already sold out");
            throw new Error("Event is sold out");
          }
          
          if (currentTicketsSold + requestedQuantity > maxTicketsInTx) {
            console.log("[Create-Pending] Booking would exceed max tickets");
            throw new Error("Event is sold out");
          }

          // 4. ATOMIC: Increment ticketsSold counter (reserves tickets immediately)
          // This prevents concurrent bookings from overselling
          transaction.update(eventRef, {
            ticketsSold: increment(requestedQuantity),
          });

          // 5. Create booking INSIDE same transaction (atomic write)
          const bookingRef = doc(firestore, "bookings", bookingId);
          const eventBookingRef = doc(firestore, "events", eventId, "bookings", bookingId);

          const bookingData = prepareBookingData();
          const eventBookingData = prepareEventBookingData(bookingData);

          // Write both documents atomically
          transaction.set(bookingRef, bookingData);
          transaction.set(eventBookingRef, eventBookingData);
        });

        console.log("Created pending booking (with atomic counter transaction):", bookingId);
      } else {
        // No maxTickets - create booking without transaction (no inventory constraint)
        const bookingRef = doc(firestore, "bookings", bookingId);
        const eventBookingRef = doc(firestore, "events", eventId, "bookings", bookingId);

        const bookingData = prepareBookingData();
        const eventBookingData = prepareEventBookingData(bookingData);

        await Promise.all([
          setDoc(bookingRef, bookingData),
          setDoc(eventBookingRef, eventBookingData),
        ]);

        console.log("Created pending booking (no inventory limit):", bookingId);
      }

      return NextResponse.json({
        success: true,
        bookingId,
        message: "Pending booking created",
      });
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
  } catch (err: any) {
    console.error("Error creating pending booking:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

