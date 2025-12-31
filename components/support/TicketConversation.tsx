// components/support/TicketConversation.tsx
// Right-side ticket detail view with conversation - PhonePe style

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Clock, CheckCircle, AlertCircle, ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupportTicket, SupportTicketStatus } from "@/types/supportTicket";

type TicketConversationProps = {
  ticket: SupportTicket;
  onBack?: () => void;
  showBackButton?: boolean;
};

const statusConfig: Record<SupportTicketStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  OPEN: {
    label: "Open",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    icon: <Clock size={14} />,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    icon: <Clock size={14} />,
  },
  RESOLVED: {
    label: "Resolved",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    icon: <CheckCircle size={14} />,
  },
  CLOSED: {
    label: "Closed",
    color: "text-slate-400",
    bgColor: "bg-slate-500/20",
    icon: <CheckCircle size={14} />,
  },
};

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export default function TicketConversation({ ticket, onBack, showBackButton = false }: TicketConversationProps) {
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const status = statusConfig[ticket.status];
  const isTicketClosed = ticket.status === "CLOSED" || ticket.status === "RESOLVED";

  const handleSendReply = async () => {
    if (!replyMessage.trim() || isTicketClosed) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/support-tickets/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          message: replyMessage.trim(),
        }),
      });

      if (response.ok) {
        setReplyMessage("");
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-white/10 p-4">
        <div className="flex items-start gap-3">
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="mt-1 rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">{ticket.subject}</h2>
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${status.bgColor} ${status.color}`}>
                {status.icon}
                {status.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">{ticket.category}</p>
            <p className="text-xs text-slate-500">Created {formatDate(ticket.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Conversation Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Initial ticket message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#0B62FF] p-4">
            <p className="text-sm text-white whitespace-pre-wrap">{ticket.description}</p>
            <p className="mt-2 text-right text-xs text-white/60">
              {formatDate(ticket.createdAt)}
            </p>
          </div>
        </motion.div>

        {/* Messages */}
        {ticket.messages && ticket.messages.length > 0 ? (
          ticket.messages.map((msg, index) => (
            <motion.div
              key={msg.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.senderType === "user"
                    ? "rounded-tr-sm bg-[#0B62FF]"
                    : "rounded-tl-sm bg-white/10"
                }`}
              >
                {msg.senderType === "support" && (
                  <p className="mb-1 text-xs font-medium text-[#0B62FF]">Support Team</p>
                )}
                <p className="text-sm text-white whitespace-pre-wrap">{msg.message}</p>
                <p className={`mt-2 text-right text-xs ${msg.senderType === "user" ? "text-white/60" : "text-slate-500"}`}>
                  {formatDate(msg.createdAt)}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          /* No replies yet */
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
              <MessageSquare size={24} className="text-slate-500" />
            </div>
            <p className="text-sm text-slate-400">No replies yet</p>
            <p className="text-xs text-slate-500">Our team will respond soon</p>
          </div>
        )}

        {/* Admin response (legacy field) */}
        {ticket.adminResponse && !ticket.messages?.length && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white/10 p-4">
              <p className="mb-1 text-xs font-medium text-[#0B62FF]">Support Team</p>
              <p className="text-sm text-white whitespace-pre-wrap">{ticket.adminResponse}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Reply Input */}
      <div className="border-t border-white/10 p-4">
        {isTicketClosed ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-white/5 p-4 text-sm text-slate-400">
            <AlertCircle size={16} />
            This ticket is {ticket.status.toLowerCase()}. You cannot reply.
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isSending}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply()}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-[#0B62FF] disabled:opacity-50"
            />
            <Button
              onClick={handleSendReply}
              disabled={isSending || !replyMessage.trim()}
              className="rounded-xl bg-[#0B62FF] px-4 hover:bg-[#0A5AE6] disabled:opacity-50"
            >
              {isSending ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send size={18} />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
