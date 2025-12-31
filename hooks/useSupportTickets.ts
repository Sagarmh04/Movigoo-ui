// hooks/useSupportTickets.ts
// Hook to fetch user's support tickets from Firestore

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { SupportTicket } from "@/types/supportTicket";

export function useSupportTickets(userId: string | null) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !db) {
      setTickets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ticketsRef = collection(db, "supportTickets");
    
    // Try query with orderBy first (requires index)
    let q = query(
      ticketsRef,
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );

    console.log("[useSupportTickets] Subscribing to tickets for userId:", userId);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("[useSupportTickets] Snapshot received, docs count:", snapshot.size);
        const ticketList: SupportTicket[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log("[useSupportTickets] Ticket found:", doc.id, "status:", data.status);
          ticketList.push({
            id: doc.id,
            category: data.category,
            subject: data.subject,
            description: data.description,
            status: data.status,
            priority: data.priority,
            userId: data.userId,
            userEmail: data.userEmail,
            userName: data.userName,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAtISO || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.createdAtISO || new Date().toISOString(),
            adminResponse: data.adminResponse,
            resolvedAt: data.resolvedAt?.toDate?.()?.toISOString(),
            messages: data.messages || [],
          });
        });
        console.log("[useSupportTickets] Total tickets loaded:", ticketList.length);
        
        // Sort by updatedAt client-side as fallback
        ticketList.sort((a, b) => {
          const dateA = new Date(a.updatedAt).getTime();
          const dateB = new Date(b.updatedAt).getTime();
          return dateB - dateA;
        });
        
        setTickets(ticketList);
        setLoading(false);
      },
      (err) => {
        console.error("[useSupportTickets] Error fetching support tickets:", err);
        console.error("[useSupportTickets] Error code:", err.code);
        
        // If index error, try simpler query without orderBy
        if (err.code === "failed-precondition" || err.message.includes("index")) {
          console.warn("[useSupportTickets] Index not ready, falling back to simple query");
          
          // Fallback: query without orderBy (no index required)
          const simpleQuery = query(
            ticketsRef,
            where("userId", "==", userId)
          );
          
          const fallbackUnsubscribe = onSnapshot(
            simpleQuery,
            (snapshot) => {
              console.log("[useSupportTickets] Fallback query - docs count:", snapshot.size);
              const ticketList: SupportTicket[] = [];
              snapshot.forEach((doc) => {
                const data = doc.data();
                ticketList.push({
                  id: doc.id,
                  category: data.category,
                  subject: data.subject,
                  description: data.description,
                  status: data.status,
                  priority: data.priority,
                  userId: data.userId,
                  userEmail: data.userEmail,
                  userName: data.userName,
                  createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAtISO || new Date().toISOString(),
                  updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.createdAtISO || new Date().toISOString(),
                  adminResponse: data.adminResponse,
                  resolvedAt: data.resolvedAt?.toDate?.()?.toISOString(),
                  messages: data.messages || [],
                });
              });
              
              // Sort client-side
              ticketList.sort((a, b) => {
                const dateA = new Date(a.updatedAt).getTime();
                const dateB = new Date(b.updatedAt).getTime();
                return dateB - dateA;
              });
              
              setTickets(ticketList);
              setLoading(false);
            },
            (fallbackErr) => {
              console.error("[useSupportTickets] Fallback query also failed:", fallbackErr);
              setError(fallbackErr.message);
              setLoading(false);
            }
          );
          
          return () => fallbackUnsubscribe();
        } else {
          setError(err.message);
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { tickets, loading, error };
}

export function useSupportTicket(ticketId: string | null, userId: string | null) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketId || !userId || !db) {
      setTicket(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ticketRef = doc(db, "supportTickets", ticketId);
    
    const unsubscribe = onSnapshot(
      ticketRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setTicket(null);
          setError("Ticket not found");
          setLoading(false);
          return;
        }

        const data = snapshot.data();
        
        // Security check: user can only view their own tickets
        if (data.userId !== userId) {
          setTicket(null);
          setError("Access denied");
          setLoading(false);
          return;
        }

        setTicket({
          id: snapshot.id,
          category: data.category,
          subject: data.subject,
          description: data.description,
          status: data.status,
          priority: data.priority,
          userId: data.userId,
          userEmail: data.userEmail,
          userName: data.userName,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAtISO || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.createdAtISO || new Date().toISOString(),
          adminResponse: data.adminResponse,
          resolvedAt: data.resolvedAt?.toDate?.()?.toISOString(),
          messages: data.messages || [],
        });
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching ticket:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ticketId, userId]);

  return { ticket, loading, error };
}
