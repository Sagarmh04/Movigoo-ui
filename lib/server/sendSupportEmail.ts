// lib/server/sendSupportEmail.ts
// SERVER-ONLY: Send support ticket email via Resend
// ⚠️ This file must ONLY be imported in API routes / server code

import { Resend } from "resend";

// Lazy initialization to avoid build-time errors
function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }
  return new Resend(apiKey);
}

export async function sendSupportEmail({
  ticketId,
  category,
  subject,
  description,
  userName,
  userEmail,
  createdAt,
}: {
  ticketId: string;
  category: string;
  subject: string;
  description: string;
  userName: string;
  userEmail: string;
  createdAt?: string;
}) {
  console.log("========================================");
  console.log("📧 RESEND EMAIL TRIGGER - START");
  console.log("========================================");
  console.log("📧 Ticket ID:", ticketId);
  console.log("📧 Category:", category);
  console.log("📧 Subject:", subject);
  console.log("📧 User:", userName, userEmail);

  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: "Movigoo Support <onboarding@resend.dev>",
      to: "movigootech@gmail.com",
      subject: `[Support Ticket #${ticketId.slice(-6).toUpperCase()}] ${category} - ${subject}`,
      text: `
════════════════════════════════════════
       NEW SUPPORT TICKET RAISED
════════════════════════════════════════

TICKET ID: ${ticketId}

CATEGORY: ${category}

SUBJECT: ${subject}

────────────────────────────────────────
DESCRIPTION:
────────────────────────────────────────
${description}

────────────────────────────────────────
USER DETAILS:
────────────────────────────────────────
Name:  ${userName}
Email: ${userEmail}

────────────────────────────────────────
CREATED AT: ${createdAt || new Date().toISOString()}
────────────────────────────────────────

Status: OPEN

Please respond to this ticket from the admin dashboard.

This is an automated notification from Movigoo Support System.
`.trim(),
    });

    console.log("✅ SUPPORT EMAIL SENT via Resend:", ticketId);
    console.log("✅ Resend response:", JSON.stringify(result, null, 2));
    return { success: true, data: result };
  } catch (error: any) {
    console.error("❌ RESEND EMAIL FAILED:", error.message);
    console.error("❌ Error details:", error);
    return { success: false, error: error.message };
  }
}
