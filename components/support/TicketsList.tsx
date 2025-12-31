// components/support/TicketsList.tsx
// Left-side tickets list component - PhonePe style

"use client";

import { motion } from "framer-motion";
import { Clock, CheckCircle, Plus } from "lucide-react";
import { SupportTicket, SupportTicketStatus } from "@/types/supportTicket";

type TicketsListProps = {
  tickets: SupportTicket[];
  selectedTicketId: string | null;
  onSelectTicket: (ticketId: string) => void;
  onCreateTicket?: () => void;
  loading?: boolean;
};

const statusConfig: Record<SupportTicketStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  OPEN: {
    label: "Open",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    dotColor: "bg-blue-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    dotColor: "bg-yellow-400",
  },
  RESOLVED: {
    label: "Resolved",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    dotColor: "bg-green-400",
  },
  CLOSED: {
    label: "Closed",
    color: "text-slate-400",
    bgColor: "bg-slate-500/20",
    dotColor: "bg-slate-400",
  },
};

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    }
  } catch {
    return "";
  }
}

export default function TicketsList({
  tickets,
  selectedTicketId,
  onSelectTicket,
  onCreateTicket,
  loading = false,
}: TicketsListProps) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[#0B62FF] border-t-transparent mx-auto" />
          <p className="text-sm text-slate-400">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <h2 className="text-lg font-semibold text-white">My Tickets</h2>
        {onCreateTicket && (
          <button
            onClick={onCreateTicket}
            className="flex items-center gap-1 rounded-lg bg-[#0B62FF] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#0A5AE6]"
          >
            <Plus size={16} />
            New
          </button>
        )}
      </div>

      {/* Tickets List */}
      <div className="flex-1 overflow-y-auto">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <Clock size={28} className="text-slate-500" />
            </div>
            <p className="text-white font-medium">No tickets yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Create a support ticket if you need help
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {tickets.map((ticket, index) => {
              const status = statusConfig[ticket.status];
              const isSelected = selectedTicketId === ticket.id;

              return (
                <motion.button
                  key={ticket.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelectTicket(ticket.id)}
                  className={`w-full p-4 text-left transition ${
                    isSelected
                      ? "bg-[#0B62FF]/10 border-l-2 border-l-[#0B62FF]"
                      : "hover:bg-white/5 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isSelected ? "text-white" : "text-slate-200"}`}>
                        {ticket.subject}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 truncate">
                        {ticket.category}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-slate-500">
                        {formatDate(ticket.createdAt)}
                      </span>
                      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${status.bgColor} ${status.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dotColor}`} />
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                    {ticket.description}
                  </p>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
