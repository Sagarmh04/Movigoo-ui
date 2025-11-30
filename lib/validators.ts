import { TicketType } from "@/types/event";

export function validateTicketSelection(selection: Record<string, number>, tickets: TicketType[]) {
  const errors: string[] = [];
  const payload: { ticketTypeId: string; quantity: number }[] = [];

  tickets.forEach((ticket) => {
    const qty = selection[ticket.id] ?? 0;
    if (qty > 0) {
      if (qty > ticket.available) {
        errors.push(`${ticket.name} exceeds available quantity.`);
      }
      if (qty > ticket.maxPerOrder) {
        errors.push(`${ticket.name} allows only ${ticket.maxPerOrder} per order.`);
      }
      payload.push({ ticketTypeId: ticket.id, quantity: qty });
    }
  });

  if (!payload.length) {
    errors.push("Select at least one ticket.");
  }

  return { errors, payload };
}

