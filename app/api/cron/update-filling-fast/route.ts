/**
 * Vercel Cron Job: Update Filling Fast Flags
 * 
 * This endpoint is triggered by Vercel Cron every 4 hours.
 * It calculates which events should be marked as "Filling Fast"
 * based on recent confirmed bookings.
 * 
 * Schedule: 0 */4 * * * (every 4 hours)
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  doc,
  Timestamp,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebaseServer";

// Configuration
const LOOKBACK_HOURS = 24; // Look at bookings from last 24 hours
const TOP_N_PER_CITY = 5; // Max events to mark as "Filling Fast" per city
const MIN_MOMENTUM = 3; // Minimum bookings to qualify (prevents gaming)

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  // In production, verify the cron secret
  if (process.env.NODE_ENV === "production" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    console.log("[Filling Fast] Starting calculation...");

    // Step 1: Get confirmed bookings from the last 24 hours
    const now = new Date();
    const lookbackTime = new Date(now.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000);
    const lookbackTimestamp = Timestamp.fromDate(lookbackTime);

    const bookingsQuery = query(
      collection(db, "bookings"),
      where("paymentStatus", "==", "confirmed"),
      where("createdAt", ">=", lookbackTimestamp)
    );

    const bookingsSnapshot = await getDocs(bookingsQuery);
    console.log(`[Filling Fast] Found ${bookingsSnapshot.size} confirmed bookings in last ${LOOKBACK_HOURS} hours`);

    // Step 2: Aggregate bookings by eventId
    const eventMomentum: Map<string, number> = new Map();

    bookingsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const eventId = data.eventId as string;
      const quantity = (data.quantity as number) || 1;

      if (eventId) {
        const current = eventMomentum.get(eventId) || 0;
        eventMomentum.set(eventId, current + quantity);
      }
    });

    console.log(`[Filling Fast] Calculated momentum for ${eventMomentum.size} events`);

    // Step 3: Get all events to group by city
    const eventsSnapshot = await getDocs(collection(db, "events"));
    
    // Build event-city mapping and group by city
    const eventsByCity: Map<string, Array<{ eventId: string; momentum: number; docRef: any }>> = new Map();

    eventsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const eventId = docSnap.id;
      
      // Extract city from schedule.locations[0].name
      const locations = data.schedule?.locations;
      const city = Array.isArray(locations) && locations[0]?.name 
        ? locations[0].name 
        : "Unknown";
      
      // Get momentum for this event (0 if no recent bookings)
      const momentum = eventMomentum.get(eventId) || 0;
      
      // Only consider events with some momentum
      if (momentum > 0) {
        if (!eventsByCity.has(city)) {
          eventsByCity.set(city, []);
        }
        eventsByCity.get(city)!.push({ 
          eventId, 
          momentum, 
          docRef: doc(db!, "events", eventId)
        });
      }
    });

    // Step 4: For each city, find top N events by momentum
    const fillingFastEventIds: Set<string> = new Set();

    eventsByCity.forEach((events, city) => {
      // Sort by momentum (descending)
      events.sort((a, b) => b.momentum - a.momentum);
      
      // Take top N events with minimum momentum threshold
      const topEvents = events
        .filter((e) => e.momentum >= MIN_MOMENTUM)
        .slice(0, TOP_N_PER_CITY);
      
      topEvents.forEach((e) => {
        fillingFastEventIds.add(e.eventId);
      });

      if (topEvents.length > 0) {
        console.log(
          `[Filling Fast] City "${city}": Marking ${topEvents.length} events`,
          topEvents.map((e) => `${e.eventId} (${e.momentum} tickets)`)
        );
      }
    });

    console.log(`[Filling Fast] Total events to mark: ${fillingFastEventIds.size}`);

    // Step 5: Batch update all events
    // Reset all to false, then set selected to true
    const batch = writeBatch(db);
    let updateCount = 0;

    eventsSnapshot.forEach((docSnap) => {
      const eventId = docSnap.id;
      const shouldBeFillingFast = fillingFastEventIds.has(eventId);
      const currentValue = docSnap.data().fillingFast === true;

      // Only update if the value needs to change
      if (currentValue !== shouldBeFillingFast) {
        batch.update(doc(db!, "events", eventId), { 
          fillingFast: shouldBeFillingFast
        });
        updateCount++;
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`[Filling Fast] Updated ${updateCount} events`);
    } else {
      console.log("[Filling Fast] No events needed updating");
    }

    console.log("[Filling Fast] Calculation complete!");

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      stats: {
        recentBookings: bookingsSnapshot.size,
        eventsWithMomentum: eventMomentum.size,
        fillingFastCount: fillingFastEventIds.size,
        updatedCount: updateCount
      },
      fillingFastEvents: Array.from(fillingFastEventIds)
    });

  } catch (error) {
    console.error("[Filling Fast] Error:", error);
    return NextResponse.json(
      { error: "Failed to update filling fast flags" },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

