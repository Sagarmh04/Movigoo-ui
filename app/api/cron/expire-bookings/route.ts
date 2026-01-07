// Booking expiry mechanism
// Called by external cron service to expire PENDING bookings older than 15 minutes
// External cron should call: GET /api/cron/expire-bookings with Authorization: Bearer <CRON_SECRET>

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret (external cron service must provide this)
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    // Find PENDING bookings older than 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const bookingsRef = adminDb.collection("bookings");
    const expiredBookings = await bookingsRef
      .where("bookingStatus", "==", "PENDING")
      .where("paymentStatus", "in", ["PENDING", "INITIATED"])
      .where("createdAt", "<", fifteenMinutesAgo)
      .limit(100) // Process 100 at a time
      .get();

    if (expiredBookings.empty) {
      console.log("[Cron] No expired bookings found");
      return NextResponse.json({ expired: 0 });
    }

    let expiredCount = 0;
    const batch = adminDb.batch();

    for (const bookingDoc of expiredBookings.docs) {
      const booking = bookingDoc.data();
      const eventId = booking.eventId;
      const items = booking.items || [];

      // Mark booking as EXPIRED
      batch.update(bookingDoc.ref, {
        bookingStatus: "EXPIRED",
        paymentStatus: "EXPIRED",
        expiredAt: FieldValue.serverTimestamp(),
      });

      // Release inventory back to event
      if (eventId && items.length > 0) {
        const eventRef = adminDb.doc(`events/${eventId}`);
        
        // Read event to get current ticket structure
        const eventSnap = await eventRef.get();
        if (eventSnap.exists) {
          const eventData = eventSnap.data();
          const tickets = eventData?.tickets || {};
          const venueConfigs = tickets.venueConfigs || [];

          // Decrement ticketsSold for each item
          for (const item of items) {
            for (let vcIdx = 0; vcIdx < venueConfigs.length; vcIdx++) {
              const ticketTypes = venueConfigs[vcIdx].ticketTypes || [];
              for (let ttIdx = 0; ttIdx < ticketTypes.length; ttIdx++) {
                if (ticketTypes[ttIdx].id === item.ticketTypeId) {
                  const currentSold = ticketTypes[ttIdx].ticketsSold || 0;
                  ticketTypes[ttIdx].ticketsSold = Math.max(0, currentSold - item.quantity);
                }
              }
              venueConfigs[vcIdx].ticketTypes = ticketTypes;
            }
          }

          batch.update(eventRef, { "tickets.venueConfigs": venueConfigs });
        }
      }

      expiredCount++;
    }

    await batch.commit();

    console.log(`[Cron] Expired ${expiredCount} bookings`);
    return NextResponse.json({ expired: expiredCount });
  } catch (error: any) {
    console.error("[Cron] Expire bookings failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
