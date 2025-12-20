// lib/sendTicketEmail.ts
// Production-grade transactional email utility using MSG91
// Server-side only - never expose keys to client

import axios from "axios";

type TicketEmailPayload = {
  to: string;
  name: string;
  eventName: string;
  eventDate: string;
  venue: string;
  ticketQty: number;
  bookingId: string;
  ticketLink: string;
};

/**
 * Send ticket confirmation email via MSG91
 * Errors are logged but never thrown to prevent booking failures
 */
export async function sendTicketEmail(payload: TicketEmailPayload): Promise<void> {
  try {
    // Validate required environment variables
    const apiKey = process.env.MSG91_EMAIL_API_KEY;
    const senderEmail = process.env.MSG91_EMAIL_SENDER;
    const templateId = process.env.MSG91_EMAIL_TEMPLATE_ID;

    if (!apiKey || !senderEmail || !templateId) {
      console.warn("MSG91 email configuration missing - skipping email send");
      return;
    }

    // Validate payload
    if (!payload.to || !payload.name || !payload.bookingId) {
      console.warn("Invalid email payload - missing required fields");
      return;
    }

    // Call MSG91 API
    await axios.post(
      "https://api.msg91.com/api/v5/email/send",
      {
        to: [{ email: payload.to }],
        from: {
          email: senderEmail,
          name: "Movigoo",
        },
        template_id: templateId,
        variables: {
          name: payload.name,
          eventName: payload.eventName,
          eventDate: payload.eventDate,
          venue: payload.venue,
          ticketQty: payload.ticketQty,
          bookingId: payload.bookingId,
          ticketLink: payload.ticketLink,
        },
      },
      {
        headers: {
          Authkey: apiKey,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    console.log(`✓ Ticket email sent successfully to ${payload.to} for booking ${payload.bookingId}`);
  } catch (error: any) {
    // Log error but never throw - booking must succeed even if email fails
    console.error("Ticket email failed:", {
      bookingId: payload.bookingId,
      email: payload.to,
      error: error.response?.data || error.message,
    });
  }
}

