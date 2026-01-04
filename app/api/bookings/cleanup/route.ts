// app/api/bookings/cleanup/route.ts
// GET /api/bookings/cleanup
// Cleans up abandoned PENDING bookings (> 15 minutes old) and restores inventory

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

const EXPIRATION_MINUTES = 15;

export async function GET(req: NextRequest) {
  try {
    console.log("[Cleanup] Starting abandoned booking cleanup");

    // CRITICAL: Use Admin SDK to bypass Firestore rules
    if (!adminDb) {
      console.error("[Cleanup] Firebase Admin SDK not initialized");
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const firestore = adminDb;
    const now = new Date();
    const expirationThreshold = new Date(now.getTime() - EXPIRATION_MINUTES * 60 * 1000);

    console.log("[Cleanup] Expiration threshold:", expirationThreshold.toISOString());

    // 1. Query for abandoned bookings
    // PENDING bookings older than 15 minutes
    const bookingsRef = firestore.collection("bookings");
    const abandonedBookingsSnapshot = await bookingsRef
      .where("bookingStatus", "==", "PENDING")
      .where("createdAt", "<", expirationThreshold)
      .limit(50) // Process in batches to avoid timeouts
      .get();

    if (abandonedBookingsSnapshot.empty) {
      console.log("[Cleanup] No abandoned bookings found");
      return NextResponse.json({
        success: true,
        message: "No abandoned bookings to clean",
        cleaned: 0,
        failed: 0,
      });
    }

    console.log("[Cleanup] Found", abandonedBookingsSnapshot.size, "abandoned bookings");

    let cleanedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // 2. Process each abandoned booking in its own transaction
    // CRITICAL: Each booking gets its own transaction to avoid read/write ordering issues
    for (const bookingDoc of abandonedBookingsSnapshot.docs) {
      const bookingId = bookingDoc.id;
      const bookingData = bookingDoc.data();

      try {
        console.log("[Cleanup] Processing booking:", bookingId);

        // Validate booking has required fields
        if (!bookingData.eventId) {
          console.warn("[Cleanup] Skipping booking with missing eventId:", bookingId);
          failedCount++;
          errors.push(`${bookingId}: Missing eventId`);
          continue;
        }

        // 3. Run separate transaction for this booking
        // ALL READS happen first, then ALL WRITES (Firestore requirement)
        await firestore.runTransaction(async (transaction) => {
          // === PHASE 1: ALL READS (must complete before any writes) ===
          
          // Read 1: Booking document
          const bookingRef = firestore.doc(`bookings/${bookingId}`);
          const bookingSnapshot = await transaction.get(bookingRef);

          if (!bookingSnapshot.exists) {
            throw new Error(`Booking ${bookingId} not found in transaction`);
          }

          const currentBookingData = bookingSnapshot.data();

          // Idempotency check: Skip if already processed
          if (currentBookingData?.bookingStatus !== "PENDING") {
            console.log("[Cleanup] Booking already processed:", bookingId, "status:", currentBookingData?.bookingStatus);
            return; // Exit transaction gracefully
          }

          // Read 2: Event document
          const eventRef = firestore.doc(`events/${bookingData.eventId}`);
          const eventSnapshot = await transaction.get(eventRef);

          // Read 3: Event booking subcollection (if exists)
          const eventBookingRef = firestore.doc(`events/${bookingData.eventId}/bookings/${bookingId}`);
          const eventBookingSnapshot = await transaction.get(eventBookingRef);

          // === PHASE 2: COMPUTE UPDATES (no reads or writes) ===

          const expiredBookingUpdate = {
            bookingStatus: "EXPIRED",
            paymentStatus: "FAILED",
            expiredAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          };

          // Handle missing event (ghost booking cleanup)
          if (!eventSnapshot.exists) {
            console.warn("[Cleanup] Event not found (ghost booking):", bookingData.eventId, "- cleaning booking only");
            
            // === PHASE 3: WRITES (no more reads allowed) ===
            // Just mark booking as EXPIRED, don't try to restore inventory
            transaction.update(bookingRef, expiredBookingUpdate);
            
            if (eventBookingSnapshot.exists) {
              transaction.update(eventBookingRef, expiredBookingUpdate);
            }
            
            console.log("[Cleanup] ✅ Ghost booking cleaned:", bookingId);
            return;
          }

          // Event exists - restore inventory
          const eventData = eventSnapshot.data();
          const tickets = eventData?.tickets || {};
          const venueConfigs = Array.isArray(tickets.venueConfigs) ? tickets.venueConfigs : [];

          if (venueConfigs.length === 0 || !bookingData.items || !Array.isArray(bookingData.items)) {
            console.log("[Cleanup] No inventory to restore for:", bookingId);
            
            // === PHASE 3: WRITES (no more reads allowed) ===
            transaction.update(bookingRef, expiredBookingUpdate);
            
            if (eventBookingSnapshot.exists) {
              transaction.update(eventBookingRef, expiredBookingUpdate);
            }
            
            return;
          }

          // Build ticketType map for fast lookup
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

          // Restore inventory for each item in booking
          const updatedVenueConfigs = [...venueConfigs];
          let inventoryRestored = false;

          for (const item of bookingData.items) {
            const ticketTypeInfo = ticketTypeMap.get(item.ticketTypeId);

            if (!ticketTypeInfo) {
              console.warn("[Cleanup] Ticket type not found:", item.ticketTypeId, "in event:", bookingData.eventId);
              continue; // Skip this item but continue processing
            }

            const { venueConfigIndex, ticketTypeIndex } = ticketTypeInfo;
            const venueConfig = updatedVenueConfigs[venueConfigIndex];
            const ticketTypes = [...(venueConfig.ticketTypes || [])];
            const ticketType = { ...ticketTypes[ticketTypeIndex] };

            const currentTicketsSold = typeof ticketType.ticketsSold === "number" ? ticketType.ticketsSold : 0;
            const quantityToRestore = typeof item.quantity === "number" ? item.quantity : 0;

            if (quantityToRestore <= 0) {
              console.warn("[Cleanup] Invalid quantity to restore:", quantityToRestore, "for booking:", bookingId);
              continue;
            }

            // CRITICAL: Decrement ticketsSold (restore inventory)
            // Ensure it doesn't go below 0 (safety check)
            const newTicketsSold = Math.max(0, currentTicketsSold - quantityToRestore);

            console.log("[Cleanup] Restoring inventory:", {
              ticketTypeId: item.ticketTypeId,
              currentTicketsSold,
              quantityToRestore,
              newTicketsSold,
            });

            ticketType.ticketsSold = newTicketsSold;
            ticketTypes[ticketTypeIndex] = ticketType;
            venueConfig.ticketTypes = ticketTypes;
            updatedVenueConfigs[venueConfigIndex] = venueConfig;

            inventoryRestored = true;
          }

          // === PHASE 3: ALL WRITES (no more reads allowed) ===
          
          // Write 1: Update event inventory if restored
          if (inventoryRestored) {
            transaction.update(eventRef, {
              tickets: {
                ...tickets,
                venueConfigs: updatedVenueConfigs,
              },
            });
            console.log("[Cleanup] Inventory restored for booking:", bookingId);
          }

          // Write 2: Mark main booking as EXPIRED
          transaction.update(bookingRef, expiredBookingUpdate);

          // Write 3: Mark event booking subcollection as EXPIRED (if exists)
          if (eventBookingSnapshot.exists) {
            transaction.update(eventBookingRef, expiredBookingUpdate);
          }

          console.log("[Cleanup] ✅ Successfully cleaned booking:", bookingId);
        });

        cleanedCount++;
      } catch (error: any) {
        console.error("[Cleanup] Failed to clean booking:", bookingId, error);
        failedCount++;
        errors.push(`${bookingId}: ${error.message}`);
      }
    }

    console.log("[Cleanup] Cleanup complete:", {
      total: abandonedBookingsSnapshot.size,
      cleaned: cleanedCount,
      failed: failedCount,
    });

    return NextResponse.json({
      success: true,
      message: "Cleanup completed",
      cleaned: cleanedCount,
      failed: failedCount,
      total: abandonedBookingsSnapshot.size,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[Cleanup] Critical error:", error);
    return NextResponse.json(
      {
        error: "Cleanup failed",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

