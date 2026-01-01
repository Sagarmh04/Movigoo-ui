// app/api/support-tickets/route.ts
// API route for creating support tickets with email notification
// ✅ SERVER-ONLY: Email sent via Resend (API key never exposed to frontend)

import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { sendSupportEmail } from "@/lib/server/sendSupportEmail";
import { verifyAuthToken } from "@/lib/auth";

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
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyAuthToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get userId and email from verified token (ignore from request body)
    const userId = user.uid;
    const userEmail = user.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in token" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { category, subject, description, userName } = body;

    // Validate required fields (userId and userEmail come from token, not body)
    if (!category || !subject || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = [
      "Payment & Refund",
      "Amount Deducted but Ticket Not Booked",
      "Refund Not Received",
      "Ticket Cancellation",
      "Event Issue",
      "Account / Technical Issue",
    ];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    const app = getFirebaseApp();
    const firestore = getFirestore(app);

    const now = new Date().toISOString();

    // Create ticket document
    const ticketData = {
      category,
      subject,
      description,
      status: "OPEN",
      priority: "NORMAL",
      userId,
      userEmail,
      userName: userName || userEmail.split("@")[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAtISO: now,
    };

    const docRef = await addDoc(collection(firestore, "supportTickets"), ticketData);

    console.log("✅ Support ticket created:", docRef.id);

    // Send email notification via Resend (SERVER-ONLY)
    const emailResult = await sendSupportEmail({
      ticketId: docRef.id,
      category,
      subject,
      description,
      userName: ticketData.userName,
      userEmail,
      createdAt: now,
    });

    if (!emailResult.success) {
      console.error("⚠️ Ticket created but email notification failed:", emailResult.error);
      // Still return success - ticket was created, email failure is logged
    }

    return NextResponse.json({
      success: true,
      ticketId: docRef.id,
      message: "Support ticket created successfully",
      emailSent: emailResult.success,
    });
  } catch (error: any) {
    console.error("❌ Support ticket creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create support ticket" },
      { status: 500 }
    );
  }
}
