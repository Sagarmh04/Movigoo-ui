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
    const q = query(
      ticketsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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
        setTickets(ticketList);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching support tickets:", err);
        setError(err.message);
        setLoading(false);
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
