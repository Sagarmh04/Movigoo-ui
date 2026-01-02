// lib/analyticsUpdate.ts
// Analytics update function - uses atomic increments only
// Called ONLY when booking transitions to CONFIRMED + SUCCESS

import { Firestore, doc, getDoc, updateDoc, setDoc, serverTimestamp, FieldValue, increment } from "firebase/firestore";

type BookingData = {
  eventId: string;
  quantity: number; // ticketCount
  totalAmount: number; // revenue
  locationId?: string | null;
  venueId?: string | null;
  date?: string | null; // ISO yyyy-mm-dd format
  showId?: string | null;
};

/**
 * Updates analytics collections using atomic increments
 * This function is idempotent-safe: if called multiple times for the same booking,
 * it will only increment once (handled by webhook idempotency check)
 * 
 * Analytics collections updated:
 * 1. host_analytics/{hostId} - host-level totals
 * 2. event_analytics/{eventId} - event-level totals
 * 3. event_analytics/{eventId}/stats/{statId} - breakdown by location/venue/date/show
 * 
 * @param firestore - Firestore instance
 * @param booking - Booking data with eventId, quantity, totalAmount, and optional location/venue/date/show
 * @returns Promise that resolves when all updates complete (or fails silently)
 */
export async function updateAnalyticsOnBookingConfirmation(
  firestore: Firestore,
  booking: BookingData
): Promise<void> {
  try {
    // Validate required fields
    if (!booking.eventId || !booking.quantity || !booking.totalAmount) {
      console.warn("[Analytics] Missing required fields, skipping analytics update", {
        eventId: booking.eventId,
        hasQuantity: !!booking.quantity,
        hasTotalAmount: !!booking.totalAmount,
      });
      return;
    }

    // Get event document to find hostId
    const eventRef = doc(firestore, "events", booking.eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      console.warn("[Analytics] Event not found, skipping analytics update", {
        eventId: booking.eventId,
      });
      return;
    }

    const eventData = eventDoc.data();
    const hostId = eventData.hostUid || eventData.organizerId || null;

    if (!hostId) {
      console.warn("[Analytics] No hostId found in event, skipping analytics update", {
        eventId: booking.eventId,
        hostUid: eventData.hostUid,
        organizerId: eventData.organizerId,
      });
      return;
    }

    // Prepare atomic increment values
    const ticketCount = typeof booking.quantity === "number" ? booking.quantity : 0;
    const revenue = typeof booking.totalAmount === "number" ? booking.totalAmount : 0;

    if (ticketCount <= 0 || revenue <= 0) {
      console.warn("[Analytics] Invalid ticketCount or revenue, skipping analytics update", {
        ticketCount,
        revenue,
      });
      return;
    }

    // Prepare update operations (all using atomic increments)
    const updatePromises: Promise<void>[] = [];

    // Helper function to update or create document with atomic increment
    // Uses setDoc with merge: true first to ensure document exists with non-numeric fields,
    // then increments numeric fields (increment() creates fields if they don't exist)
    const updateOrCreateWithIncrement = async (
      ref: ReturnType<typeof doc>,
      incrementFields: Record<string, ReturnType<typeof increment>>,
      initialFields: Record<string, any>
    ) => {
      // Extract non-numeric fields (metadata fields that should be set once)
      const numericFieldKeys = Object.keys(incrementFields);
      const nonNumericFields = Object.fromEntries(
        Object.entries(initialFields).filter(([key]) => !numericFieldKeys.includes(key))
      );
      
      // First, ensure document exists with non-numeric fields (merge won't overwrite existing)
      await setDoc(ref, {
        ...nonNumericFields,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      // Then increment numeric fields (increment() is atomic and creates fields if missing)
      await updateDoc(ref, {
        ...incrementFields,
        updatedAt: serverTimestamp(),
      });
    };

    // 1. Update host-level analytics
    const hostAnalyticsRef = doc(firestore, "host_analytics", hostId);
    updatePromises.push(
      updateOrCreateWithIncrement(
        hostAnalyticsRef,
        {
          totalTicketsSold: increment(ticketCount),
          totalRevenue: increment(revenue),
        },
        {
          // No non-numeric fields for host analytics (just counters)
        }
      )
    );

    // 2. Update event-level analytics
    const eventAnalyticsRef = doc(firestore, "event_analytics", booking.eventId);
    updatePromises.push(
      updateOrCreateWithIncrement(
        eventAnalyticsRef,
        {
          totalTicketsSold: increment(ticketCount),
          totalRevenue: increment(revenue),
        },
        {
          eventId: booking.eventId,
          hostId: hostId,
          totalTicketsSold: ticketCount,
          totalRevenue: revenue,
        }
      )
    );

    // 3. Update event breakdown analytics (if location/venue/date/show are available)
    // Validate date format (must be yyyy-mm-dd)
    const isValidDate = booking.date && /^\d{4}-\d{2}-\d{2}$/.test(booking.date);
    if (booking.locationId && booking.venueId && isValidDate && booking.showId) {
      // Format: locationId_venueId_date_showId
      const statId = `${booking.locationId}_${booking.venueId}_${booking.date}_${booking.showId}`;
      const statRef = doc(firestore, "event_analytics", booking.eventId, "stats", statId);

      updatePromises.push(
        updateOrCreateWithIncrement(
          statRef,
          {
            ticketsSold: increment(ticketCount),
            revenue: increment(revenue),
          },
          {
            eventId: booking.eventId,
            locationId: booking.locationId,
            venueId: booking.venueId,
            date: booking.date,
            showId: booking.showId,
            ticketsSold: ticketCount,
            revenue: revenue,
          }
        )
      );
    }

    // Execute all updates in parallel
    await Promise.all(updatePromises);

    console.log("[Analytics] Successfully updated analytics", {
      hostId,
      eventId: booking.eventId,
      ticketCount,
      revenue,
    });
  } catch (error) {
    // Analytics failure must NEVER block booking confirmation
    // Log error but don't throw
    console.error("[Analytics] Error updating analytics (non-fatal):", error, {
      eventId: booking.eventId,
      quantity: booking.quantity,
      totalAmount: booking.totalAmount,
    });
  }
}

