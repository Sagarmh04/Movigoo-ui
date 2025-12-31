// app/api/support-tickets/reply/route.ts
// API route for adding user replies to support tickets

import { NextRequest, NextResponse } from "next/server";
import { getFirestore, doc, updateDoc, arrayUnion, serverTimestamp, getDoc } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp() {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, message, userId } = body;

    if (!ticketId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const app = getFirebaseApp();
    const firestore = getFirestore(app);

    const ticketRef = doc(firestore, "supportTickets", ticketId);
    const ticketSnap = await getDoc(ticketRef);

    if (!ticketSnap.exists()) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    const ticketData = ticketSnap.data();

    // Check if ticket is closed
    if (ticketData.status === "CLOSED" || ticketData.status === "RESOLVED") {
      return NextResponse.json(
        { error: "Cannot reply to a closed ticket" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const newMessage = {
      id: `msg_${Date.now()}`,
      ticketId,
      message: message.trim(),
      senderType: "user",
      senderName: ticketData.userName || "User",
      createdAt: now,
    };

    await updateDoc(ticketRef, {
      messages: arrayUnion(newMessage),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Reply added successfully",
    });
  } catch (error: any) {
    console.error("❌ Reply error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add reply" },
      { status: 500 }
    );
  }
}
