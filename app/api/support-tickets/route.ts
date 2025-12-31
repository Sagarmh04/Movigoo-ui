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

// Send email notification to support team using MSG91 (existing email service)
async function sendSupportTicketNotification(ticket: {
  id: string;
  category: string;
  subject: string;
  description: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}): Promise<void> {
  const url = "https://control.msg91.com/api/v5/email/send";
  const authkey = process.env.MSG91_EMAIL_API_KEY || "476956A42GXVhu1d694664f7P1";

  const body = {
    recipients: [
      {
        to: [
          {
            email: "movigootech@gmail.com",
            name: "Movigoo Support",
          },
        ],
        variables: {
          ticketId: ticket.id,
          category: ticket.category,
          subject: ticket.subject,
          description: ticket.description,
          userName: ticket.userName,
          userEmail: ticket.userEmail,
          createdAt: ticket.createdAt,
        },
      },
    ],
    from: {
      email: "noreply@bookings.movigoo.in",
    },
    domain: "bookings.movigoo.in",
    template_id: "support_ticket_notification",
    // Fallback: send plain text if template doesn't exist
    body: `
New Support Ticket Raised

Ticket ID: ${ticket.id}
Category: ${ticket.category}
Subject: ${ticket.subject}

Description:
${ticket.description}

User Details:
Name: ${ticket.userName}
Email: ${ticket.userEmail}

Created At: ${ticket.createdAt}

Please respond to this ticket from the admin dashboard.
    `.trim(),
    subject: `[Support Ticket] ${ticket.category} - ${ticket.subject}`,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        authkey: authkey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json();
      console.error("❌ Support ticket email failed:", data);
    } else {
      console.log("✅ Support ticket email sent to movigootech@gmail.com");
    }
  } catch (error: any) {
    console.error("❌ Support ticket email error:", error.message);
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

    // Send email notification (non-blocking)
    sendSupportTicketNotification({
      id: docRef.id,
      category,
      subject,
      description,
      userName: ticketData.userName,
      userEmail,
      createdAt: now,
    }).catch((err) => console.error("Email notification failed:", err));

    return NextResponse.json({
      success: true,
      ticketId: docRef.id,
      message: "Support ticket created successfully",
    });
  } catch (error: any) {
    console.error("❌ Support ticket creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create support ticket" },
      { status: 500 }
    );
  }
}
