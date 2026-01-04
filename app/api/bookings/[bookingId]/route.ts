import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyAuthToken } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    if (!adminDb) {
      console.error("[GET BOOKING] adminDb is null");
      return NextResponse.json(
        { error: "Server not initialized" },
        { status: 500 }
      );
    }

    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyAuthToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { bookingId } = params;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId" },
        { status: 400 }
      );
    }

    const ref = adminDb.doc(`bookings/${bookingId}`);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const booking = snap.data();
    
    if (!booking) {
      console.error("[GET BOOKING] Booking document exists but data is null/undefined");
      return NextResponse.json(
        { error: "Booking data corrupted" },
        { status: 500 }
      );
    }
    
    // Enforce ownership
    if (booking.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      id: snap.id,
      ...booking,
    });
  } catch (err: any) {
    console.error("[GET BOOKING] FAILED", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
