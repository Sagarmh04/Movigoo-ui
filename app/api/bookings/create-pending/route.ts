// app/api/bookings/create-pending/route.ts
// POST /api/bookings/create-pending
// Creates a pending booking before payment sure

import { NextRequest, NextResponse } from "next/server";
// CRITICAL: Use Admin SDK to bypass Firestore security rules
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";
import { verifyAuthToken } from "@/lib/auth";

export const runtime = "nodejs";

const SERVER_BOOKING_FEE = 7;

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
      price,
      totalAmount,
      items, // Array of { ticketTypeId, quantity, price }
      userEmail, // User email for sending confirmation email
      userName, // User name for email
      locationId, // Location ID for event bookings metadata
      locationName, // Location name
      venueId, // Venue ID for event bookings metadata
      showId, // Show ID for event bookings metadata
      showTime, // Show time
      orderId, // Cashfree order ID (if already created)
      organizerId, // Host/organizer ID for analytics tracking
    } = body;

    // Use authenticated user ID - ignore userId from body
    const userId = user.uid;

    const requestedTotalAmount = Number(totalAmount);
    const safeBookingFee = SERVER_BOOKING_FEE;

    if (!eventId || !Number.isFinite(requestedTotalAmount)) {
      return NextResponse.json(
        { error: "Missing required fields: eventId, totalAmount" },
        { status: 400 }
      );
    }

    // CRITICAL: Use Admin SDK (bypasses Firestore rules)
    if (!adminDb) {
      console.error("[Create-Pending] Firebase Admin SDK not initialized");
      return NextResponse.json(
        { error: "Database not initialized. Admin SDK setup required." },
        { status: 500 }
      );
    }

    const firestore = adminDb; // Admin SDK Firestore instance (bypasses rules)

    // Calculate requested quantity (derive ONLY from items to prevent fractional quantities)
    let requestedQuantity = 0;

    // Generate booking ID
    const bookingId = uuidv4();

    // CRITICAL: Use Firestore transaction for atomic inventory check + booking creation
    // Query global bookings collection (not subcollection) for better transaction support
    const eventRef = firestore.doc(`events/${eventId}`);
    
    // Pre-check: verify event exists before transaction
    const eventDoc = await eventRef.get();
    if (!eventDoc.exists) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // CRITICAL: Validate items array exists and has ticketTypeIds
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required field: items array with ticketTypeId" },
        { status: 400 }
      );
    }

    // Validate each item has ticketTypeId and quantity
    for (const item of items) {
      if (!item.ticketTypeId || typeof item.quantity !== "number" || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          { error: "Invalid item: each item must have ticketTypeId and quantity as a positive integer" },
          { status: 400 }
        );
      }
    }

    requestedQuantity = items.reduce((sum: number, i: any) => sum + i.quantity, 0);

    // CRITICAL: Validate requested quantity derived from items
    if (requestedQuantity <= 0) {
      return NextResponse.json(
        { error: "Invalid quantity: must be greater than 0" },
        { status: 400 }
      );
    }

    // Helper function to prepare booking data
    const prepareBookingData = (overrides?: {
      price: number;
      bookingFee: number;
      totalAmount: number;
      items: any[];
    }) => {
      const itemsToUse = overrides?.items ?? (items || []);
      return {
      bookingId,
      userId,
      eventId,
      eventTitle: eventTitle || "Event",
      coverUrl: coverUrl || "",
      venueName: venueName || "TBA",
      date: date || new Date().toISOString().split("T")[0],
      time: time || "00:00",
      ticketType: ticketType || (itemsToUse ? itemsToUse.map((i: any) => `${i.ticketTypeId} (${i.quantity})`).join(", ") : ""),
      quantity: requestedQuantity,
      price: overrides?.price ?? (price || (itemsToUse ? itemsToUse.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0) : 0)),
      bookingFee: overrides?.bookingFee ?? safeBookingFee,
      totalAmount: overrides?.totalAmount ?? totalAmount,
      items: itemsToUse,
      orderId: orderId || null,
      paymentGateway: "cashfree",
      paymentStatus: "INITIATED",
      bookingStatus: "PENDING",
      userEmail: userEmail || null,
      userName: userName || null,
      createdAt: FieldValue.serverTimestamp(),
      };
    };

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

    // CRITICAL: Use Firestore transaction for atomic ticketType-level inventory check + booking creation
    // PRODUCTION-READY: Inventory enforced at ticketType level (per venue/show/ticketType)
    // This prevents ALL race conditions and supports multiple ticket types per event
    try {
      console.log("[Create-Pending] Starting booking creation with ticketType-level inventory:", { 
        eventId, 
        itemsCount: items.length,
        requestedQuantity 
      });
      
      // ATOMIC TRANSACTION: Check ticketType inventory + increment + create booking in ONE transaction
      // CRITICAL: Firestore automatically retries transactions on conflicts
      // This ensures only ONE transaction succeeds when multiple users book simultaneously
      await firestore.runTransaction(async (transaction: any) => {
        // 1. Read event document inside transaction (atomic read)
        // FIX 6: Only read tickets field to reduce transaction payload
        const eventDocInTx = await transaction.get(eventRef);
        if (!eventDocInTx.exists) {
          throw new Error("Event not found");
        }

        const eventDataInTx = eventDocInTx.data();
        
        // 2. Get tickets structure (only field we need for inventory)
        const tickets = eventDataInTx.tickets || {};
        const venueConfigs = Array.isArray(tickets.venueConfigs) ? tickets.venueConfigs : [];
        
        if (venueConfigs.length === 0) {
          console.log("[Create-Pending] No ticket types configured - blocking booking for security");
          throw new Error("Ticket pricing not configured");
        }

        // 3. CRITICAL: Validate and check inventory for EACH ticketType in items
        // Build a map of ticketTypeId -> { venueConfigIndex, ticketTypeIndex, ticketType }
        const ticketTypeMap = new Map<string, { venueConfigIndex: number; ticketTypeIndex: number; ticketType: any }>();
        
        for (let vcIdx = 0; vcIdx < venueConfigs.length; vcIdx++) {
          const venueConfig = venueConfigs[vcIdx];
          const ticketTypes = Array.isArray(venueConfig.ticketTypes) ? venueConfig.ticketTypes : [];
          
          for (let ttIdx = 0; ttIdx < ticketTypes.length; ttIdx++) {
            const ticketType = ticketTypes[ttIdx];
            if (ticketType.id) {
              ticketTypeMap.set(ticketType.id, { venueConfigIndex: vcIdx, ticketTypeIndex: ttIdx, ticketType });
            }
          }
        }

        // 4. Validate all requested ticketTypes exist, calculate server-side price, and check inventory
        const inventoryUpdates: Array<{ venueConfigIndex: number; ticketTypeIndex: number; increment: number }> = [];
        const sanitizedItems: Array<{ ticketTypeId: string; quantity: number; price: number }> = [];
        let serverCalculatedPrice = 0;
        
        for (const item of items) {
          if (typeof item.quantity !== "number" || !Number.isInteger(item.quantity) || item.quantity <= 0) {
            throw new Error(`Invalid quantity for ticket type ${item.ticketTypeId}: must be a positive integer`);
          }

          const ticketTypeInfo = ticketTypeMap.get(item.ticketTypeId);
          
          if (!ticketTypeInfo) {
            throw new Error(`Ticket type not found: ${item.ticketTypeId}`);
          }

          const { ticketType } = ticketTypeInfo;
          const realPrice = typeof ticketType.price === "number" ? ticketType.price : Number(ticketType.price);
          if (!Number.isFinite(realPrice) || realPrice < 0) {
            throw new Error(`Invalid price configured for ticket type: ${item.ticketTypeId}`);
          }

          serverCalculatedPrice += realPrice * item.quantity;
          sanitizedItems.push({
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            price: realPrice,
          });

          const totalQuantity = typeof ticketType.totalQuantity === "number" ? ticketType.totalQuantity : 0;
          
          // Initialize ticketsSold if missing (backward compatibility)
          let ticketsSold = typeof ticketType.ticketsSold === "number" ? ticketType.ticketsSold : 0;
          
          // HARD ASSERT: Block if inventory is already invalid
          if (ticketsSold > totalQuantity) {
            console.error("[Create-Pending] HARD BLOCK — INVALID INVENTORY STATE:", {
              ticketTypeId: item.ticketTypeId,
              ticketsSold,
              totalQuantity,
              eventId,
              message: "ticketsSold exceeds totalQuantity - illegal write detected"
            });
            throw new Error(`HARD BLOCK — INVALID INVENTORY STATE for ticketType ${item.ticketTypeId}`);
          }

          // Check if this ticketType has inventory limits
          if (totalQuantity > 0) {
            // STRICT CHECK: Block if already sold out
            if (ticketsSold >= totalQuantity) {
              console.log("[Create-Pending] Ticket type sold out:", {
                ticketTypeId: item.ticketTypeId,
                ticketsSold,
                totalQuantity
              });
              throw new Error(`Ticket type ${ticketType.typeName || item.ticketTypeId} is sold out`);
            }

            // STRICT CHECK: Block if this booking would exceed capacity
            if (ticketsSold + item.quantity > totalQuantity) {
              console.log("[Create-Pending] Booking would exceed ticket type capacity:", {
                ticketTypeId: item.ticketTypeId,
                ticketsSold,
                requestedQuantity: item.quantity,
                totalQuantity,
                available: totalQuantity - ticketsSold
              });
              throw new Error(`Ticket type ${ticketType.typeName || item.ticketTypeId} is sold out`);
            }
          }

          // Track this ticketType for inventory update
          inventoryUpdates.push({
            venueConfigIndex: ticketTypeInfo.venueConfigIndex,
            ticketTypeIndex: ticketTypeInfo.ticketTypeIndex,
            increment: item.quantity
          });

          console.log("[Create-Pending] Ticket type inventory check passed:", {
            ticketTypeId: item.ticketTypeId,
            ticketsSold,
            requestedQuantity: item.quantity,
            totalQuantity,
            available: totalQuantity > 0 ? totalQuantity - ticketsSold : "unlimited"
          });
        }

        const serverCalculatedTotalAmount = serverCalculatedPrice + safeBookingFee;
        if (Math.abs(serverCalculatedTotalAmount - requestedTotalAmount) > 1) {
          console.error("[Create-Pending] Fraud Attempt — amount mismatch:", {
            bookingId,
            eventId,
            requestedTotalAmount,
            serverCalculatedTotalAmount,
            serverCalculatedPrice,
            safeBookingFee,
          });
          throw new Error("Fraud Attempt");
        }

        // 5. ATOMIC: Update ticketsSold for all ticketTypes (modify nested arrays)
        // CRITICAL: Since Firestore doesn't support updating nested array elements directly,
        // we must read the entire document, modify in memory, and write back (still atomic in transaction)
        const updatedVenueConfigs = [...venueConfigs];
        
        for (const update of inventoryUpdates) {
          const venueConfig = updatedVenueConfigs[update.venueConfigIndex];
          const ticketTypes = [...(venueConfig.ticketTypes || [])];
          const ticketType = { ...ticketTypes[update.ticketTypeIndex] };
          
          // Initialize ticketsSold if missing, then increment
          const currentTicketsSold = typeof ticketType.ticketsSold === "number" ? ticketType.ticketsSold : 0;
          ticketType.ticketsSold = currentTicketsSold + update.increment;
          
          ticketTypes[update.ticketTypeIndex] = ticketType;
          venueConfig.ticketTypes = ticketTypes;
          updatedVenueConfigs[update.venueConfigIndex] = venueConfig;
        }

        // Write updated tickets structure back to event document
        transaction.update(eventRef, {
          tickets: {
            ...tickets,
            venueConfigs: updatedVenueConfigs
          }
        });

        console.log("[Create-Pending] INVENTORY MUTATED FROM create-pending ONLY - updated", inventoryUpdates.length, "ticketType(s)");

        // 6. Create booking INSIDE same transaction (atomic write)
        // CRITICAL: Booking is only created if all inventory checks pass
        // If transaction retries due to conflict, this booking creation is also retried
        const bookingRef = firestore.doc(`bookings/${bookingId}`);
        const eventBookingRef = firestore.doc(`events/${eventId}/bookings/${bookingId}`);

        const bookingData = prepareBookingData({
          price: serverCalculatedPrice,
          bookingFee: safeBookingFee,
          totalAmount: serverCalculatedTotalAmount,
          items: sanitizedItems,
        });
        const eventBookingData = prepareEventBookingData(bookingData);

        // Write both documents atomically
        transaction.set(bookingRef, bookingData);
        transaction.set(eventBookingRef, eventBookingData);
        
        // 7. Update Host Analytics (if organizerId is provided)
        // This tracks total revenue and ticket sales for the event organizer
        if (organizerId) {
          const analyticsRef = firestore.doc(`host_analytics/${organizerId}`);
          
          // Use merge: true to create the document if it doesn't exist
          // FieldValue.increment() safely adds to existing numbers (or initializes to 0 if missing)
          transaction.set(analyticsRef, {
            totalRevenue: FieldValue.increment(serverCalculatedPrice), // Base price (excluding platform fee)
            totalTickets: FieldValue.increment(requestedQuantity),
            lastUpdated: FieldValue.serverTimestamp(),
          }, { merge: true });
          
          console.log("[Create-Pending] Host analytics update queued:", {
            organizerId,
            revenueIncrement: serverCalculatedPrice,
            ticketsIncrement: requestedQuantity
          });
        }
        
        console.log("[Create-Pending] Transaction prepared (will commit if no conflicts):", {
          bookingId,
          ticketTypesUpdated: inventoryUpdates.length,
          analyticsUpdated: !!organizerId
        });
      });

      console.log("[Create-Pending] Transaction committed successfully. Created pending booking:", bookingId);

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
      
      // Handle sold out errors (ticketType-level only)
      if (transactionError.message?.includes("sold out") ||
          (transactionError.message?.includes("Ticket type") && transactionError.message?.includes("sold out"))) {
        return NextResponse.json(
          { error: transactionError.message || "Tickets are sold out" },
          { status: 409 }
        );
      }

      // Handle fraud attempt errors
      if (transactionError.message?.includes("Fraud Attempt") || transactionError.message === "Fraud Attempt") {
        return NextResponse.json(
          { error: "Fraud Attempt" },
          { status: 400 }
        );
      }
      
      // Handle invalid inventory state
      if (transactionError.message?.includes("INVALID INVENTORY STATE") || 
          transactionError.message?.includes("HARD BLOCK")) {
        console.error("[Create-Pending] CRITICAL: Invalid inventory state detected");
        return NextResponse.json(
          { error: "Inventory error. Please contact support." },
          { status: 500 }
        );
      }
      
      // Other transaction errors (conflicts, retries, etc.)
      // CRITICAL: Firestore transactions automatically retry on conflicts
      // If we get here, it means the transaction failed after retries
      // This could be due to:
      // 1. Ticket types were sold out during retry (should have been caught above)
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
          { error: "Tickets are sold out" },
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

