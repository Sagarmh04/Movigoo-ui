// components/support/SupportTicketModal.tsx
// Support ticket creation modal - reuses existing Modal and form styles

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORT_TICKET_CATEGORIES, SupportTicketCategory } from "@/types/supportTicket";

type SupportTicketModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
  };
};

export default function SupportTicketModal({ isOpen, onClose, user }: SupportTicketModalProps) {
  const [category, setCategory] = useState<SupportTicketCategory | "">("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !subject.trim() || !description.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          description: description.trim(),
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || user.email?.split("@")[0] || "User",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create ticket");
      }

      setSuccess(true);
      // Reset form after short delay
      setTimeout(() => {
        setCategory("");
        setSubject("");
        setDescription("");
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setCategory("");
      setSubject("");
      setDescription("");
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/95 p-6 backdrop-blur-xl sm:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">Raise Support Ticket</h2>
            <p className="mt-1 text-sm text-slate-400">
              We&apos;ll get back to you as soon as possible
            </p>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 py-8 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Ticket Submitted!</p>
                <p className="text-sm text-slate-400">
                  We&apos;ll respond to your query soon
                </p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Select */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#0B62FF] disabled:opacity-50"
                >
                  <option value="" className="bg-slate-900">Select a category</option>
                  {SUPPORT_TICKET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Input */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your issue"
                  disabled={isLoading}
                  maxLength={100}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-[#0B62FF] disabled:opacity-50"
                />
              </div>

              {/* Description Textarea */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe your issue in detail..."
                  disabled={isLoading}
                  rows={4}
                  maxLength={1000}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-[#0B62FF] disabled:opacity-50"
                />
                <p className="mt-1 text-right text-xs text-slate-500">
                  {description.length}/1000
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-400"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !category || !subject.trim() || !description.trim()}
                className="w-full rounded-2xl bg-[#0B62FF] px-8 py-6 text-base font-semibold hover:bg-[#0A5AE6] disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send size={18} />
                    Submit Ticket
                  </span>
                )}
              </Button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
