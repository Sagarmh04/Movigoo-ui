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
  console.log("EMAIL FUNCTION CALLED");
  console.log("EMAIL PAYLOAD:", payload);

  const url = "https://control.msg91.com/api/v5/email/send";

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    authkey: process.env.MSG91_EMAIL_API_KEY!, // MUST be lowercase
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
          name: payload.name,
          eventName: payload.eventName,
          eventDate: payload.eventDate,
          venue: payload.venue,
          ticketQty: payload.ticketQty,
          bookingId: payload.bookingId,
          ticketLink: payload.ticketLink,
        },
      },
    ],
    from: {
      email: "no-reply@mailer91.com", // TEMP SAFE SENDER
    },
    domain: "mailer91.com", // REQUIRED
    template_id: "movigoo_final_ticket", // EXACT, case-sensitive
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("MSG91 RESPONSE:", data);
  } catch (error: any) {
    console.error("MSG91 ERROR:", error.message);
  }
}
