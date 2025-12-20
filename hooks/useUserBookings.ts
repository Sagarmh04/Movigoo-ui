"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export function useUserBookings(userId: string | null) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !db) {
      setBookings([]);
      setLoading(false);
      return;
    }

    async function fetchBookings() {
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

        // Fetch from /users/{userId}/bookings
        // TypeScript: db is guaranteed to be non-null here due to the check above
        const userBookingsRef = collection(db, "users", userId!, "bookings");
        const q = query(userBookingsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const userBookings = snapshot.docs.map((doc) => ({
          bookingId: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }));

        // Also check global bookings collection and filter by userId
        // This query requires a composite index: userId (ASC) + createdAt (DESC)
        if (db) {
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
            // If index is not ready, try without orderBy
            if (indexError.code === "failed-precondition" || indexError.message?.includes("index")) {
              console.warn("Firestore index not ready, fetching without orderBy:", indexError);
              const globalQWithoutOrder = query(
                globalBookingsRef,
                where("userId", "==", userId)
              );
              globalSnapshot = await getDocs(globalQWithoutOrder);
              
              // Sort manually in memory
              const docs = globalSnapshot.docs.map((doc) => ({
                bookingId: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              }));
              
              docs.sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA; // Descending
              });
              
              // Merge with userBookings
              const allBookings = [...userBookings, ...docs];
              const uniqueBookings = allBookings.reduce((acc, booking) => {
                if (!acc.find((b) => b.bookingId === booking.bookingId)) {
                  acc.push(booking);
                }
                return acc;
              }, [] as any[]);
              
              // Filter to only show CONFIRMED bookings
              const confirmedBookings = uniqueBookings.filter((booking) => {
                const status = booking.bookingStatus || booking.status;
                return status === "CONFIRMED" || status === "confirmed";
              });
              
              // Sort by createdAt desc
              confirmedBookings.sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA;
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
          }));

          // Merge and deduplicate by bookingId
          const allBookings = [...userBookings, ...globalBookings];
          const uniqueBookings = allBookings.reduce((acc, booking) => {
            if (!acc.find((b) => b.bookingId === booking.bookingId)) {
              acc.push(booking);
            }
            return acc;
          }, [] as any[]);

          // Filter to only show CONFIRMED bookings
          const confirmedBookings = uniqueBookings.filter((booking) => {
            const status = booking.bookingStatus || booking.status;
            return status === "CONFIRMED" || status === "confirmed";
          });

          // Sort by createdAt desc
          confirmedBookings.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
          });

          setBookings(confirmedBookings);
        } else {
          // If db is null, just use userBookings
          // Filter to only show CONFIRMED bookings
          const confirmedBookings = userBookings.filter((booking) => {
            const status = booking.bookingStatus || booking.status;
            return status === "CONFIRMED" || status === "confirmed";
          });
          setBookings(confirmedBookings);
        }
      } catch (err: any) {
        console.error("Error fetching user bookings:", err);
        setError(err.message || "Failed to load bookings");
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, [userId]);

  return { bookings, loading, error };
}

