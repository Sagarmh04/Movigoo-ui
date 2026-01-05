// app/api/bookings/cleanup/route.ts
// GET /api/bookings/cleanup
// Cleans up abandoned PENDING bookings (> 15 minutes old) and restores inventory

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin"; // ✅ Correct Admin SDK import

// 🔴 FIX 1: Prevent "Static Generation" Timeout during Build
// This tells Next.js: "Don't run this during npm run build. Only run on request."
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    console.log("[Cleanup] Starting abandoned booking cleanup");

    const { searchParams } = new URL(request.url);
    const keyFromUrl = searchParams.get("key");
    const keyFromHeader = request.headers.get("x-cron-key");
    const receivedKey = keyFromUrl ?? keyFromHeader;

    const expectedSecret = process.env.CRON_SECRET;
    const maskedExpectedSecret = expectedSecret?.trim()
      ? `${expectedSecret.trim().substring(0, 3)}***`
      : undefined;

    console.log(
      `[Cleanup][Auth] key(url)=${keyFromUrl ?? "<missing>"} expected(env)=${maskedExpectedSecret ?? "<missing>"}`
    );

    if (receivedKey?.trim() !== expectedSecret?.trim()) {
      console.error(
        "Auth Failure: Received " + (receivedKey ?? "<missing>") + " but expected " + (maskedExpectedSecret ?? "<missing>")
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Admin SDK is initialized
    if (!adminDb) {
      console.error("[Cleanup] Admin SDK not initialized");
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    // 15 minutes ago
    const now = new Date();
    const expirationThreshold = new Date(now.getTime() - 15 * 60 * 1000);

    // 🔴 FIX 2: Limit to 5 items to respect Vercel Hobby Tier (10s Timeout)
    // 5 items * ~1.5s each = ~7.5s (Safe zone)
    const bookingsRef = adminDb.collection("bookings");
    const snapshot = await bookingsRef
      .where("bookingStatus", "==", "PENDING")
      .where("createdAt", "<", expirationThreshold)
      .limit(5) 
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ 
        success: true, 
        message: "No abandoned bookings found", 
        cleaned: 0 
      });
    }

    console.log(`[Cleanup] Found ${snapshot.size} abandoned bookings`);

    let cleanedCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // Process bookings one by one (Sequential is safer for timeouts)
    for (const doc of snapshot.docs) {
      const bookingId = doc.id;

      try {
        // Capture adminDb in closure to satisfy TypeScript
        const db = adminDb;
        
        await db.runTransaction(async (transaction) => {
          // 1. Re-read Booking (Safety check inside transaction)
          const bookingRef = bookingsRef.doc(bookingId);
          const freshSnap = await transaction.get(bookingRef);
          
          if (!freshSnap.exists) return;
          const freshData = freshSnap.data();
          if (freshData?.bookingStatus !== "PENDING") return;

          // 2. Check Event
          if (!freshData.eventId) {
             // Invalid booking -> Just Expire
             transaction.update(bookingRef, { 
               bookingStatus: "EXPIRED", 
               paymentStatus: "FAILED" 
             });
             return;
          }

          const eventRef = db.collection("events").doc(freshData.eventId);
          const eventSnap = await transaction.get(eventRef);

          // 🔴 FIX 3: Handle "Ghost" Events (Deleted events)
          if (!eventSnap.exists) {
            console.warn(`[Cleanup] Event ${freshData.eventId} not found. Expiring booking.`);
            transaction.update(bookingRef, { 
               bookingStatus: "EXPIRED", 
               paymentStatus: "FAILED" 
            });
            return;
          }

          const eventData = eventSnap.data();
          
          // 3. Restore Inventory Logic
          const venueConfigs = eventData?.tickets?.venueConfigs || [];
          // Clone deeply to avoid reference issues
          const updatedVenueConfigs = JSON.parse(JSON.stringify(venueConfigs));
          let inventoryRestored = false;

          if (freshData.items && Array.isArray(freshData.items)) {
            for (const item of freshData.items) {
               updatedVenueConfigs.forEach((vc: any) => {
                 const tTypes = vc.ticketTypes || [];
                 const tIndex = tTypes.findIndex((t: any) => t.id === item.ticketTypeId);
                 
                 if (tIndex !== -1) {
                   const currentSold = tTypes[tIndex].ticketsSold || 0;
                   // Restore: Decrease sold count (don't go below 0)
                   tTypes[tIndex].ticketsSold = Math.max(0, currentSold - item.quantity);
                   inventoryRestored = true;
                 }
                 vc.ticketTypes = tTypes;
               });
            }
          }

          // 4. Execute Writes
          if (inventoryRestored) {
            transaction.update(eventRef, { "tickets.venueConfigs": updatedVenueConfigs });
            console.log(`[Cleanup] Inventory restored for event: ${freshData.eventId}`);
          }
          
          transaction.update(bookingRef, { 
            bookingStatus: "EXPIRED", 
            paymentStatus: "FAILED" 
          });
        });

        cleanedCount++;
        console.log(`[Cleanup] ✅ Cleared: ${bookingId}`);

      } catch (err: any) {
        console.error(`[Cleanup] ❌ Error on ${bookingId}:`, err);
        failCount++;
        errors.push(`${bookingId}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      cleaned: cleanedCount,
      failed: failCount,
      remaining_backlog: snapshot.size - (cleanedCount + failCount),
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error("[Cleanup] CRITICAL FAIL:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
