// app/api/bookings/create-pending/route.ts
// POST /api/bookings/create-pending
// Creates a pending booking before payment

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseServer";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
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
    } = body;

    if (!userId || !eventId || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields: userId, eventId, totalAmount" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    console.log("Creating pending booking for userId:", userId, "eventId:", eventId);

    // Generate booking ID
    const bookingId = uuidv4();

    // Prepare booking data
    const bookingData = {
      bookingId,
      userId,
      eventId,
      eventTitle: eventTitle || "Event",
      coverUrl: coverUrl || "",
      venueName: venueName || "TBA",
      date: date || new Date().toISOString().split("T")[0],
      time: time || "00:00",
      ticketType: ticketType || (items ? items.map((i: any) => `${i.ticketTypeId} (${i.quantity})`).join(", ") : ""),
      quantity: quantity || (items ? items.reduce((sum: number, i: any) => sum + i.quantity, 0) : 0),
      price: price || (items ? items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0) : 0),
      bookingFee: bookingFee || 0,
      totalAmount,
      items: items || [],
      paymentGateway: "cashfree",
      paymentStatus: "PENDING",
      bookingStatus: "PENDING_PAYMENT",
      createdAt: serverTimestamp(),
    };

    // Save to Firestore in multiple locations
    const bookingRef = doc(db, "bookings", bookingId);
    const userBookingRef = doc(db, "users", userId, "bookings", bookingId);

    await Promise.all([
      setDoc(bookingRef, bookingData),
      setDoc(userBookingRef, bookingData),
    ]);

    console.log("Created pending booking:", bookingId);

    return NextResponse.json({
      success: true,
      bookingId,
      message: "Pending booking created",
    });
  } catch (err: any) {
    console.error("Error creating pending booking:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

