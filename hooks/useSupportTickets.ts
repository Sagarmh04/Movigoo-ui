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
    
    console.log("[useSupportTickets] Subscribing to tickets for userId:", userId);

    // Helper function to process tickets
    const processTickets = (snapshot: any) => {
      const ticketList: SupportTicket[] = [];
      snapshot.forEach((doc: any) => {
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
      
      // Sort by updatedAt client-side (always sort, even if query has orderBy)
      ticketList.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA;
      });
      
      setTickets(ticketList);
      setLoading(false);
    };

    // Try query with orderBy first (requires composite index)
    const qWithOrderBy = query(
      ticketsRef,
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );

    let unsubscribe: (() => void) | null = null;

    unsubscribe = onSnapshot(
      qWithOrderBy,
      (snapshot) => {
        console.log("[useSupportTickets] Snapshot received, docs count:", snapshot.size);
        processTickets(snapshot);
      },
      (err) => {
        console.error("[useSupportTickets] Error fetching support tickets:", err);
        console.error("[useSupportTickets] Error code:", err.code);
        
        // If index error, try simpler query without orderBy
        if (err.code === "failed-precondition" || err.message?.includes("index")) {
          console.warn("[useSupportTickets] Index not ready, falling back to simple query");
          
          // Fallback: query without orderBy (no index required)
          const simpleQuery = query(
            ticketsRef,
            where("userId", "==", userId)
          );
          
          // Unsubscribe from the failed query and set up fallback
          if (unsubscribe) {
            unsubscribe();
          }
          
          unsubscribe = onSnapshot(
            simpleQuery,
            (snapshot) => {
              console.log("[useSupportTickets] Fallback query - docs count:", snapshot.size);
              processTickets(snapshot);
            },
            (fallbackErr) => {
              console.error("[useSupportTickets] Fallback query also failed:", fallbackErr);
              setError(fallbackErr.message);
              setLoading(false);
            }
          );
        } else {
          setError(err.message);
          setLoading(false);
        }
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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
