// lib/sendTicketEmail.ts
// MSG91 Email API integration for ticket confirmations
// Server-side only - never expose keys to client

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

export async function sendTicketEmail(payload: TicketEmailPayload): Promise<void> {
  console.log("📧 ========== EMAIL FUNCTION CALLED ==========");
  console.log("📧 EMAIL INITIATED at:", new Date().toISOString());
  console.log("📧 EMAIL PAYLOAD:", JSON.stringify(payload, null, 2));

  const url = "https://control.msg91.com/api/v5/email/send";

  // Use env var or fallback to provided key
  const authkey = process.env.MSG91_EMAIL_API_KEY || "476956A42GXVhu1d694664f7P1";
  
  console.log("📧 Using authkey:", authkey ? `${authkey.substring(0, 10)}...` : "NOT SET");

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    authkey: authkey,
  };

  // Ensure all fields have fallback values
  const safePayload = {
    to: payload.to || "movigoo4@gmail.com",
    name: payload.name || "Guest User",
    eventName: payload.eventName || "Sample Event",
    eventDate: payload.eventDate || "Saturday, 1 February 2025",
    venue: payload.venue || "Sample Venue",
    ticketQty: payload.ticketQty || 1,
    bookingId: payload.bookingId || "BOOKING-12345",
    ticketLink: payload.ticketLink || "https://movigoo.in/my-bookings",
  };

  const body = {
    recipients: [
      {
        to: [
          {
            email: safePayload.to,
            name: safePayload.name,
          },
        ],
        variables: {
          name: safePayload.name,
          eventName: safePayload.eventName,
          eventDate: safePayload.eventDate,
          venue: safePayload.venue,
          ticketQty: safePayload.ticketQty,
          bookingId: safePayload.bookingId,
          ticketLink: safePayload.ticketLink,
        },
      },
    ],
    from: {
      email: "noreply@bookings.movigoo.in",
    },
    domain: "bookings.movigoo.in",
    template_id: "movigoo_final_ticket",
  };

  console.log("📧 MSG91 REQUEST BODY:", JSON.stringify(body, null, 2));
  console.log("📧 Sending request to MSG91...");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    console.log("📧 MSG91 HTTP STATUS:", response.status, response.statusText);

    const data = await response.json();
    console.log("📧 MSG91 FULL RESPONSE:", JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error("❌ MSG91 ERROR - Request failed:", data);
      throw new Error(`MSG91 API error: ${JSON.stringify(data)}`);
    } else {
      console.log("✅ EMAIL SENT SUCCESSFULLY");
      console.log("✅ Email sent to:", safePayload.to);
      console.log("✅ Email sent at:", new Date().toISOString());
    }
  } catch (error: any) {
    console.error("❌ MSG91 REQUEST ERROR:", error.message);
    console.error("❌ Error stack:", error.stack);
    throw error; // Re-throw to allow caller to handle
  }
  
  console.log("📧 ========== EMAIL FUNCTION COMPLETED ==========");
}
