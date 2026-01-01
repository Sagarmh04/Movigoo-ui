"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export function useUserBookings(userId: string | null) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchBookings() {
    if (!userId || !db) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!db) {
        console.error("❌ Firestore is not initialized");
        setError("Firestore not initialized");
        setBookings([]);
        setLoading(false);
        return;
      }

      const globalBookingsRef = collection(db, "bookings");
      let globalSnapshot;

      try {
        // Try optimized query with bookingStatus filter (requires composite index)
        const globalQ = query(
          globalBookingsRef,
          where("userId", "==", userId),
          where("bookingStatus", "==", "CONFIRMED"),
          orderBy("createdAt", "desc")
        );
        globalSnapshot = await getDocs(globalQ);
      } catch (indexError: any) {
        if (indexError.code === "failed-precondition" || indexError.message?.includes("index")) {
          console.warn("Firestore index not ready, fetching without status filter:", indexError);
          // Fallback: fetch all user bookings, filter client-side
          const globalQWithoutStatus = query(
            globalBookingsRef,
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
          );
          globalSnapshot = await getDocs(globalQWithoutStatus);

          const docs = globalSnapshot.docs.map((doc) => ({
            bookingId: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          })) as any[];

          docs.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
          });

          const confirmedBookings = docs.filter((booking) => {
            const status = booking.bookingStatus || booking.status;
            return status === "CONFIRMED" || status === "confirmed";
          });

          setBookings(confirmedBookings);
          setLoading(false);
          return;
        } else {
          throw indexError;
        }
      }

      // Map bookings (already filtered by query, but check paymentStatus too)
      const confirmedBookings = globalSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          // Double-check payment status (webhook sets both bookingStatus and paymentStatus)
          const bookingStatus = data.bookingStatus || data.status;
          const paymentStatus = data.paymentStatus;
          
          // Only include if confirmed and payment successful
          if (
            (bookingStatus === "CONFIRMED" || bookingStatus === "confirmed") &&
            (paymentStatus === "SUCCESS" || paymentStatus === "confirmed" || !paymentStatus)
          ) {
            return {
              bookingId: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            };
          }
          return null;
        })
        .filter((b) => b !== null) as any[];

      // Already sorted by query, but ensure descending order
      confirmedBookings.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      setBookings(confirmedBookings);
    } catch (err: any) {
      console.error("Error fetching user bookings:", err);
      setError(err.message || "Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function reconcilePending(getIdToken: () => Promise<string>) {
    try {
      const token = await getIdToken();
      await fetch("/api/payments/cashfree/reconcile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // ignore reconcile errors
    }
  }

  useEffect(() => {
    if (!userId || !db) {
      setBookings([]);
      setLoading(false);
      return;
    }

    fetchBookings();
  }, [userId]);

  return { bookings, loading, error, refetch: fetchBookings, reconcilePending };
}

