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
  console.log("📧 EMAIL FUNCTION CALLED");
  console.log("📧 EMAIL PAYLOAD:", payload);

  const url = "https://control.msg91.com/api/v5/email/send";

  // Use env var or fallback to provided key
  const authkey = process.env.MSG91_EMAIL_API_KEY || "476956A42GXVhu1d694664f7P1";

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    authkey: authkey,
  };

  const body = {
    recipients: [
      {
        to: [
          {
            email: payload.to,
            name: payload.name,
          },
        ],
        variables: {
          name: payload.name || "Guest",
          eventName: payload.eventName || "Event",
          eventDate: payload.eventDate || "TBA",
          venue: payload.venue || "TBA",
          ticketQty: payload.ticketQty || 1,
          bookingId: payload.bookingId || "N/A",
          ticketLink: payload.ticketLink || "#",
        },
      },
    ],
    from: {
      email: "noreply@bookings.movigoo.in",
    },
    domain: "bookings.movigoo.in",
    template_id: "movigoo_final_ticket",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("📧 MSG91 RESPONSE:", data);
    
    if (!response.ok) {
      console.error("📧 MSG91 ERROR:", data);
    } else {
      console.log("📧 Email sent successfully");
    }
  } catch (error: any) {
    console.error("📧 MSG91 ERROR:", error.message);
  }
}
