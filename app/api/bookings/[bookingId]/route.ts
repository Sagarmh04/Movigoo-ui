import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseServer";
import { doc, getDoc } from "firebase/firestore";

export async function GET(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params;

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const bookingRef = doc(db, "bookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookingSnap.data();
    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
