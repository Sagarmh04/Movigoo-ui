// app/support-tickets/page.tsx
// Support tickets page with master-detail layout - PhonePe style

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import LayoutWrapper from "@/components/LayoutWrapper";
import TicketsList from "@/components/support/TicketsList";
import TicketConversation from "@/components/support/TicketConversation";
import SupportTicketModal from "@/components/support/SupportTicketModal";
import { useAuth } from "@/hooks/useAuth";
import { useSupportTickets } from "@/hooks/useSupportTickets";

export default function SupportTicketsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { tickets, loading: ticketsLoading } = useSupportTickets(user?.uid || null);
  
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);

  // Get selected ticket
  const selectedTicket = selectedTicketId 
    ? tickets.find(t => t.id === selectedTicketId) || null 
    : null;

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      // Reset mobile detail view when switching to desktop
      if (window.innerWidth >= 768) {
        setIsMobileDetailView(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle ticket selection
  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    // On mobile, show detail view
    if (window.innerWidth < 768) {
      setIsMobileDetailView(true);
    }
  };

  // Handle back button on mobile
  const handleBack = () => {
    setIsMobileDetailView(false);
    setSelectedTicketId(null);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/profile?login=true&redirect=/support-tickets");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <LayoutWrapper>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#0B62FF] border-t-transparent mx-auto" />
            <p className="text-slate-400">Loading...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <LayoutWrapper>
      <div className="mx-auto w-full max-w-6xl pb-24">
        {/* Page Title */}
        <div className="mb-6 space-y-2">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Help & Support</h1>
          <p className="text-slate-400">View and manage your support tickets</p>
        </div>

        {/* Master-Detail Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
          style={{ height: "calc(100vh - 250px)", minHeight: "500px" }}
        >
          <div className="flex h-full">
            {/* Left Side - Tickets List */}
            <div
              className={`h-full border-r border-white/10 ${
                isMobileDetailView
                  ? "hidden md:block md:w-[340px]"
                  : "w-full md:w-[340px]"
              }`}
            >
              <TicketsList
                tickets={tickets}
                selectedTicketId={selectedTicketId}
                onSelectTicket={handleSelectTicket}
                onCreateTicket={() => setShowCreateModal(true)}
                loading={ticketsLoading}
              />
            </div>

            {/* Right Side - Ticket Conversation */}
            <div
              className={`flex-1 h-full ${
                isMobileDetailView
                  ? "block"
                  : "hidden md:block"
              }`}
            >
              {selectedTicket ? (
                <TicketConversation
                  ticket={selectedTicket}
                  onBack={handleBack}
                  showBackButton={isMobileDetailView}
                />
              ) : (
                /* Placeholder when no ticket selected */
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
                    <MessageSquare size={36} className="text-slate-500" />
                  </div>
                  <p className="text-lg font-medium text-white">Select a ticket</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Choose a ticket from the list to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Create Ticket Modal */}
      <SupportTicketModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        user={{
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        }}
      />
    </LayoutWrapper>
  );
}
