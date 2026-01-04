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

    // Step 1: Query for abandoned bookings (PENDING status > 15 minutes old)
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

    // Step 2: Initialize counters
    let cleanedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Step 3: Loop through each abandoned booking
    // CRITICAL: Each booking gets its own separate transaction
    for (const bookingDoc of abandonedBookingsSnapshot.docs) {
      const bookingId = bookingDoc.id;
      const bookingData = bookingDoc.data();

      // Skip bookings without eventId
      if (!bookingData.eventId) {
        console.warn("[Cleanup] Skipping booking with missing eventId:", bookingId);
        failedCount++;
        errors.push(`${bookingId}: Missing eventId`);
        continue;
      }

      try {
        console.log("[Cleanup] Processing booking:", bookingId);

        // Step 4: Open a NEW transaction for THIS booking only
        await firestore.runTransaction(async (transaction) => {
          // ========================================
          // STEP A: ALL READS (must happen first)
          // ========================================

          const bookingRef = firestore.doc(`bookings/${bookingId}`);
          const eventRef = firestore.doc(`events/${bookingData.eventId}`);
          const eventBookingRef = firestore.doc(`events/${bookingData.eventId}/bookings/${bookingId}`);

          // Read 1: Re-read booking to ensure still PENDING (idempotency)
          const bookingSnapshot = await transaction.get(bookingRef);

          if (!bookingSnapshot.exists) {
            throw new Error(`Booking ${bookingId} not found`);
          }

          const currentBookingData = bookingSnapshot.data();

          // Skip if already processed
          if (currentBookingData?.bookingStatus !== "PENDING") {
            console.log("[Cleanup] Already processed:", bookingId);
            return;
          }

          // Read 2: Get the Event document
          const eventSnapshot = await transaction.get(eventRef);

          // Read 3: Check if event booking subcollection exists
          const eventBookingSnapshot = await transaction.get(eventBookingRef);

          // ========================================
          // STEP B: LOGIC (no reads, no writes)
          // ========================================

          const expiredUpdate = {
            bookingStatus: "EXPIRED",
            paymentStatus: "FAILED",
            expiredAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          };

          // Check if Event exists
          const eventExists = eventSnapshot.exists;

          let eventInventoryUpdate = null;

          if (eventExists) {
            // Event exists - prepare inventory restoration
            const eventData = eventSnapshot.data();
            const tickets = eventData?.tickets || {};
            const venueConfigs = Array.isArray(tickets.venueConfigs) ? tickets.venueConfigs : [];

            if (venueConfigs.length > 0 && bookingData.items && Array.isArray(bookingData.items)) {
              // Build ticketType map
              const ticketTypeMap = new Map<string, { vcIdx: number; ttIdx: number }>();

              for (let vcIdx = 0; vcIdx < venueConfigs.length; vcIdx++) {
                const venueConfig = venueConfigs[vcIdx];
                const ticketTypes = Array.isArray(venueConfig.ticketTypes) ? venueConfig.ticketTypes : [];

                for (let ttIdx = 0; ttIdx < ticketTypes.length; ttIdx++) {
                  const ticketType = ticketTypes[ttIdx];
                  if (ticketType.id) {
                    ticketTypeMap.set(ticketType.id, { vcIdx, ttIdx });
                  }
                }
              }

              // Clone venueConfigs and restore inventory
              const updatedVenueConfigs = JSON.parse(JSON.stringify(venueConfigs));
              let inventoryChanged = false;

              for (const item of bookingData.items) {
                const mapping = ticketTypeMap.get(item.ticketTypeId);
                if (!mapping) continue;

                const { vcIdx, ttIdx } = mapping;
                const ticketType = updatedVenueConfigs[vcIdx].ticketTypes[ttIdx];

                const currentSold = typeof ticketType.ticketsSold === "number" ? ticketType.ticketsSold : 0;
                const quantityToRestore = typeof item.quantity === "number" ? item.quantity : 0;

                if (quantityToRestore > 0) {
                  // Decrement ticketsSold (restore inventory)
                  ticketType.ticketsSold = Math.max(0, currentSold - quantityToRestore);
                  inventoryChanged = true;

                  console.log("[Cleanup] Restoring:", {
                    ticketTypeId: item.ticketTypeId,
                    before: currentSold,
                    restoring: quantityToRestore,
                    after: ticketType.ticketsSold,
                  });
                }
              }

              if (inventoryChanged) {
                eventInventoryUpdate = {
                  tickets: {
                    ...tickets,
                    venueConfigs: updatedVenueConfigs,
                  },
                };
              }
            }
          } else {
            // Event does NOT exist (ghost booking)
            console.warn("[Cleanup] Ghost booking - event does not exist:", bookingData.eventId);
          }

          // ========================================
          // STEP C: ALL WRITES (after all reads)
          // ========================================

          // Write 1: Update event inventory (if event exists and inventory needs restoration)
          if (eventExists && eventInventoryUpdate) {
            transaction.update(eventRef, eventInventoryUpdate);
            console.log("[Cleanup] Inventory restored for event:", bookingData.eventId);
          }

          // Write 2: Mark booking as EXPIRED
          transaction.update(bookingRef, expiredUpdate);

          // Write 3: Mark event booking subcollection as EXPIRED (if exists)
          if (eventBookingSnapshot.exists) {
            transaction.update(eventBookingRef, expiredUpdate);
          }

          if (eventExists) {
            console.log("[Cleanup] ✅ Booking cleaned (inventory restored):", bookingId);
          } else {
            console.log("[Cleanup] ✅ Ghost booking cleaned:", bookingId);
          }
        });

        // Transaction succeeded
        cleanedCount++;
      } catch (error: any) {
        console.error("[Cleanup] Failed to clean booking:", bookingId, error.message);
        failedCount++;
        errors.push(`${bookingId}: ${error.message}`);
      }
    }

    // Step 5: Return final stats
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

