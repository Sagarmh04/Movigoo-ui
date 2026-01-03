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

    // CRITICAL: Log event data for debugging
    console.log("[Create-Pending] Event data:", { 
      eventId, 
      maxTickets, 
      ticketsSold: eventData.ticketsSold,
      hasTicketsSold: typeof eventData.ticketsSold === "number"
    });

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
      console.log("[Create-Pending] Starting booking creation:", { maxTickets, requestedQuantity });
      
      if (maxTickets !== null && maxTickets > 0) {
        console.log("[Create-Pending] Event has maxTickets limit, using transaction");
        // ATOMIC TRANSACTION: Check counter + increment + create booking in ONE transaction
        // CRITICAL: Firestore automatically retries transactions on conflicts
        // This ensures only ONE transaction succeeds when multiple users book simultaneously
        await runTransaction(firestore, async (transaction) => {
          // 1. Read event document inside transaction (atomic read)
          // CRITICAL: This read is part of the transaction snapshot
          // If another transaction modifies this document, Firestore will retry this transaction
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
          // CRITICAL: This value is from the transaction snapshot
          // If another transaction increments it, Firestore will retry and we'll see the new value
          const currentTicketsSold = typeof eventDataInTx.ticketsSold === "number" ? eventDataInTx.ticketsSold : 0;

          // 3. CRITICAL: Check if adding this booking would exceed maxTickets
          // This check happens INSIDE the transaction, so it's atomic
          // If two transactions run simultaneously:
          //   - Both read ticketsSold = 0
          //   - Both pass check (0 + 1 <= 1)
          //   - Both try to increment
          //   - Firestore detects conflict, retries one transaction
          //   - Retried transaction reads ticketsSold = 1 (from first transaction)
          //   - Retried transaction fails check (1 + 1 > 1) and throws error
          console.log("[Create-Pending] Inventory check (transaction snapshot):", { 
            currentTicketsSold, 
            requestedQuantity, 
            maxTicketsInTx, 
            wouldExceed: currentTicketsSold + requestedQuantity > maxTicketsInTx,
            available: maxTicketsInTx - currentTicketsSold
          });
          
          // STRICT CHECK: Block if already sold out
          if (currentTicketsSold >= maxTicketsInTx) {
            console.log("[Create-Pending] Event already sold out (current:", currentTicketsSold, "max:", maxTicketsInTx, ")");
            throw new Error("Event is sold out");
          }
          
          // STRICT CHECK: Block if this booking would exceed max
          if (currentTicketsSold + requestedQuantity > maxTicketsInTx) {
            console.log("[Create-Pending] Booking would exceed max tickets (current:", currentTicketsSold, "requested:", requestedQuantity, "max:", maxTicketsInTx, ")");
            throw new Error("Event is sold out");
          }

          // 4. ATOMIC: Increment ticketsSold counter (reserves tickets immediately)
          // CRITICAL: increment() is applied atomically at commit time
          // If another transaction also increments, Firestore detects conflict and retries
          console.log("[Create-Pending] Incrementing ticketsSold by", requestedQuantity, "(current:", currentTicketsSold, "-> new:", currentTicketsSold + requestedQuantity, ")");
          transaction.update(eventRef, {
            ticketsSold: increment(requestedQuantity),
          });

          // 5. Create booking INSIDE same transaction (atomic write)
          // CRITICAL: Booking is only created if increment succeeds
          // If transaction retries due to conflict, this booking creation is also retried
          const bookingRef = doc(firestore, "bookings", bookingId);
          const eventBookingRef = doc(firestore, "events", eventId, "bookings", bookingId);

          const bookingData = prepareBookingData();
          const eventBookingData = prepareEventBookingData(bookingData);

          // Write both documents atomically
          transaction.set(bookingRef, bookingData);
          transaction.set(eventBookingRef, eventBookingData);
          
          console.log("[Create-Pending] Transaction prepared (will commit if no conflicts):", {
            bookingId,
            ticketsSoldIncrement: requestedQuantity,
            newTicketsSold: currentTicketsSold + requestedQuantity
          });
        });

        console.log("[Create-Pending] Transaction committed successfully. Created pending booking:", bookingId);
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

      // Verify the counter was updated (read event again to confirm)
      const verifyEventDoc = await getDoc(eventRef);
      if (verifyEventDoc.exists()) {
        const verifyData = verifyEventDoc.data();
        const verifyTicketsSold = typeof verifyData.ticketsSold === "number" ? verifyData.ticketsSold : 0;
        console.log("[Create-Pending] Verification - ticketsSold after transaction:", verifyTicketsSold);
      }

      return NextResponse.json({
        success: true,
        bookingId,
        message: "Pending booking created",
      });
    } catch (transactionError: any) {
      console.error("[Create-Pending] Transaction error:", transactionError);
      console.error("[Create-Pending] Transaction error stack:", transactionError?.stack);
      
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
      
      // Other transaction errors (conflicts, retries, etc.)
      // CRITICAL: Firestore transactions automatically retry on conflicts
      // If we get here, it means the transaction failed after retries
      // This could be due to:
      // 1. Event was sold out during retry (should have been caught above)
      // 2. Network/connection issues
      // 3. Too many concurrent transactions (Firestore limit)
      console.error("[Create-Pending] Transaction failed after retries:", {
        message: transactionError.message,
        code: transactionError.code,
        stack: transactionError.stack
      });
      
      // If it's a conflict/retry issue, return sold out error to be safe
      // This prevents overselling if transaction retry logic fails
      if (transactionError.code === "aborted" || transactionError.message?.includes("concurrent")) {
        return NextResponse.json(
          { error: "Event is sold out" },
          { status: 409 }
        );
      }
      
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

