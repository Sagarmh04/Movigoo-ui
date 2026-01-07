import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import admin from 'firebase-admin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { hostId, userId, price, ticketCount } = body;

    // 1. Create the Transaction (Batch Write)
    // We use a batch to make sure BOTH happen, or NOTHING happens.
    const batch = db.batch();

    // A: Create the Booking Reference
    const bookingRef = db.collection('bookings').doc();
    batch.set(bookingRef, {
      hostId,
      userId,
      price,
      ticketCount,
      timestamp: new Date()
    });

    // B: Update Host Analytics (The "Math")
    const analyticsRef = db.collection('host_analytics').doc(hostId);
    
    batch.set(analyticsRef, {
      // "increment" adds to the existing number safely
      totalRevenue: admin.firestore.FieldValue.increment(price),
      totalTickets: admin.firestore.FieldValue.increment(ticketCount)
    }, { merge: true });

    // 2. Commit the changes
    await batch.commit();

    return NextResponse.json({ success: true, message: "Ticket Booked & Analytics Updated" });

  } catch (error) {
    console.error("Booking Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
