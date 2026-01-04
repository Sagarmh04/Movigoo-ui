// lib/emailDispatcher.ts
// Central email routing dispatcher - ensures strict provider separation
// RULE: Support tickets → Resend | All other emails → MSG91

import { sendTicketEmail } from "@/lib/sendTicketEmail";
import { sendSupportEmail } from "@/lib/server/sendSupportEmail";

// Email type enum for strict type checking
export enum EmailType {
  SUPPORT_TICKET = "SUPPORT_TICKET",
  BOOKING_CONFIRMATION = "BOOKING_CONFIRMATION",
  TRANSACTION = "TRANSACTION",
  OTP = "OTP",
  GENERAL = "GENERAL",
}

// Base email payload
type BaseEmailPayload = {
  emailType: EmailType;
};

// Support ticket email payload
type SupportTicketEmailPayload = BaseEmailPayload & {
  emailType: EmailType.SUPPORT_TICKET;
  ticketId: string;
  category: string;
  subject: string;
  description: string;
  userName: string;
  userEmail: string;
  createdAt?: string;
};

// Booking confirmation email payload
type BookingConfirmationEmailPayload = BaseEmailPayload & {
  emailType: EmailType.BOOKING_CONFIRMATION;
  to: string;
  name: string;
  eventName: string;
  eventDate: string;
  eventTime?: string;
  venue: string;
  ticketQty: number;
  bookingId: string;
  ticketLink: string;
};

// Union type for all email payloads
type EmailPayload = SupportTicketEmailPayload | BookingConfirmationEmailPayload;

/**
 * Central email dispatcher - routes emails to correct provider
 * 
 * STRICT RULES:
 * 1. Support tickets → RESEND (isolated, no other validation)
 * 2. All other emails → MSG91 (booking confirmations, transactions, OTPs)
 * 
 * This ensures provider separation even if other "rules" are added later.
 */
export async function dispatchEmail(payload: EmailPayload): Promise<void> {
  console.log("[Email Dispatcher] Routing email of type:", payload.emailType);

  // RULE 1: Support tickets ALWAYS use RESEND (isolated check, no other conditions)
  if (payload.emailType === EmailType.SUPPORT_TICKET) {
    console.log("[Email Dispatcher] → Routing to RESEND (Support Ticket)");
    const supportPayload = payload as SupportTicketEmailPayload;
    await sendSupportEmail({
      ticketId: supportPayload.ticketId,
      category: supportPayload.category,
      subject: supportPayload.subject,
      description: supportPayload.description,
      userName: supportPayload.userName,
      userEmail: supportPayload.userEmail,
      createdAt: supportPayload.createdAt,
    });
    return;
  }

  // RULE 2: All other email types use MSG91
  // (Booking confirmations, transactions, OTPs, general)
  console.log("[Email Dispatcher] → Routing to MSG91 (Main/Transaction Email)");
  
  if (payload.emailType === EmailType.BOOKING_CONFIRMATION) {
    const bookingPayload = payload as BookingConfirmationEmailPayload;
    await sendTicketEmail({
      to: bookingPayload.to,
      name: bookingPayload.name,
      eventName: bookingPayload.eventName,
      eventDate: bookingPayload.eventDate,
      eventTime: bookingPayload.eventTime,
      venue: bookingPayload.venue,
      ticketQty: bookingPayload.ticketQty,
      bookingId: bookingPayload.bookingId,
      ticketLink: bookingPayload.ticketLink,
    });
    return;
  }

  // Future email types (OTP, TRANSACTION, GENERAL) will also use MSG91
  // TypeScript exhaustiveness check - should never reach here with current types
  const exhaustiveCheck: never = payload;
  throw new Error(`Unhandled email type: ${(exhaustiveCheck as any).emailType}`);
}

/**
 * Helper: Send booking confirmation email (enforces MSG91 via dispatcher)
 */
export async function sendBookingConfirmation(payload: Omit<BookingConfirmationEmailPayload, "emailType">): Promise<void> {
  await dispatchEmail({
    ...payload,
    emailType: EmailType.BOOKING_CONFIRMATION,
  });
}

/**
 * Helper: Send support ticket email (enforces RESEND via dispatcher)
 */
export async function sendSupportTicket(payload: Omit<SupportTicketEmailPayload, "emailType">): Promise<void> {
  await dispatchEmail({
    ...payload,
    emailType: EmailType.SUPPORT_TICKET,
  });
}

