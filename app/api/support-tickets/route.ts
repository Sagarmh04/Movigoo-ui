// app/api/support-tickets/route.ts
// API route for creating support tickets with email notification

import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
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

// Send email notification to support team using MSG91
// PRIMARY: Plain-text email (100% reliable, no template dependency)
// OPTIONAL: MSG91 template (if exists and approved, used as enhancement only)
async function sendSupportTicketNotification(ticket: {
  id: string;
  category: string;
  subject: string;
  description: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}): Promise<{ success: boolean; error?: string }> {
  const url = "https://control.msg91.com/api/v5/email/send";
  const authkey = process.env.MSG91_EMAIL_API_KEY || "476956A42GXVhu1d694664f7P1";

  // Plain-text email body - PRIMARY delivery method
  const plainTextBody = `
════════════════════════════════════════
       NEW SUPPORT TICKET RAISED
════════════════════════════════════════

TICKET ID: ${ticket.id}

CATEGORY: ${ticket.category}

SUBJECT: ${ticket.subject}

────────────────────────────────────────
DESCRIPTION:
────────────────────────────────────────
${ticket.description}

────────────────────────────────────────
USER DETAILS:
────────────────────────────────────────
Name:  ${ticket.userName}
Email: ${ticket.userEmail}

────────────────────────────────────────
CREATED AT: ${ticket.createdAt}
────────────────────────────────────────

Please respond to this ticket from the admin dashboard.

This is an automated notification from Movigoo Support System.
`.trim();

  // Email payload - plain-text as PRIMARY (no template dependency)
  const emailPayload = {
    recipients: [
      {
        to: [
          {
            email: "movigootech@gmail.com",
            name: "Movigoo Support",
          },
        ],
      },
    ],
    from: {
      email: "noreply@bookings.movigoo.in",
      name: "Movigoo Support System",
    },
    domain: "bookings.movigoo.in",
    subject: `[Support Ticket #${ticket.id.slice(-6).toUpperCase()}] ${ticket.category} - ${ticket.subject}`,
    body: plainTextBody,
    // content_type defaults to text/plain which is what we want
  };

  console.log("📧 Sending support ticket email...");
  console.log("📧 To: movigootech@gmail.com");
  console.log("📧 Ticket ID:", ticket.id);
  console.log("📧 Category:", ticket.category);
  console.log("📧 Subject:", ticket.subject);
  console.log("📧 User Email:", ticket.userEmail);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        authkey: authkey,
      },
      body: JSON.stringify(emailPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("❌ Support ticket email failed:");
      console.error("❌ Status:", response.status);
      console.error("❌ Response:", JSON.stringify(responseData, null, 2));
      return { success: false, error: responseData?.message || "Email delivery failed" };
    }

    console.log("✅ Support ticket email sent successfully!");
    console.log("✅ MSG91 Response:", JSON.stringify(responseData, null, 2));
    return { success: true };

  } catch (error: any) {
    console.error("❌ Support ticket email error:", error.message);
    console.error("❌ Stack:", error.stack);
    return { success: false, error: error.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, subject, description, userId, userEmail, userName } = body;

    // Validate required fields
    if (!category || !subject || !description || !userId || !userEmail) {
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

    // Send email notification - await to ensure delivery before responding
    const emailResult = await sendSupportTicketNotification({
      id: docRef.id,
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
