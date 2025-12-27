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
        const globalQ = query(
          globalBookingsRef,
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );
        globalSnapshot = await getDocs(globalQ);
      } catch (indexError: any) {
        if (indexError.code === "failed-precondition" || indexError.message?.includes("index")) {
          console.warn("Firestore index not ready, fetching without orderBy:", indexError);
          const globalQWithoutOrder = query(
            globalBookingsRef,
            where("userId", "==", userId)
          );
          globalSnapshot = await getDocs(globalQWithoutOrder);

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

      const globalBookings = globalSnapshot.docs.map((doc) => ({
        bookingId: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as any[];

      const confirmedBookings = globalBookings.filter((booking) => {
        const status = booking.bookingStatus || booking.status;
        return status === "CONFIRMED" || status === "confirmed";
      });

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

