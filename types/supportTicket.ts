// types/supportTicket.ts
// Support ticket type definitions

export type SupportTicketCategory =
  | "Payment & Refund"
  | "Amount Deducted but Ticket Not Booked"
  | "Refund Not Received"
  | "Ticket Cancellation"
  | "Event Issue"
  | "Account / Technical Issue";

export type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type SupportTicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type SupportTicket = {
  id: string;
  category: SupportTicketCategory;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  userId: string;
  userEmail: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
  // Optional fields for admin responses
  adminResponse?: string;
  resolvedAt?: string;
};

export const SUPPORT_TICKET_CATEGORIES: SupportTicketCategory[] = [
  "Payment & Refund",
  "Amount Deducted but Ticket Not Booked",
  "Refund Not Received",
  "Ticket Cancellation",
  "Event Issue",
  "Account / Technical Issue",
];
