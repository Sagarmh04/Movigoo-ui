// app/api/bookings/route.ts
// POST /api/bookings
// Complete booking endpoint that saves to 3 Firestore locations (BookMyShow style)

import { NextRequest, NextResponse } from "next/server";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseServer";
import { v4 as uuidv4 } from "uuid";
import { sendTicketEmail } from "@/lib/sendTicketEmail";

const BOOKING_FEE_PER_TICKET = 7; // ₹7 per ticket

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/bookings - Request received");

    // Parse request body
    let body: any;
    try {
      body = await request.json();
      console.log("Request body:", JSON.stringify(body, null, 2));
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { error: "Invalid request body", details: String(error) },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: "Firebase not initialized" },
        { status: 500 }
      );
    }

    // CRITICAL: Reject bookings without userId - user MUST be logged in
    if (!body.userId) {
      console.error("Missing userId in booking request");
      return NextResponse.json(
        { error: "Missing userId. User must be logged in." },
        { status: 400 }
      );
    }

    // Support multiple payload formats:
    // 1. New format: { eventId, userId, ticketTypeId, ticketTypeName, quantity, pricePerTicket, totalAmount, bookingFee, finalAmount, showDate, showTime, venueName }
    // 2. Items format: { userId, eventId, items: [{ ticketTypeId, quantity, price }], promoCode? }
    // 3. Direct format: { userId, eventId, eventTitle, coverUrl, venueName, date, time, ticketType, quantity, price, bookingFee, totalAmount, userName? }
    
    let bookingData: any;
    let userId: string;
    let eventId: string;
    let userName: string | null = null;

    // Check for new format (from payment page)
    if (body.ticketTypeId && body.ticketTypeName && body.quantity && body.pricePerTicket) {
      userId = body.userId;
      eventId = body.eventId;
      
      if (!userId || !eventId) {
        return NextResponse.json(
          { error: "Missing userId or eventId" },
          { status: 400 }
        );
      }

      // Fetch event details
      const eventRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }

      const eventData = eventDoc.data();
      const basic = eventData.basicDetails || {};

      bookingData = {
        userId,
        eventId,
        eventTitle: basic.title || "Untitled Event",
        coverUrl: basic.coverPortraitUrl || basic.coverWideUrl || "",
        venueName: body.venueName || "TBA",
        date: body.showDate || new Date().toISOString().split("T")[0],
        time: body.showTime || "00:00",
        ticketType: body.ticketTypeName,
        quantity: body.quantity,
        price: body.totalAmount || (body.pricePerTicket * body.quantity),
        bookingFee: body.bookingFee || (body.quantity * BOOKING_FEE_PER_TICKET),
        totalAmount: body.finalAmount || body.totalAmount,
      };
    } else if (body.items && Array.isArray(body.items)) {
      // Format 2: Items array - fetch event details and calculate
      userId = body.userId;
      eventId = body.eventId;
      
      if (!userId || !eventId || !body.items || body.items.length === 0) {
        return NextResponse.json(
          { error: "Missing userId, eventId, or items" },
          { status: 400 }
        );
      }

      // Fetch event details
      const eventRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }

      const eventData = eventDoc.data();
      const basic = eventData.basicDetails || {};
      const schedule = eventData.schedule || {};
      const tickets = eventData.tickets || {};

      // Extract date/time from schedule
      const locations = Array.isArray(schedule.locations) ? schedule.locations : [];
      const firstLocation = locations[0] || {};
      const venues = Array.isArray(firstLocation.venues) ? firstLocation.venues : [];
      const firstVenue = venues[0] || {};
      const dates = Array.isArray(firstVenue.dates) ? firstVenue.dates : [];
      const firstDate = dates[0] || {};
      const shows = Array.isArray(firstDate.shows) ? firstDate.shows : [];
      const firstShow = shows[0] || {};

      const eventDate = firstDate.date || new Date().toISOString().split("T")[0];
      const eventTime = firstShow.startTime || "00:00";

      // Extract ticket type names from event data
      const venueConfigs = Array.isArray(tickets.venueConfigs) ? tickets.venueConfigs : [];
      const allTicketTypes: any[] = [];
      venueConfigs.forEach((vc: any) => {
        if (Array.isArray(vc.ticketTypes)) {
          allTicketTypes.push(...vc.ticketTypes);
        }
      });

      // Build ticket type string with names
      const ticketTypeStrings = body.items.map((item: any) => {
        const ticketType = allTicketTypes.find((t: any) => t.id === item.ticketTypeId);
        const ticketName = ticketType?.typeName || item.ticketTypeId;
        return `${ticketName} (${item.quantity})`;
      });

      // Calculate totals
      const subtotal = body.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      const totalTickets = body.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      const bookingFee = totalTickets * BOOKING_FEE_PER_TICKET;
      const discount = body.promoCode ? subtotal * 0.05 : 0;
      const totalAmount = subtotal - discount + bookingFee;

      bookingData = {
        userId,
        eventId,
        eventTitle: basic.title || "Untitled Event",
        coverUrl: basic.coverWideUrl || basic.coverPortraitUrl || "",
        venueName: firstVenue.name || "TBA",
        date: eventDate,
        time: eventTime,
        ticketType: ticketTypeStrings.join(", "),
        quantity: totalTickets,
        price: subtotal,
        bookingFee,
        totalAmount,
      };
    } else {
      // Format 1: Direct fields (from payment page)
      const {
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
      } = body;

      userId = body.userId;
      eventId = body.eventId;
      userName = body.userName || null;

      // Validate required fields
      const missingFields: string[] = [];
      if (!userId) missingFields.push("userId");
      if (!eventId) missingFields.push("eventId");
      if (!eventTitle) missingFields.push("eventTitle");
      if (!coverUrl) missingFields.push("coverUrl");
      if (!venueName) missingFields.push("venueName");
      if (!date) missingFields.push("date");
      if (!time) missingFields.push("time");
      if (!ticketType) missingFields.push("ticketType");
      if (typeof quantity !== "number" || quantity < 1) missingFields.push("quantity");
      if (typeof price !== "number") missingFields.push("price");
      if (typeof bookingFee !== "number") missingFields.push("bookingFee");
      if (typeof totalAmount !== "number") missingFields.push("totalAmount");

      if (missingFields.length > 0) {
        console.error("Missing required fields:", missingFields);
        return NextResponse.json(
          { 
            error: "Missing required fields", 
            missingFields,
            received: Object.keys(body)
          },
          { status: 400 }
        );
      }

      bookingData = {
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
      };
    }

    // Generate unique IDs
    const bookingId = uuidv4();
    const qrCodeData = `MOV-${uuidv4().toUpperCase().replace(/-/g, "")}`;

    console.log("Generated bookingId:", bookingId);
    console.log("Generated qrCodeData:", qrCodeData);

    // Get user name and email if available (fetch from users collection)
    let userEmail: string | null = null;
    if (userId) {
      try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (!userName) {
            userName = userData.name || userData.displayName || null;
          }
          userEmail = userData.email || userData.emailAddress || null;
        }
      } catch (error) {
        console.warn("Could not fetch user details:", error);
      }
    }

    // Prepare final booking data
    const finalBookingData = {
      bookingId,
      userId,
      userName: userName || null,
      eventId,
      eventTitle: bookingData.eventTitle,
      coverUrl: bookingData.coverUrl,
      venueName: bookingData.venueName,
      date: bookingData.date,
      time: bookingData.time,
      ticketType: bookingData.ticketType,
      quantity: bookingData.quantity,
      price: bookingData.price,
      bookingFee: bookingData.bookingFee,
      totalAmount: bookingData.totalAmount,
      qrCodeData,
      createdAt: serverTimestamp(),
      paymentStatus: "confirmed",
    };

    console.log("Booking data prepared:", finalBookingData);

    // Simulate payment success
    console.log("Simulating payment success...");
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Payment simulation complete");

    // Save to ALL 3 locations in Firestore (BookMyShow style)
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      
      // Use Promise.all to save to all 3 paths simultaneously
      await Promise.all([
        // 1. Save under user events: /users/{userId}/events/{eventId}/bookings/{bookingId}
        setDoc(doc(db, "users", userId, "events", eventId, "bookings", bookingId), finalBookingData),
        // 2. Save under event: /events/{eventId}/bookings/{bookingId}
        setDoc(doc(db, "events", eventId, "bookings", bookingId), finalBookingData),
        // 3. Save in global bookings: /bookings/{bookingId} (for admin)
        setDoc(bookingRef, finalBookingData),
      ]);

      console.log("✓ Saved to /users/{userId}/events/{eventId}/bookings/{bookingId}");
      console.log("✓ Saved to /events/{eventId}/bookings/{bookingId}");
      console.log("✓ Saved to /bookings/{bookingId}");
      console.log("All 3 Firestore writes completed successfully");
    } catch (firestoreError: any) {
      console.error("Firestore write error:", firestoreError);
      return NextResponse.json(
        { 
          error: "Failed to save booking", 
          details: firestoreError.message 
        },
        { status: 500 }
      );
    }

    // Send ticket email (non-blocking - fire and forget)
    // Booking succeeds even if email fails
    if (userEmail) {
      try {
        // Format event date for email
        const eventDateObj = new Date(bookingData.date);
        const formattedEventDate = eventDateObj.toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Build ticket link
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://movigoo.in";
        const ticketLink = `${appUrl}/booking/success?bookingId=${bookingId}`;

        // Send email asynchronously (don't await - non-blocking)
        sendTicketEmail({
          to: userEmail,
          name: userName || userEmail.split("@")[0],
          eventName: bookingData.eventTitle,
          eventDate: formattedEventDate,
          venue: bookingData.venueName,
          ticketQty: bookingData.quantity,
          bookingId,
          ticketLink,
        }).catch((emailError) => {
          // Already handled in sendTicketEmail, but log here too for visibility
          console.error("Email send promise rejected:", emailError);
        });
      } catch (emailError) {
        // Catch any synchronous errors (shouldn't happen, but safety first)
        console.error("Error preparing email:", emailError);
      }
    } else {
      console.warn(`No email found for user ${userId} - skipping ticket email`);
    }

    // Return success response
    const response = {
      ok: true,
      bookingId,
      qrCodeData,
    };

    console.log("Returning success response:", response);

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("Error in POST /api/bookings:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to create booking",
        details: String(error)
      },
      { status: 500 }
    );
  }
}
