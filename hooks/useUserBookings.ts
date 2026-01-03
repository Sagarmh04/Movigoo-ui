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
        // Try optimized query with bookingStatus AND paymentStatus filter (requires composite index)
        // This ensures we only fetch confirmed + successful bookings from Firestore
        const globalQ = query(
          globalBookingsRef,
          where("userId", "==", userId),
          where("bookingStatus", "==", "CONFIRMED"),
          where("paymentStatus", "==", "SUCCESS"),
          orderBy("createdAt", "desc")
        );
        globalSnapshot = await getDocs(globalQ);
      } catch (indexError: any) {
        if (indexError.code === "failed-precondition" || indexError.message?.includes("index")) {
          console.warn("Firestore composite index not ready, trying fallback queries:", indexError);
          // Fallback: Try with just bookingStatus filter (single field index)
          try {
            const globalQWithBookingStatus = query(
              globalBookingsRef,
              where("userId", "==", userId),
              where("bookingStatus", "==", "CONFIRMED"),
              orderBy("createdAt", "desc")
            );
            globalSnapshot = await getDocs(globalQWithBookingStatus);
          } catch (singleIndexError: any) {
            // If that also fails, fetch all and filter client-side
            console.warn("Single field index also not ready, fetching all and filtering client-side:", singleIndexError);
            const globalQWithoutStatus = query(
              globalBookingsRef,
              where("userId", "==", userId),
              orderBy("createdAt", "desc")
            );
            globalSnapshot = await getDocs(globalQWithoutStatus);
          }
        } else {
          throw indexError;
        }
      }

      // Map bookings (already filtered by query, but check paymentStatus too)
      const confirmedBookings = globalSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          // Double-check payment status (webhook sets both bookingStatus and paymentStatus)
          const bookingStatus = (data.bookingStatus || data.status || "").toUpperCase();
          const paymentStatus = (data.paymentStatus || "").toUpperCase();
          
          // STRICT: Only include if CONFIRMED AND payment SUCCESS
          // This excludes: PENDING, FAILED, CANCELLED, and bookings without proper status
          if (bookingStatus === "CONFIRMED" && paymentStatus === "SUCCESS") {
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

