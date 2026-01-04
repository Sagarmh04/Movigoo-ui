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

    // 2. Process each abandoned booking
    for (const bookingDoc of abandonedBookingsSnapshot.docs) {
      const bookingId = bookingDoc.id;
      const bookingData = bookingDoc.data();

      try {
        console.log("[Cleanup] Processing booking:", bookingId);

        // Validate booking has required fields
        if (!bookingData.eventId || !bookingData.items || !Array.isArray(bookingData.items)) {
          console.warn("[Cleanup] Skipping booking with missing eventId or items:", bookingId);
          failedCount++;
          errors.push(`${bookingId}: Missing eventId or items`);
          continue;
        }

        // 3. Use transaction to restore inventory atomically
        await firestore.runTransaction(async (transaction) => {
          // Re-read booking inside transaction to ensure it's still PENDING
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

          // Read event document
          const eventRef = firestore.doc(`events/${bookingData.eventId}`);
          const eventSnapshot = await transaction.get(eventRef);

          if (!eventSnapshot.exists) {
            console.warn("[Cleanup] Event not found:", bookingData.eventId);
            throw new Error(`Event ${bookingData.eventId} not found`);
          }

          const eventData = eventSnapshot.data();
          const tickets = eventData?.tickets || {};
          const venueConfigs = Array.isArray(tickets.venueConfigs) ? tickets.venueConfigs : [];

          if (venueConfigs.length === 0) {
            console.log("[Cleanup] No venue configs found, skipping inventory restoration for:", bookingId);
            // Still mark booking as expired even if no inventory to restore
            transaction.update(bookingRef, {
              bookingStatus: "EXPIRED",
              paymentStatus: "FAILED",
              expiredAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
            return;
          }

          // 4. Build ticketType map for fast lookup
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

          // 5. Restore inventory for each item in booking
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

          // 6. Write updates to Firestore
          if (inventoryRestored) {
            // Update event document with restored inventory
            transaction.update(eventRef, {
              tickets: {
                ...tickets,
                venueConfigs: updatedVenueConfigs,
              },
            });

            console.log("[Cleanup] Inventory restored for booking:", bookingId);
          }

          // 7. Mark booking as EXPIRED
          transaction.update(bookingRef, {
            bookingStatus: "EXPIRED",
            paymentStatus: "FAILED",
            expiredAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          // 8. Also update event booking subcollection if exists
          const eventBookingRef = firestore.doc(`events/${bookingData.eventId}/bookings/${bookingId}`);
          const eventBookingSnapshot = await transaction.get(eventBookingRef);

          if (eventBookingSnapshot.exists) {
            transaction.update(eventBookingRef, {
              bookingStatus: "EXPIRED",
              paymentStatus: "FAILED",
              expiredAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
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

